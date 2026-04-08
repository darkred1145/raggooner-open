"""
track_active_classes.py
=======================
Hooks il2cpp_object_new inside the running game and records every managed
class that gets instantiated.  Navigate to the screen you want to investigate,
then press Enter to snapshot the classes created since the last snapshot.

This is useful for narrowing down *which* class to read for a given screen
(e.g. the support card collection screen or the character select screen)
without having to search through the full 60 000-class static dump.

Usage
-----
    python track_active_classes.py [options]

    --filter KEYWORD   Only show classes whose "Namespace.ClassName" contains
                       KEYWORD (case-insensitive).  Repeatable (AND logic).
    --output FILE      Save each snapshot to FILE (default: active_<ts>.json).
                       The file is overwritten on each snapshot.

Workflow
--------
    1. Start the game and log in.
    2. Run this script (it attaches and starts recording immediately).
    3. Navigate to the screen you want to investigate.
    4. Press Enter — prints all classes that were newly created since the
       script started (or since the previous Enter).
    5. Each snapshot is also saved to JSON for offline searching.
    6. Ctrl+C to stop.

Notes
-----
- Only *new* classes are reported per snapshot: once a class has been seen it
  is not reported again (so repeated Enter presses show only what changed).
- The hook fires on every object allocation; using --filter greatly reduces
  noise on the console without losing data (everything is still recorded
  internally and dumped to the JSON file regardless of the filter).
- il2cpp_object_new is called very frequently.  The hook deduplicates at the
  JavaScript level (Set lookup) so the overhead on the game is minimal after
  the first few thousand unique classes are seen.
"""

import argparse
import json
import sys
import threading
import time
from pathlib import Path

import frida

# ---------------------------------------------------------------------------
# Frida JavaScript
# ---------------------------------------------------------------------------

FRIDA_SCRIPT = r"""
'use strict';

function readStr(ptr) {
    if (!ptr || ptr.isNull()) return "";
    try { return ptr.readUtf8String() || ""; } catch (_) { return ""; }
}

// Find GameAssembly dynamically — module name varies across installs/Frida versions.
const gameAsmModule = Process.enumerateModules().find(m => m.name.toLowerCase().includes('gameassembly'));
if (!gameAsmModule) {
    const loaded = Process.enumerateModules().map(m => m.name).join(', ');
    send({ type: 'error', msg: 'GameAssembly module not found. Loaded modules: ' + loaded });
    throw new Error('abort');
}
const GAME_MODULE = gameAsmModule.name;

function resolveExport(name) {
    const addr = gameAsmModule.findExportByName(name);
    if (!addr) throw new Error("Export not found in " + GAME_MODULE + ": " + name);
    return addr;
}

const il2cpp_class_get_name = new NativeFunction(
    resolveExport("il2cpp_class_get_name"), 'pointer', ['pointer']);

const il2cpp_class_get_namespace = new NativeFunction(
    resolveExport("il2cpp_class_get_namespace"), 'pointer', ['pointer']);

// Deduplicate by class pointer so we only send each class once.
// The game calls il2cpp_object_new thousands of times per second;
// doing this in JS avoids flooding the message channel.
const seenKlasses = new Set();

const objNewAddr = gameAsmModule.findExportByName("il2cpp_object_new");
if (!objNewAddr) {
    send({ type: 'error', msg: 'il2cpp_object_new not exported by ' + GAME_MODULE });
} else {
    Interceptor.attach(objNewAddr, {
        onEnter: function (args) {
            try {
                const klass = args[0];
                if (!klass || klass.isNull()) return;

                // Use the raw pointer value as the deduplication key.
                const key = klass.toUInt32(); // fast integer key (lower 32 bits fine for dedup)
                if (seenKlasses.has(key)) return;
                seenKlasses.add(key);

                const name = readStr(il2cpp_class_get_name(klass));
                const ns   = readStr(il2cpp_class_get_namespace(klass));
                if (!name) return;

                send({ type: 'class', namespace: ns, name: name, ts: Date.now() });
            } catch (_) {
                // Swallow errors inside the hook to avoid crashing the game thread.
            }
        }
    });
    send({ type: 'ready' });
}
"""

# ---------------------------------------------------------------------------
# Python driver
# ---------------------------------------------------------------------------

def attach(name: str):
    try:
        return frida.attach(name)
    except frida.ProcessNotFoundError:
        return None


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Track IL2CPP class instantiations on a specific game screen"
    )
    parser.add_argument(
        "--filter", metavar="KEYWORD", action="append", default=[],
        help=(
            "Only print classes whose Namespace.ClassName contains KEYWORD "
            "(case-insensitive). Repeatable. Does not affect what is saved to JSON."
        ),
    )
    parser.add_argument(
        "--output", metavar="FILE", default=None,
        help="JSON file to save each snapshot to (default: active_classes_<ts>.json)",
    )
    args = parser.parse_args()

    filters_lower = [f.lower() for f in args.filter]

    def matches_filter(ns: str, name: str) -> bool:
        if not filters_lower:
            return True
        full = (ns + "." + name).lower()
        return all(f in full for f in filters_lower)

    # ── attach ────────────────────────────────────────────────────────────
    session = attach("UmamusumePrettyDerby.exe") or attach("umamusume")
    if session is None:
        print("[!] UmamusumePrettyDerby.exe not found — is the game running?")
        sys.exit(1)

    # ── shared state between message callback and main thread ─────────────
    # pending:  classes collected since the last snapshot (cleared on Enter)
    # all_seen: every class ever seen this session (never cleared, for JSON)
    pending: list[dict]  = []
    all_seen: list[dict] = []
    lock    = threading.Lock()
    ready   = threading.Event()

    # ── Frida callbacks ───────────────────────────────────────────────────
    script = session.create_script(FRIDA_SCRIPT)

    def on_message(message, _data):
        if message["type"] == "send":
            p = message["payload"]
            if p["type"] == "ready":
                ready.set()
            elif p["type"] == "class":
                entry = {"namespace": p["namespace"], "name": p["name"], "ts": p["ts"]}
                with lock:
                    pending.append(entry)
                    all_seen.append(entry)
            elif p["type"] == "error":
                print(f"[!] {p['msg']}")
                ready.set()  # unblock main thread so we can exit cleanly
        elif message["type"] == "error":
            print(f"[!] Frida script error:\n{message['stack']}")
            ready.set()

    script.on("message", on_message)
    script.load()

    if not ready.wait(timeout=10):
        print("[!] Script did not signal ready — check GameAssembly.dll exports")
        session.detach()
        sys.exit(1)

    if args.filter:
        print(f"[*] Console filter: {' AND '.join(args.filter)}  (all classes still saved to JSON)")
    print("[*] Hook active.  Navigate to the screen you want to investigate.")
    print("[*] Press Enter to snapshot.  Ctrl+C to exit.\n")

    snapshot_index = 0
    try:
        while True:
            input()   # block until Enter

            with lock:
                snap   = list(pending)
                pending.clear()

            snapshot_index += 1

            if not snap:
                print(f"[snapshot {snapshot_index}] Nothing new since last snapshot.")
                continue

            # Sort for readable output
            snap.sort(key=lambda e: (e["namespace"], e["name"]))

            # Console output (filtered)
            visible = [e for e in snap if matches_filter(e["namespace"], e["name"])]
            print(f"\n── Snapshot {snapshot_index}: {len(snap)} new classes "
                  f"({len(visible)} match filter) ─────────────────────────────")
            for e in visible[:80]:
                label = f"[{e['namespace']}] " if e["namespace"] else ""
                print(f"  {label}{e['name']}")
            if len(visible) > 80:
                print(f"  … {len(visible) - 80} more — see the JSON file")

            # Save snapshot to JSON
            ts       = int(time.time())
            out_path = args.output or f"active_classes_{ts}.json"
            Path(out_path).write_text(
                json.dumps(snap, indent=2, ensure_ascii=False), encoding="utf-8"
            )
            print(f"\n[*] {len(snap)} classes saved to {out_path}\n")

    except KeyboardInterrupt:
        pass
    finally:
        session.detach()

    # Save a final combined dump of everything seen this session
    if all_seen:
        all_seen.sort(key=lambda e: (e["namespace"], e["name"]))
        session_path = f"active_classes_session_{int(time.time())}.json"
        Path(session_path).write_text(
            json.dumps(all_seen, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(f"[*] Full session dump ({len(all_seen)} unique classes) saved to {session_path}")

    print("[*] Detached.")


if __name__ == "__main__":
    main()
