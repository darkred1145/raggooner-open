"""
extract_game_data.py
=====================
Extracts skill, character, and support-card name data from the running
Umamusume Pretty Derby process via IL2CPP runtime hooks, producing clean
JSON data files that can replace third-party sources (umdb.binarypb etc.).

Workflow
--------
Phase 1 — Discovery:
    Runs an embedded IL2CPP class dumper with relevant keywords to find
    the correct class/method names for skill, chara, and card data.

Phase 2 — Extraction:
    Installs hooks on the discovered classes and waits for the user to
    navigate to the appropriate game screens, then dumps the data.

Usage
-----
1. Start the game and log in.
2. Run:  python extract_game_data.py
3. Follow on-screen prompts.
4. Output:  skills.json, charas.json, cards.json
"""

import argparse
import json
import re
import sys
import threading
import time
from pathlib import Path

import frida


# ---------------------------------------------------------------------------
# Frida JS — shared utilities & IL2CPP API
# ---------------------------------------------------------------------------

FRIDA_BOOTSTRAP = r"""
'use strict';

function readUtf8(ptr) {
    if (!ptr || ptr.isNull()) return '';
    try { return ptr.readUtf8String() || ''; } catch (_) { return ''; }
}

function readIL2CppString(strPtr) {
    if (!strPtr || strPtr.isNull()) return null;
    try {
        const len = strPtr.add(0x10).readS32();
        if (len <= 0 || len > 2048) return null;
        return strPtr.add(0x14).readUtf16String(len);
    } catch (_) { return null; }
}

function readListElements(listPtr) {
    if (!listPtr || listPtr.isNull())
        return { elements: [], isValueType: false, stride: 8 };
    try {
        const arrayPtr = listPtr.add(0x10).readPointer();
        const size     = listPtr.add(0x18).readS32();
        if (!arrayPtr || arrayPtr.isNull() || size <= 0 || size > 50000)
            return { elements: [], isValueType: false, stride: 8 };
        const arrayClass = il2cpp_object_get_class(arrayPtr);
        const elemClass  = il2cpp_class_get_element_class(arrayClass);
        const isValueType = elemClass && !elemClass.isNull()
            && il2cpp_class_is_valuetype(elemClass) !== 0;
        let elements;
        let stride;
        if (isValueType) {
            stride = il2cpp_class_array_element_size(elemClass);
            elements = [];
            for (let i = 0; i < size; i++)
                elements.push(arrayPtr.add(0x20 + i * stride));
        } else {
            stride = 8;
            elements = [];
            for (let i = 0; i < size; i++) {
                const e = arrayPtr.add(0x20 + i * 8).readPointer();
                if (e && !e.isNull()) elements.push(e);
            }
        }
        return { elements, isValueType, stride };
    } catch (_) {
        return { elements: [], isValueType: false, stride: 8 };
    }
}

// ── IL2CPP API ───────────────────────────────────────────────────────────

const gameAsmModule = Process.enumerateModules().find(
    m => m.name.toLowerCase().includes('gameassembly'));
if (!gameAsmModule) {
    send({ type: 'error', msg: 'GameAssembly module not found' });
    throw new Error('abort');
}

function resolveExport(name) {
    const addr = gameAsmModule.findExportByName(name);
    if (!addr) throw new Error('Export not found: ' + name);
    return addr;
}

const il2cpp_domain_get = new NativeFunction(
    resolveExport('il2cpp_domain_get'), 'pointer', []);
const il2cpp_domain_get_assemblies = new NativeFunction(
    resolveExport('il2cpp_domain_get_assemblies'), 'pointer', ['pointer', 'pointer']);
const il2cpp_assembly_get_image = new NativeFunction(
    resolveExport('il2cpp_assembly_get_image'), 'pointer', ['pointer']);
const il2cpp_image_get_name = new NativeFunction(
    resolveExport('il2cpp_image_get_name'), 'pointer', ['pointer']);
const il2cpp_image_get_class_count = new NativeFunction(
    resolveExport('il2cpp_image_get_class_count'), 'uint32', ['pointer']);
const il2cpp_image_get_class = new NativeFunction(
    resolveExport('il2cpp_image_get_class'), 'pointer', ['pointer', 'uint32']);
const il2cpp_class_from_name = new NativeFunction(
    resolveExport('il2cpp_class_from_name'), 'pointer', ['pointer', 'pointer', 'pointer']);
const il2cpp_class_get_name = new NativeFunction(
    resolveExport('il2cpp_class_get_name'), 'pointer', ['pointer']);
const il2cpp_class_get_namespace = new NativeFunction(
    resolveExport('il2cpp_class_get_namespace'), 'pointer', ['pointer']);
const il2cpp_class_get_methods = new NativeFunction(
    resolveExport('il2cpp_class_get_methods'), 'pointer', ['pointer', 'pointer']);
const il2cpp_class_get_method_from_name = new NativeFunction(
    resolveExport('il2cpp_class_get_method_from_name'), 'pointer', ['pointer', 'pointer', 'int']);
const il2cpp_method_get_name = new NativeFunction(
    resolveExport('il2cpp_method_get_name'), 'pointer', ['pointer']);
const il2cpp_method_get_param_count = new NativeFunction(
    resolveExport('il2cpp_method_get_param_count'), 'uint32', ['pointer']);
const il2cpp_object_get_class = new NativeFunction(
    resolveExport('il2cpp_object_get_class'), 'pointer', ['pointer']);
const il2cpp_class_get_element_class = new NativeFunction(
    resolveExport('il2cpp_class_get_element_class'), 'pointer', ['pointer']);
const il2cpp_class_is_valuetype = new NativeFunction(
    resolveExport('il2cpp_class_is_valuetype'), 'int32', ['pointer']);
const il2cpp_class_array_element_size = new NativeFunction(
    resolveExport('il2cpp_class_array_element_size'), 'int32', ['pointer']);

// ── Image finder ─────────────────────────────────────────────────────────

function findImage(imageName) {
    const domain = il2cpp_domain_get();
    const countBuf = Memory.alloc(8);
    countBuf.writeU64(0);
    const assembliesPtr = il2cpp_domain_get_assemblies(domain, countBuf);
    const n = countBuf.readU32();
    for (let i = 0; i < n; i++) {
        const asm = assembliesPtr.add(i * Process.pointerSize).readPointer();
        if (!asm || asm.isNull()) continue;
        const img = il2cpp_assembly_get_image(asm);
        if (!img || img.isNull()) continue;
        if (readUtf8(il2cpp_image_get_name(img)) === imageName) return img;
    }
    return null;
}

const umaImage = findImage('umamusume.dll');

function findClass(ns, name) {
    if (!umaImage) return ptr(0);
    const k = il2cpp_class_from_name(
        umaImage,
        Memory.allocUtf8String(ns),
        Memory.allocUtf8String(name));
    return k || ptr(0);
}

function buildGetters(klass, specs) {
    const result = {};
    for (const [field, methodName, retType] of specs) {
        try {
            const nameBuf = Memory.allocUtf8String(methodName);
            const method  = il2cpp_class_get_method_from_name(klass, nameBuf, 0);
            if (!method || method.isNull()) { result[field] = null; continue; }
            const fnPtr = method.readPointer();
            if (!fnPtr || fnPtr.isNull()) { result[field] = null; continue; }
            result[field] = new NativeFunction(fnPtr, retType, ['pointer', 'pointer']);
        } catch (_) { result[field] = null; }
    }
    return result;
}

let _getterErrReported = false;
function callGetter(fn, obj) {
    if (!fn) return null;
    try { return fn(obj, ptr(0)); } catch (e) {
        if (!_getterErrReported) {
            _getterErrReported = true;
            send({ type: 'error', msg: 'callGetter threw: ' + e.message });
        }
        return null;
    }
}
"""


# ---------------------------------------------------------------------------
# FRAGMENT A: Class discovery
# ---------------------------------------------------------------------------

CLASS_DISCOVERY_JS = r"""
// Extended bootstrap is already loaded; run discovery.

const FILTERS = FILTER_JSON;

function matches(ns, name) {
    if (FILTERS.length === 0) return true;
    const full = (ns + "." + name).toLowerCase();
    return FILTERS.every(f => full.includes(f));
}

const domain = il2cpp_domain_get();
const sizePtr = Memory.alloc(8);
sizePtr.writeU64(0);
const assembliesPtr = il2cpp_domain_get_assemblies(domain, sizePtr);
const numAssemblies = sizePtr.readU32();
const results = [];
let total = 0;

for (let i = 0; i < numAssemblies; i++) {
    const assembly = assembliesPtr.add(i * Process.pointerSize).readPointer();
    if (!assembly || assembly.isNull()) continue;
    const image = il2cpp_assembly_get_image(assembly);
    if (!image || image.isNull()) continue;
    const imageName = readUtf8(il2cpp_image_get_name(image));
    const classCount = il2cpp_image_get_class_count(image);
    for (let j = 0; j < classCount; j++) {
        const klass = il2cpp_image_get_class(image, j);
        if (!klass || klass.isNull()) continue;
        const name = readUtf8(il2cpp_class_get_name(klass));
        const ns   = readUtf8(il2cpp_class_get_namespace(klass));
        if (!name) continue;
        if (!matches(ns, name)) continue;
        const methods = [];
        const iter = Memory.alloc(Process.pointerSize);
        iter.writePointer(ptr(0));
        for (;;) {
            const m = il2cpp_class_get_methods(klass, iter);
            if (!m || m.isNull()) break;
            const mname = readUtf8(il2cpp_method_get_name(m));
            if (mname) methods.push({ name: mname, params: il2cpp_method_get_param_count(m) });
        }
        results.push({ assembly: imageName, namespace: ns, name, methods });
        total++;
    }
}

send({ type: 'discovery_done', data: results, total });
"""


# ---------------------------------------------------------------------------
# FRAGMENT B: Data extraction hooks
# ---------------------------------------------------------------------------

HOOKS_JS = r"""
// ── Configuration (from Python) ──────────────────────────────────────────
// HOOK_CONFIG: { target_class, method_name, getter_specs, label }

const HOOK_SPECS = HOOK_SPECS_JSON;

let collected = {};  // label -> array of records
let hookErrors = [];

for (const spec of HOOK_SPECS) {
    try {
        const klass = findClass(spec.namespace, spec.className);
        if (!klass || klass.isNull()) {
            hookErrors.push({ target: spec.className, problem: 'class_not_found' });
            send({ type: 'hook_skip', label: spec.label, reason: 'class_not_found' });
            continue;
        }
        const methodInfo = il2cpp_class_get_method_from_name(
            klass,
            Memory.allocUtf8String(spec.methodName),
            spec.nParam || 0);
        if (!methodInfo || methodInfo.isNull()) {
            hookErrors.push({ target: spec.className + '.' + spec.methodName, problem: 'method_not_found' });
            send({ type: 'hook_skip', label: spec.label, reason: 'method_not_found' });
            continue;
        }

        collected[spec.label] = null;
        let getterCache = null;

        Interceptor.attach(methodInfo.readPointer(), {
            onLeave: function (retval) {
                try {
                    const { elements, isValueType } = readListElements(retval);
                    if (elements.length === 0) return;

                    if (!getterCache) {
                        const runtimeClass = isValueType
                            ? il2cpp_class_get_element_class(il2cpp_object_get_class(retval))
                            : il2cpp_object_get_class(elements[0]);
                        getterCache = buildGetters(runtimeClass, spec.getters);
                    }

                    const out = [];
                    for (const el of elements) {
                        const rec = {};
                        let ok = false;
                        for (const [field, getterName, retType] of spec.getters) {
                            const fn = getterCache[field];
                            if (retType === 'pointer') {
                                const val = callGetter(fn, el);
                                rec[field] = readIL2CppString(val);
                                if (rec[field] !== null) ok = true;
                            } else {
                                rec[field] = callGetter(fn, el);
                                if (rec[field] !== null) ok = true;
                            }
                        }
                        if (ok) out.push(rec);
                    }

                    if (out.length > 0) {
                        collected[spec.label] = out;
                        send({ type: 'captured', label: spec.label, count: out.length });
                    }
                } catch (e) {
                    send({ type: 'error', msg: 'Hook ' + spec.label + ': ' + e.message });
                }
            }
        });

        send({ type: 'hook_active', label: spec.label });

    } catch (e) {
        hookErrors.push({ target: spec.className, problem: e.message });
        send({ type: 'hook_skip', label: spec.label, reason: e.message });
    }
}

if (hookErrors.length > 0) {
    let summary = hookErrors.map(h => h.target + ': ' + h.problem).join('; ');
    send({ type: 'status', msg: 'Hook errors: ' + summary });
}

// ── Dump responder ───────────────────────────────────────────────────────

function waitForDump() {
    recv('dump', function () {
        const payload = {};
        for (const label of Object.keys(collected)) {
            payload[label] = collected[label] || [];
        }
        send({ type: 'dump_result', data: payload, hook_errors: hookErrors });
        waitForDump();
    });
}
waitForDump();

send({ type: 'ready' });
"""


# ---------------------------------------------------------------------------
# Python driver
# ---------------------------------------------------------------------------

def attach(process_name: str):
    try:
        return frida.attach(process_name)
    except frida.ProcessNotFoundError:
        return None


def run_discovery(session: frida.core.Session, keywords: list[str]) -> list[dict]:
    """Run the class discovery phase and return matching classes."""
    filter_json = json.dumps([kw.lower() for kw in keywords])
    script_src = FRIDA_BOOTSTRAP + CLASS_DISCOVERY_JS.replace("FILTER_JSON", filter_json)

    results = []
    done = threading.Event()

    script = session.create_script(script_src)

    def on_msg(message, _data):
        if message["type"] == "send":
            p = message["payload"]
            if p["type"] == "discovery_done":
                results.extend(p["data"])
                done.set()
        elif message["type"] == "error":
            print(f"  [!] {message.get('stack', message)}")
            done.set()

    script.on("message", on_msg)
    script.load()
    ok = done.wait(timeout=120)
    script.unload()

    if not ok:
        print("  [!] Discovery timed out")

    return results


def build_hook_specs(discovered: list[dict]) -> list[dict]:
    """
    From the discovered classes, build hook configurations for each data type.
    Returns a list of spec dicts that are injected into the Frida hook script.
    """
    specs = []

    # Candidate class patterns for each data type
    candidates = {
        "skills": {
            "keywords": ["SkillData"],
            "getters": [
                ["id", "get_Id", "int32"],
                ["name", "get_Name", "pointer"],
            ],
        },
        "charas": {
            "keywords": ["CharaData"],
            "getters": [
                ["id", "get_Id", "int32"],
                ["name", "get_Name", "pointer"],
            ],
        },
        "cards": {
            "keywords": ["SupportCardData"],
            "getters": [
                ["id", "get_SupportCardId", "int32"],
                ["name", "get_Name", "pointer"],
                ["charaName", "get_Charaname", "pointer"],
            ],
        },
    }

    # Build index of known class namespaces
    class_index = {}
    for c in discovered:
        key = c["name"]
        class_index.setdefault(key, []).append(c)

    for label, cfg in candidates.items():
        for keyword in cfg["keywords"]:
            matches_for_keyword = class_index.get(keyword, [])
            # Sort by namespace preference (Gallop first)
            matches_for_keyword.sort(key=lambda x: (
                0 if x["namespace"] == "Gallop" else 1,
                x["namespace"]
            ))
            for entry in matches_for_keyword:
                ns = entry["namespace"]
                cn = entry["name"]
                methods = {m["name"]: m for m in entry["methods"]}

                # Verify all required getters exist
                missing = []
                for _, getter_name, _ in cfg["getters"]:
                    if getter_name not in methods:
                        missing.append(getter_name)

                if missing:
                    continue

                # Look for methods that return a List of this type
                # Common patterns: get_List, GetList, GetDataList, GetMasterData, etc.
                list_method = None
                for mn in ["get_List", "GetList", "GetDataList",
                           "GetMasterData", "GetAll", "LoadList",
                           "GetSkillDataList", "GetCharaDataList"]:
                    if mn in methods:
                        list_method = mn
                        break

                if not list_method:
                    # Try .ctor with many params as fallback (data loaded from master)
                    # Actually, we need a list-returning static/instance method.
                    # Skip if no list method found — user may need to identify manually.
                    continue

                getters = [(f, g, r) for f, g, r in cfg["getters"]]
                specs.append({
                    "namespace": ns,
                    "className": cn,
                    "methodName": list_method,
                    "nParam": 0,
                    "getters": getters,
                    "label": label,
                })
                break  # one spec per label

    return specs


def add_fallback_manual_specs(specs: list[dict], discovered: list[dict]) -> list[dict]:
    """
    Add manually maintained fallback specs for known-working class/method
    combinations, even if the discovery heuristic didn't find them.
    This ensures extraction works even if the class names don't match our
    heuristic patterns.
    """
    # Build a set of already-configured labels
    have_labels = {s["label"] for s in specs}
    class_index = {}
    for c in discovered:
        key = c["name"]
        class_index.setdefault(key, []).append(c)

    # Use IMiniCharaData for chara names (confirmed working)
    if "charas" not in have_labels:
        for entry in class_index.get("IMiniCharaData", []):
            methods = {m["name"]: m for m in entry["methods"]}
            if "get_CharaId" in methods and "get_Name" in methods:
                # IMiniCharaData is a per-instance class; we need a source of
                # instances.  The CharacterListUI might have one.
                specs.append({
                    "namespace": entry["namespace"],
                    "className": "IMiniCharaData",
                    "methodName": "get_CharaId",
                    "nParam": 0,
                    "getters": [
                        ["id", "get_CharaId", "int32"],
                        ["name", "get_Name", "pointer"],
                    ],
                    "label": "charas",
                    "_note": "fallback_IMiniCharaData",
                })
                break

    return specs


def run_extraction(session: frida.core.Session, hook_specs: list[dict], timeout_min: int = 5) -> dict:
    """Inject hooks and wait for the user to trigger data capture."""

    script_src = FRIDA_BOOTSTRAP + HOOKS_JS.replace(
        "HOOK_SPECS_JSON", json.dumps(hook_specs))

    result_data = {}
    ready = threading.Event()

    script = session.create_script(script_src)

    def on_msg(message, _data):
        if message["type"] == "send":
            p = message["payload"]
            tp = p.get("type")
            if tp == "ready":
                ready.set()
            elif tp == "hook_active":
                print(f"  ✓ Hook active: {p['label']}")
            elif tp == "hook_skip":
                print(f"  — Hook skipped: {p['label']} ({p.get('reason', 'unknown')})")
            elif tp == "captured":
                print(f"  ● Captured {p['count']} {p['label']}")
            elif tp == "dump_result":
                result_data.update(p["data"])
                dump_evt.set()
            elif tp == "status":
                print(f"  [*] {p['msg']}")
        elif message["type"] == "error":
            print(f"  [!] {message.get('stack', message)}")

    dump_evt = threading.Event()
    script.on("message", on_msg)
    script.load()

    if not ready.wait(timeout=30):
        print("[!] Script did not become ready within 30 s")
        script.unload()
        return result_data

    active_hooks = [s["label"] for s in hook_specs
                    if s["label"] not in
                    [e.get("label") for e in result_data.get("_skipped", [])]]

    print(f"\n[*] {len(active_hooks)} hooks active.")
    if active_hooks:
        print("[*] Navigate to game screens that load the relevant data, then")
        print("    press Enter to capture.  Ctrl+C to exit.")
        print(f"    Targets: {', '.join(active_hooks)}\n")
    else:
        print("[!] No hooks were active — nothing to capture.")

    try:
        while True:
            input()
            dump_evt.clear()
            script.post({"type": "dump"})
            if not dump_evt.wait(timeout=timeout_min * 60):
                print("  [!] No response — try pressing Enter again")
                continue
            break
    except KeyboardInterrupt:
        pass

    script.unload()
    return result_data


def main():
    parser = argparse.ArgumentParser(
        description="Extract skill/chara/card data from Umamusume Pretty Derby")
    parser.add_argument("--output-dir", default=".",
                        help="Output directory for JSON files (default: current dir)")
    parser.add_argument("--discover-only", action="store_true",
                        help="Only run class discovery, print results, and exit")
    parser.add_argument("--hook-only", action="store_true",
                        help="Skip discovery and use known class names")
    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    session = attach("UmamusumePrettyDerby.exe") or attach("umamusume")
    if session is None:
        print("[!] UmamusumePrettyDerby.exe not found — is the game running?")
        sys.exit(1)

    # Phase 1: Discovery
    keywords = ["SkillData", "CharaData", "MiniChara", "SupportCard",
                "MasterData", "MasterSkill", "MasterChara", "TextData"]

    if not args.hook_only:
        print("\n═══ Phase 1: Class Discovery ═══")
        print(f"    Searching classes matching: {', '.join(keywords)}")
        discovered = run_discovery(session, keywords)
        print(f"    Found {len(discovered)} matching classes\n")

        if not discovered:
            print("[!] No matching classes found. The game may have updated.")
            print("[!] Try running with --hook-only to use known class names.")
            session.detach()
            return

        # Print summary
        for entry in discovered:
            ns = entry["namespace"]
            name = entry["name"]
            methods = [m["name"] for m in entry["methods"][:8]]
            trail = "…" if len(entry["methods"]) > 8 else ""
            label = f"[{ns}] " if ns else ""
            print(f"  {label}{name}")
            if methods:
                print(f"      → {', '.join(methods)}{trail}")

        if args.discover_only:
            session.detach()
            return

        # Build hook specs from discovered classes
        hook_specs = build_hook_specs(discovered)
        hook_specs = add_fallback_manual_specs(hook_specs, discovered)

        print(f"\n    Built {len(hook_specs)} hook spec(s)")
        for hs in hook_specs:
            note = hs.get("_note", "")
            note_str = f" ({note})" if note else ""
            print(f"      → {hs['label']}: {hs['namespace']}.{hs['className']}.{hs['methodName']}{note_str}")
    else:
        # Use known/default class names
        hook_specs = [
            {
                "namespace": "Gallop",
                "className": "WorkSupportCardData",
                "methodName": "GetSupportCardList",
                "nParam": 0,
                "getters": [
                    ["supportCardId", "get_SupportCardId", "int32"],
                    ["limitBreakCount", "get_LimitBreakCount", "int32"],
                    ["level", "get_Level", "int32"],
                    ["exp", "get_Exp", "int32"],
                    ["stock", "get_Stock", "int32"],
                    ["maxLevel", "get_MaxLevel", "int32"],
                    ["isFavoriteLock", "get_IsFavoriteLock", "int32"],
                ],
                "label": "cards",
            },
        ]

    # Phase 2: Extraction
    print("\n═══ Phase 2: Data Extraction ═══")
    result = run_extraction(session, hook_specs)

    if not result:
        print("\n[!] No data was captured.")
        session.detach()
        return

    # Write output files
    written = []
    for label, records in result.items():
        if not isinstance(records, list) or not records:
            continue
        fname = f"{label}.json"
        fpath = out_dir / fname
        fpath.write_text(
            json.dumps(records, indent=2, ensure_ascii=False),
            encoding="utf-8")
        written.append((fname, len(records)))
        print(f"  ✓ {fname} — {len(records)} records")

    if not written:
        print("[!] No data files written.")

    print("\n[*] Detached.")

    # Summary
    if written:
        print("\n─── Next steps ──────────────────────────────────────")
        for fname, count in written:
            print(f"  {fname}: {count} entries")
        print("\nCopy these files to frontend/public/data/ and update")
        print("the loader to read from local JSON instead of umdb.binarypb.")


if __name__ == "__main__":
    main()
