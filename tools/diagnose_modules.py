"""
diagnose_modules.py
===================
Connects to the running Umamusume process and reports:

  1. Every loaded module whose name contains 'game', 'uma', or 'il2cpp'
     (so you can confirm the exact DLL name Frida sees).
  2. The first 60 exports from that module whose name starts with 'il2cpp_'
     (so you know which runtime API functions are actually available).

Run this BEFORE the dumper/tracker scripts fail; the output tells you the
correct module name to pass to Module.findExportByName.

Usage
-----
    python diagnose_modules.py

No arguments — it just connects, dumps findings, and exits.
"""

import sys
import threading

import frida

FRIDA_SCRIPT = r"""
'use strict';

// ── 1. Find candidate modules ────────────────────────────────────────────────
const keywords = ['game', 'uma', 'il2cpp'];

const candidates = Process.enumerateModules().filter(m => {
    const lower = m.name.toLowerCase();
    return keywords.some(k => lower.includes(k));
});

send({ type: 'modules', data: candidates.map(m => ({ name: m.name, base: m.base.toString(), size: m.size })) });

// ── 2. For GameAssembly.dll specifically, list il2cpp_ exports
const gameAsm = Process.enumerateModules().find(m => m.name.toLowerCase().includes('gameassembly'));
if (!gameAsm) {
    send({ type: 'exports', module: null, data: [] });
} else {
    let exports;
    try {
        exports = gameAsm.enumerateExports()
            .filter(e => e.name.startsWith('il2cpp_'))
            .slice(0, 60)
            .map(e => ({ name: e.name, address: e.address.toString() }));
    } catch (err) {
        exports = [{ name: '(error enumerating exports: ' + err.message + ')', address: '0x0' }];
    }
    send({ type: 'exports', module: gameAsm.name, data: exports });
}

send({ type: 'done' });
"""


def attach(name: str):
    try:
        return frida.attach(name)
    except frida.ProcessNotFoundError:
        return None


def main() -> None:
    session = attach("UmamusumePrettyDerby.exe") or attach("umamusume")
    if session is None:
        print("[!] UmamusumePrettyDerby.exe not found — is the game running?")
        sys.exit(1)

    done = threading.Event()

    def on_message(message, _data):
        if message["type"] == "send":
            p = message["payload"]
            if p["type"] == "modules":
                mods = p["data"]
                print(f"\n── Candidate modules ({len(mods)} found) ───────────────────────────────────")
                if not mods:
                    print("  (none — try broadening the keyword list)")
                for m in mods:
                    size_kb = m["size"] // 1024
                    print(f"  {m['name']:<40}  base={m['base']}  size={size_kb} KB")

            elif p["type"] == "exports":
                mod_name = p["module"] or "(no 'game' module found)"
                exports = p["data"]
                print(f"\n── IL2CPP exports in '{mod_name}' (first 60 matching il2cpp_*) ──────────")
                if not exports:
                    print("  (none found — IL2CPP API may not be exported by name)")
                for e in exports:
                    print(f"  {e['name']:<60}  @ {e['address']}")

            elif p["type"] == "done":
                done.set()

        elif message["type"] == "error":
            print(f"[!] Frida script error:\n{message['stack']}")
            done.set()

    script = session.create_script(FRIDA_SCRIPT)
    script.on("message", on_message)
    print("[*] Attached. Enumerating modules and exports…")
    script.load()

    if not done.wait(timeout=30):
        print("[!] Timed out after 30 s")

    session.detach()
    print("\n[*] Done.")


if __name__ == "__main__":
    main()
