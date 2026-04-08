"""
dump_il2cpp_classes.py
======================
Enumerates every IL2CPP class and its methods from UmamusumePrettyDerby.exe
via the IL2CPP runtime API exported by GameAssembly.dll.

This is a *static* dump — it reflects everything loaded into the process,
not just what is active on screen.  Use it to search for class/method names
by keyword before writing a targeted hook.

Usage
-----
    python dump_il2cpp_classes.py [options]

    --filter KEYWORD   Only include classes whose "Namespace.ClassName" contains
                       KEYWORD (case-insensitive).  Repeatable — all keywords
                       must match (AND logic).
    --output FILE      Output JSON path (default: il2cpp_dump.json)

Examples
--------
    # Find every class/method related to support cards
    python dump_il2cpp_classes.py --filter SupportCard

    # Find character / roster related classes in the Gallop namespace
    python dump_il2cpp_classes.py --filter Gallop --filter Chara

    # Dump everything (takes ~60-120 s, produces a large file)
    python dump_il2cpp_classes.py --output all_classes.json
"""

import argparse
import json
import sys
import threading
from pathlib import Path

import frida

# ---------------------------------------------------------------------------
# Frida JavaScript injected into the game process
# ---------------------------------------------------------------------------
# The placeholder FILTER_JSON is replaced with the actual filter list at
# runtime before the script is loaded.
# ---------------------------------------------------------------------------

FRIDA_SCRIPT = r"""
'use strict';

// ── helpers ────────────────────────────────────────────────────────────────

function readStr(ptr) {
    if (!ptr || ptr.isNull()) return "";
    try { return ptr.readUtf8String() || ""; } catch (_) { return ""; }
}

// Find GameAssembly dynamically — module name varies across installs/Frida versions.
const gameAsmModule = Process.enumerateModules().find(m => m.name.toLowerCase().includes('gameassembly'));
if (!gameAsmModule) {
    const loaded = Process.enumerateModules().map(m => m.name).join(', ');
    send({ type: 'done', data: [], total: 0 });
    throw new Error('GameAssembly module not found. Loaded modules: ' + loaded);
}
const GAME_MODULE = gameAsmModule.name;

function resolve(name) {
    const addr = gameAsmModule.findExportByName(name);
    if (!addr) throw new Error("Export not found in " + GAME_MODULE + ": " + name);
    return addr;
}

// ── IL2CPP API bindings ────────────────────────────────────────────────────

const il2cpp_domain_get = new NativeFunction(
    resolve("il2cpp_domain_get"), 'pointer', []);

const il2cpp_domain_get_assemblies = new NativeFunction(
    resolve("il2cpp_domain_get_assemblies"), 'pointer', ['pointer', 'pointer']);

const il2cpp_assembly_get_image = new NativeFunction(
    resolve("il2cpp_assembly_get_image"), 'pointer', ['pointer']);

const il2cpp_image_get_name = new NativeFunction(
    resolve("il2cpp_image_get_name"), 'pointer', ['pointer']);

const il2cpp_image_get_class_count = new NativeFunction(
    resolve("il2cpp_image_get_class_count"), 'uint32', ['pointer']);

const il2cpp_image_get_class = new NativeFunction(
    resolve("il2cpp_image_get_class"), 'pointer', ['pointer', 'uint32']);

const il2cpp_class_get_name = new NativeFunction(
    resolve("il2cpp_class_get_name"), 'pointer', ['pointer']);

const il2cpp_class_get_namespace = new NativeFunction(
    resolve("il2cpp_class_get_namespace"), 'pointer', ['pointer']);

const il2cpp_class_get_methods = new NativeFunction(
    resolve("il2cpp_class_get_methods"), 'pointer', ['pointer', 'pointer']);

const il2cpp_method_get_name = new NativeFunction(
    resolve("il2cpp_method_get_name"), 'pointer', ['pointer']);

const il2cpp_method_get_param_count = new NativeFunction(
    resolve("il2cpp_method_get_param_count"), 'uint32', ['pointer']);

// ── filtering ──────────────────────────────────────────────────────────────

const FILTERS = FILTER_JSON; // replaced by Python before load

function matches(ns, name) {
    if (FILTERS.length === 0) return true;
    const full = (ns + "." + name).toLowerCase();
    return FILTERS.every(f => full.includes(f));
}

// ── method iterator ────────────────────────────────────────────────────────

function getMethods(klass) {
    const methods = [];
    // il2cpp_class_get_methods uses a void* iterator: pass pointer-to-null,
    // call repeatedly until it returns NULL.
    const iter = Memory.alloc(Process.pointerSize);
    iter.writePointer(ptr(0));
    for (;;) {
        const m = il2cpp_class_get_methods(klass, iter);
        if (!m || m.isNull()) break;
        const mname = readStr(il2cpp_method_get_name(m));
        if (mname) {
            methods.push({ name: mname, params: il2cpp_method_get_param_count(m) });
        }
    }
    return methods;
}

// ── main enumeration ───────────────────────────────────────────────────────

function run() {
    const domain = il2cpp_domain_get();

    // il2cpp_domain_get_assemblies writes the count into a size_t.
    // Allocate 8 bytes (safe for both 32- and 64-bit size_t).
    const sizePtr = Memory.alloc(8);
    sizePtr.writeU64(0);
    const assembliesPtr = il2cpp_domain_get_assemblies(domain, sizePtr);
    const numAssemblies = sizePtr.readU32(); // count fits comfortably in 32 bits

    send({ type: 'progress', msg: 'Found ' + numAssemblies + ' assemblies' });

    const results = [];
    let totalClasses = 0;

    for (let i = 0; i < numAssemblies; i++) {
        const assembly = assembliesPtr.add(i * Process.pointerSize).readPointer();
        if (!assembly || assembly.isNull()) continue;

        const image = il2cpp_assembly_get_image(assembly);
        if (!image || image.isNull()) continue;

        const imageName  = readStr(il2cpp_image_get_name(image));
        const classCount = il2cpp_image_get_class_count(image);
        let   imageHits  = 0;

        for (let j = 0; j < classCount; j++) {
            const klass = il2cpp_image_get_class(image, j);
            if (!klass || klass.isNull()) continue;

            const name = readStr(il2cpp_class_get_name(klass));
            const ns   = readStr(il2cpp_class_get_namespace(klass));
            if (!name) continue;
            if (!matches(ns, name)) continue;

            results.push({
                assembly: imageName,
                namespace: ns,
                name: name,
                methods: getMethods(klass)
            });
            imageHits++;
            totalClasses++;
        }

        if (imageHits > 0) {
            send({ type: 'progress', msg: '  ' + imageName + ': ' + imageHits + ' classes' });
        }
    }

    send({ type: 'done', data: results, total: totalClasses });
}

run();
"""

# ---------------------------------------------------------------------------
# Python driver
# ---------------------------------------------------------------------------

def attach(process_name: str) -> frida.core.Session:
    try:
        return frida.attach(process_name)
    except frida.ProcessNotFoundError:
        return None


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Dump IL2CPP class/method names from UmamusumePrettyDerby.exe"
    )
    parser.add_argument(
        "--filter", metavar="KEYWORD", action="append", default=[],
        help=(
            "Only include classes whose Namespace.ClassName contains KEYWORD "
            "(case-insensitive). Repeatable — all keywords must match."
        ),
    )
    parser.add_argument(
        "--output", metavar="FILE", default="il2cpp_dump.json",
        help="Output JSON file (default: il2cpp_dump.json)",
    )
    args = parser.parse_args()

    # Inject filters into the Frida script
    filter_json = json.dumps([f.lower() for f in args.filter])
    script_src  = FRIDA_SCRIPT.replace("FILTER_JSON", filter_json)

    # Attach
    session = attach("UmamusumePrettyDerby.exe") or attach("umamusume")
    if session is None:
        print("[!] UmamusumePrettyDerby.exe not found — is the game running?")
        sys.exit(1)

    if args.filter:
        print(f"[*] Keyword filter: {' AND '.join(args.filter)}")
    else:
        print("[*] No filter — dumping ALL classes (this takes 60-120 s)")

    # Collect results
    result_classes: list = []
    done_event = threading.Event()

    script = session.create_script(script_src)

    def on_message(message, _data):
        if message["type"] == "send":
            p = message["payload"]
            if p["type"] == "progress":
                print(p["msg"])
            elif p["type"] == "done":
                result_classes.extend(p["data"])
                print(f"\n[*] Enumeration complete — {p['total']} matching classes")
                done_event.set()
        elif message["type"] == "error":
            print(f"[!] Script error:\n{message['stack']}")
            done_event.set()

    script.on("message", on_message)
    print("[*] Enumerating…")
    script.load()

    if not done_event.wait(timeout=300):
        print("[!] Timed out after 300 s")

    session.detach()

    # Write output
    out = Path(args.output)
    out.write_text(json.dumps(result_classes, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[*] Written to {out}  ({len(result_classes)} classes)")

    # Print a quick inline summary when a filter is active
    if args.filter and result_classes:
        print("\n── Summary (first 40 results) ────────────────────────────────────")
        for entry in result_classes[:40]:
            ns      = entry["namespace"]
            name    = entry["name"]
            methods = [m["name"] for m in entry["methods"][:6]]
            trail   = "…" if len(entry["methods"]) > 6 else ""
            label   = f"[{ns}] " if ns else ""
            print(f"  {label}{name}")
            if methods:
                print(f"      → {', '.join(methods)}{trail}")
        if len(result_classes) > 40:
            print(f"  … {len(result_classes) - 40} more — see {out}")


if __name__ == "__main__":
    main()
