"""
extract_inventory.py
====================
Extracts the full support-card inventory and trained-uma roster directly from
the running Umamusume Pretty Derby process via IL2CPP runtime hooks.

How it works
------------
Two passive hooks are installed:

  • WorkSupportCardData.GetSupportCardList() — fires whenever the game reads
    the owned support-card list (e.g. opening the card collection or deck
    selection screen).  The returned List<SupportCardData> is iterated and
    each card's fields are read via the getter methods on the live object.

  • WorkTrainedCharaData.get_List() — fires whenever the game reads the
    trained-uma roster (e.g. opening the stable or character-select screen).
    Same approach: the returned List<TrainedCharaData> is iterated.

Usage
-----
1. Start the game and log in.
2. Run this script.
3. Navigate to the Support Card collection / deck-equip screen.
   The script will print "[*] Support cards captured: N".
4. Navigate to your Uma Stable / trained-chara list.
   The script will print "[*] Trained umas captured: N".
5. Press Enter to save the data to JSON.
   Re-press Enter to re-capture with fresh data.
6. Ctrl+C to exit.

Output
------
  inventory_<timestamp>.json  — { support_cards: [...], trained_umas: [...] }
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

// ── Utilities ─────────────────────────────────────────────────────────────────

function readUtf8(ptr) {
    if (!ptr || ptr.isNull()) return '';
    try { return ptr.readUtf8String() || ''; } catch (_) { return ''; }
}

// Read a C# System.String (UTF-16, length prefix at +0x10, chars at +0x14)
function readIL2CppString(strPtr) {
    if (!strPtr || strPtr.isNull()) return null;
    try {
        const len = strPtr.add(0x10).readS32();
        if (len <= 0 || len > 2048) return null;
        return strPtr.add(0x14).readUtf16String(len);
    } catch (_) { return null; }
}

// Read a C# List<T> and return { elements, elemClass, isValueType }.
// Handles both reference-type T (8-byte pointer slots) and
// value-type T (unboxed struct slots of sizeof(T) bytes each).
//
// List<T> layout (64-bit IL2CPP):
//   +0x10: _items  T[]  (pointer to managed array)
//   +0x18: _size   int32
// Managed array layout:
//   +0x00: klass*  (object header)
//   +0x08: monitor*
//   +0x10: bounds*  (null for 1-D arrays)
//   +0x18: max_length int32 / int64
//   +0x20: element data starts here
function readListElements(listPtr) {
    if (!listPtr || listPtr.isNull())
        return { elements: [], elemClass: null, isValueType: false, stride: 8 };
    try {
        const arrayPtr = listPtr.add(0x10).readPointer();
        const size     = listPtr.add(0x18).readS32();
        if (!arrayPtr || arrayPtr.isNull() || size <= 0 || size > 50000)
            return { elements: [], elemClass: null, isValueType: false, stride: 8 };

        // Derive element type from the array's own class metadata — reliable
        // regardless of how many classes share the same name.
        const arrayClass = il2cpp_object_get_class(arrayPtr);
        const elemClass  = il2cpp_class_get_element_class(arrayClass);
        const isValueType = elemClass && !elemClass.isNull()
            && il2cpp_class_is_valuetype(elemClass) !== 0;

        let elements;
        let stride;
        if (isValueType) {
            // Unboxed value types: each slot is exactly sizeof(T) bytes.
            // Pass the slot address directly as `this` when calling methods.
            stride = il2cpp_class_array_element_size(elemClass);
            elements = [];
            for (let i = 0; i < size; i++)
                elements.push(arrayPtr.add(0x20 + i * stride));
        } else {
            // Reference types: each slot is an 8-byte managed pointer.
            stride = 8;
            elements = [];
            for (let i = 0; i < size; i++) {
                const e = arrayPtr.add(0x20 + i * 8).readPointer();
                if (e && !e.isNull()) elements.push(e);
            }
        }
        return { elements, elemClass, isValueType, stride };
    } catch (err) {
        return { elements: [], elemClass: null, isValueType: false, stride: 8 };
    }
}

// ── IL2CPP API ────────────────────────────────────────────────────────────────

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
const il2cpp_class_from_name = new NativeFunction(
    resolveExport('il2cpp_class_from_name'), 'pointer', ['pointer', 'pointer', 'pointer']);
const il2cpp_class_get_method_from_name = new NativeFunction(
    resolveExport('il2cpp_class_get_method_from_name'), 'pointer', ['pointer', 'pointer', 'int']);
const il2cpp_class_get_name = new NativeFunction(
    resolveExport('il2cpp_class_get_name'), 'pointer', ['pointer']);
const il2cpp_object_get_class = new NativeFunction(
    resolveExport('il2cpp_object_get_class'), 'pointer', ['pointer']);
const il2cpp_class_get_element_class = new NativeFunction(
    resolveExport('il2cpp_class_get_element_class'), 'pointer', ['pointer']);
const il2cpp_class_is_valuetype = new NativeFunction(
    resolveExport('il2cpp_class_is_valuetype'), 'int32', ['pointer']);
const il2cpp_class_array_element_size = new NativeFunction(
    resolveExport('il2cpp_class_array_element_size'), 'int32', ['pointer']);

// ── Find umamusume.dll image ──────────────────────────────────────────────────

const domain = il2cpp_domain_get();
const countBuf = Memory.alloc(8);
countBuf.writeU64(0);
const assembliesPtr = il2cpp_domain_get_assemblies(domain, countBuf);
const numAssemblies = countBuf.readU32();

let umaImage = null;
for (let i = 0; i < numAssemblies; i++) {
    const asm = assembliesPtr.add(i * Process.pointerSize).readPointer();
    if (!asm || asm.isNull()) continue;
    const img = il2cpp_assembly_get_image(asm);
    if (!img || img.isNull()) continue;
    if (readUtf8(il2cpp_image_get_name(img)) === 'umamusume.dll') {
        umaImage = img;
        break;
    }
}
if (!umaImage) {
    send({ type: 'error', msg: 'umamusume.dll not found in IL2CPP domain' });
    throw new Error('abort');
}

// ── Class / method helpers ────────────────────────────────────────────────────

function findClass(ns, name) {
    const k = il2cpp_class_from_name(
        umaImage,
        Memory.allocUtf8String(ns),
        Memory.allocUtf8String(name));
    if (!k || k.isNull()) throw new Error('Class not found: ' + ns + '.' + name);
    return k;
}

function findMethod(klass, name, nParams) {
    const m = il2cpp_class_get_method_from_name(
        klass,
        Memory.allocUtf8String(name),
        nParams);
    if (!m || m.isNull()) throw new Error('Method not found: ' + name + '/' + nParams);
    return m;
}

// Wrap an IL2CPP instance method (MethodInfo* → NativeFunction).
// IL2CPP calling convention: (this, ...args, MethodInfo*).
// Pass ptr(0) for MethodInfo* — sufficient for non-virtual concrete methods.
function wrapMethod(methodInfo, retType, argTypes) {
    const fnPtr = methodInfo.readPointer(); // MethodInfo.methodPointer at offset 0
    return new NativeFunction(fnPtr, retType, [...argTypes, 'pointer']);
}

// Build getter NativeFunctions from a known class pointer.
// Uses the class directly (not read from the object header) so it works for
// both reference types and value types (structs stored unboxed in arrays).
// String buffers are kept in the closure so they are never GC'd.
function buildGettersFromClass(klass, specs) {
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

// ── Locate Work* singletons via class+method ──────────────────────────────────

const workSupportCardClass  = findClass('Gallop', 'WorkSupportCardData');
const workTrainedCharaClass = findClass('Gallop', 'WorkTrainedCharaData');

const mi_getSupportCardList  = findMethod(workSupportCardClass,  'GetSupportCardList', 0);
const mi_getTrainedCharaList = findMethod(workTrainedCharaClass, 'get_List',           0);

// ── Getter spec lists ─────────────────────────────────────────────────────────
// Each entry: [outputFieldName, il2cppMethodName, fridaReturnType]

const SUPPORT_CARD_SPECS = [
    ['supportCardId',   'get_SupportCardId',  'int32'],
    ['limitBreakCount', 'get_LimitBreakCount', 'int32'],
    ['level',           'get_Level',           'int32'],
    ['exp',             'get_Exp',             'int32'],
    ['stock',           'get_Stock',           'int32'],
    ['maxLevel',        'get_MaxLevel',        'int32'],
    ['isFavoriteLock',  'get_IsFavoriteLock',  'int32'],
];

const TRAINED_CHARA_SPECS = [
    ['charaId',               'get_CharaId',               'int32'],
    ['cardId',                'get_CardId',                'int32'],
    ['name',                  'get_Name',                  'pointer'],
    ['speed',                 'get_Speed',                 'int32'],
    ['stamina',               'get_Stamina',               'int32'],
    ['power',                 'get_Power',                 'int32'],
    ['guts',                  'get_Guts',                  'int32'],
    ['wiz',                   'get_Wiz',                   'int32'],
    ['rank',                  'get_Rank',                  'int32'],
    ['rankScore',             'get_RankScore',             'int32'],
    ['fans',                  'get_Fans',                  'int32'],
    ['runningStyle',          'get_RunningStyle',          'int32'],
    ['properGroundTurf',      'get_ProperGroundTurf',      'int32'],
    ['properGroundDirt',      'get_ProperGroundDirt',      'int32'],
    ['properDistanceShort',   'get_ProperDistanceShort',   'int32'],
    ['properDistanceMile',    'get_ProperDistanceMile',    'int32'],
    ['properDistanceMiddle',  'get_ProperDistanceMiddle',  'int32'],
    ['properDistanceLong',    'get_ProperDistanceLong',    'int32'],
    ['properStyleNige',       'get_ProperRunningStyleNige',    'int32'],
    ['properStyleSenko',      'get_ProperRunningStyleSenko',   'int32'],
    ['properStyleSashi',      'get_ProperRunningStyleSashi',   'int32'],
    ['properStyleOikomi',     'get_ProperRunningStyleOikomi',  'int32'],
    ['talentLevel',           'get_TalentLevel',           'int32'],
    ['rarity',                'get_Rarity',                'int32'],
    ['charaGrade',            'get_CharaGrade',            'int32'],
    ['scenarioId',            'get_ScenarioId',            'int32'],
    ['isLock',                'get_IsLock',                'int32'],
];

// ── Lazy getter caches (built once on first hook fire) ────────────────────────

let cardGetterCache = null;
let umaGetterCache  = null;

// ── Call a cached getter, returning null on any error ─────────────────────────

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

// ── Collected state ───────────────────────────────────────────────────────────

let collectedCards = null;
let collectedUmas  = null;

// ── Hook: support cards ───────────────────────────────────────────────────────

Interceptor.attach(mi_getSupportCardList.readPointer(), {
    onLeave: function (retval) {
        try {
            const { elements, elemClass, isValueType } = readListElements(retval);
            if (elements.length === 0) return;

            if (!cardGetterCache) {
                // Use the runtime class of the first actual object rather than
                // the array's declared element type.  This resolves the case
                // where multiple classes share the name "SupportCardData" — the
                // declared element class may differ from the runtime class.
                const runtimeClass = isValueType
                    ? elemClass
                    : il2cpp_object_get_class(elements[0]);
                cardGetterCache = buildGettersFromClass(runtimeClass, SUPPORT_CARD_SPECS);
                const className = readUtf8(il2cpp_class_get_name(runtimeClass));
                send({ type: 'status',
                    msg: 'Card element class: ' + className
                        + ' (isValueType=' + isValueType + ')'
                        + ' — getters found: '
                        + SUPPORT_CARD_SPECS.filter(([f]) => cardGetterCache[f]).length
                        + '/' + SUPPORT_CARD_SPECS.length });
            }
            const g = cardGetterCache;

            const out = [];
            for (const card of elements) {
                try {
                    out.push({
                        support_card_id:   callGetter(g.supportCardId,   card),
                        limit_break_count: callGetter(g.limitBreakCount, card),
                        level:             callGetter(g.level,           card),
                        exp:               callGetter(g.exp,             card),
                        stock:             callGetter(g.stock,           card),
                        max_level:         callGetter(g.maxLevel,        card),
                        favorite_locked:   callGetter(g.isFavoriteLock,  card) !== 0,
                    });
                } catch (_) {}
            }
            collectedCards = out;
            send({ type: 'status', msg: 'Support cards captured: ' + out.length });
        } catch (e) {
            send({ type: 'error', msg: 'Support card hook: ' + e.message });
        }
    }
});

// ── Hook: trained umas ────────────────────────────────────────────────────────

Interceptor.attach(mi_getTrainedCharaList.readPointer(), {
    onLeave: function (retval) {
        try {
            const { elements, elemClass, isValueType } = readListElements(retval);
            if (elements.length === 0) return;

            if (!umaGetterCache) {
                const runtimeClass = isValueType
                    ? elemClass
                    : il2cpp_object_get_class(elements[0]);
                umaGetterCache = buildGettersFromClass(runtimeClass, TRAINED_CHARA_SPECS);
                const className = readUtf8(il2cpp_class_get_name(runtimeClass));
                send({ type: 'status',
                    msg: 'Uma element class: ' + className
                        + ' (isValueType=' + isValueType + ')'
                        + ' — getters found: '
                        + TRAINED_CHARA_SPECS.filter(([f]) => umaGetterCache[f]).length
                        + '/' + TRAINED_CHARA_SPECS.length });
            }
            const g = umaGetterCache;

            const out = [];
            for (const uma of elements) {
                try {
                    out.push({
                        chara_id:               callGetter(g.charaId,             uma),
                        card_id:                callGetter(g.cardId,              uma),
                        name:                   readIL2CppString(callGetter(g.name, uma)),
                        speed:                  callGetter(g.speed,               uma),
                        stamina:                callGetter(g.stamina,             uma),
                        power:                  callGetter(g.power,               uma),
                        guts:                   callGetter(g.guts,                uma),
                        wiz:                    callGetter(g.wiz,                 uma),
                        rank:                   callGetter(g.rank,                uma),
                        rank_score:             callGetter(g.rankScore,           uma),
                        fans:                   callGetter(g.fans,                uma),
                        running_style:          callGetter(g.runningStyle,        uma),
                        proper_ground_turf:     callGetter(g.properGroundTurf,    uma),
                        proper_ground_dirt:     callGetter(g.properGroundDirt,    uma),
                        proper_distance_short:  callGetter(g.properDistanceShort, uma),
                        proper_distance_mile:   callGetter(g.properDistanceMile,  uma),
                        proper_distance_middle: callGetter(g.properDistanceMiddle,uma),
                        proper_distance_long:   callGetter(g.properDistanceLong,  uma),
                        proper_style_nige:      callGetter(g.properStyleNige,     uma),
                        proper_style_senko:     callGetter(g.properStyleSenko,    uma),
                        proper_style_sashi:     callGetter(g.properStyleSashi,    uma),
                        proper_style_oikomi:    callGetter(g.properStyleOikomi,   uma),
                        talent_level:           callGetter(g.talentLevel,         uma),
                        rarity:                 callGetter(g.rarity,              uma),
                        chara_grade:            callGetter(g.charaGrade,          uma),
                        scenario_id:            callGetter(g.scenarioId,          uma),
                        is_lock:                callGetter(g.isLock,              uma) !== 0,
                    });
                } catch (_) {}
            }
            collectedUmas = out;
            send({ type: 'status', msg: 'Trained umas captured: ' + out.length });
        } catch (e) {
            send({ type: 'error', msg: 'Trained chara hook: ' + e.message });
        }
    }
});

// ── Respond to dump requests from Python (triggered by Enter key) ────────────
// recv() is one-shot; re-register after every message so repeated Enter presses work.

function waitForDump() {
    recv('dump', function () {
        send({
            type:          'dump',
            support_cards: collectedCards || [],
            trained_umas:  collectedUmas  || [],
        });
        waitForDump();  // re-arm for next press
    });
}
waitForDump();

send({ type: 'ready' });
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
        description="Extract support card inventory and trained uma roster"
    )
    parser.add_argument(
        "--output", metavar="FILE", default=None,
        help="JSON output file (default: inventory_<timestamp>.json)"
    )
    args = parser.parse_args()

    session = attach("UmamusumePrettyDerby.exe") or attach("umamusume")
    if session is None:
        print("[!] UmamusumePrettyDerby.exe not found — is the game running?")
        sys.exit(1)

    ready    = threading.Event()
    dump_evt = threading.Event()
    dump_data: dict = {}

    script = session.create_script(FRIDA_SCRIPT)

    def on_message(message, _data):
        if message["type"] == "send":
            p = message["payload"]
            if p["type"] == "ready":
                ready.set()
            elif p["type"] == "status":
                print(f"[*] {p['msg']}")
            elif p["type"] == "error":
                print(f"[!] {p['msg']}")
            elif p["type"] == "dump":
                dump_data.update(p)
                dump_evt.set()
        elif message["type"] == "error":
            print(f"[!] Script error: {message.get('stack', message)}")
            ready.set()

    script.on("message", on_message)
    script.load()

    if not ready.wait(timeout=30):
        print("[!] Script did not become ready within 30 s — check for errors above")
        session.detach()
        sys.exit(1)

    print("[*] Hooks active.")
    print("[*] Navigate to the Support Card screen, then the Uma Stable.")
    print("[*] Press Enter to save captured data.  Ctrl+C to exit.\n")

    snapshot_index = 0
    try:
        while True:
            input()   # block until Enter

            dump_evt.clear()
            script.post({"type": "dump"})

            if not dump_evt.wait(timeout=10):
                print("[!] No response from script — try again")
                continue

            snapshot_index += 1
            cards = dump_data.get("support_cards", [])
            umas  = dump_data.get("trained_umas",  [])

            if not cards and not umas:
                print("[snapshot] Nothing captured yet — navigate to the relevant screens first")
                continue

            out_path = args.output or f"inventory_{int(time.time())}.json"
            Path(out_path).write_text(
                json.dumps({"support_cards": cards, "trained_umas": umas},
                           indent=2, ensure_ascii=False),
                encoding="utf-8"
            )
            print(f"[snapshot {snapshot_index}] "
                  f"{len(cards)} support cards, {len(umas)} trained umas → {out_path}\n")

    except KeyboardInterrupt:
        pass
    finally:
        session.detach()

    print("[*] Detached.")


if __name__ == "__main__":
    main()
