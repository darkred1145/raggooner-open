# CLAUDE.md — tools/

Standalone Python scripts for extracting game data from the Umamusume Pretty Derby Windows client via Frida dynamic instrumentation.

**This work is currently shelved.** The support card inventory could not be found via memory scanning — it is stored in the IL2CPP managed C# heap, which is not accessible via msgpack pattern scanning. The uma roster extractor works.

## What These Scripts Do

| Script | Status | Purpose |
|---|---|---|
| `extract_uma_roster.py` | Broken (superseded) | Old msgpack approach — could only find training-deck snapshots, not the full owned-character roster |
| `extract_support_cards.py` | Partially working | Anchors on `support_card_id` msgpack key; finds ~40/178 cards (only training-deck snapshots, not full inventory) |
| `find_card_inventory.py` | Failed | Searches for `support_card_list` + large array — inventory not in msgpack |
| `find_release_card.py` | Failed | Searches for `release_card_array` key — not found in msgpack memory |
| `find_le_cards.py` | Failed | Scans for LE int32 card IDs — only false positives found |
| `find_card_by_id.py` | Diagnostic | Finds a specific card ID in memory and dumps context |
| `discover_array_keys.py` | Diagnostic | Discovers all msgpack array keys (DC/DD markers) in memory |
| `debug_support_cards.py` | Diagnostic | Revealed correct field name is `support_card_id` (not `card_id`) |
| `dump_lb_context.py` | Diagnostic | Revealed all LB data is in trained uma training-deck snapshots |
| `linux_extract_*.py` | Variants | Linux versions of the extractors (for WSL/Linux hosts) |

## Why Support Card Inventory Failed

All msgpack data found in memory is training-deck snapshots inside trained uma entries (`support_card_list` fixarray(6) inside trained uma maps, alongside `skill_array`, `proper_distance_*` fields). The actual card inventory (all owned cards + limit break counts) is a C# object in the IL2CPP managed heap and cannot be found by scanning for msgpack byte patterns.

## IL2CPP-based Scripts (new approach)

The msgpack scanning approach cannot reach the managed heap.  These scripts use
the IL2CPP runtime API (`GameAssembly.dll` exports) to read C# objects directly —
the same technique used by the horseACT Hachimi plugin.

| Script | Purpose |
|---|---|
| `dump_il2cpp_classes.py` | Static dump of every IL2CPP class + methods in the process. Use `--filter` to search by keyword (e.g. `--filter SupportCard`). Produces a JSON you can grep offline to find the right class/method to hook. |
| `track_active_classes.py` | Hooks `il2cpp_object_new` and records every class being instantiated. Navigate to a specific screen, press Enter to snapshot what was created. Useful for narrowing down which class backs a given UI screen. |
| `extract_inventory.py` | **Main extractor.** Hooks `WorkSupportCardData.GetSupportCardList()` and `WorkTrainedCharaData.get_List()` to read the full owned support-card inventory and trained-uma roster. Navigate to the relevant screens, then press Enter to save JSON. |

### Recommended workflow for finding a new data source

1. Run `track_active_classes.py --filter Card` while navigating through the
   support card screens.  Note any class names that appear only on those screens.

2. Run `dump_il2cpp_classes.py --filter <ClassName>` to list all methods on the
   candidate class.  Look for `Get`, `Load`, `Initialize`, `UpdateAll`, or
   `Awake`-style methods — those are good hook targets.

3. Write a targeted hook script (see horseACT's `hooks.rs` as the reference for
   what to read once you have the method and field names).

### Building Executables

```
pip install pyinstaller frida
pyinstaller IL2CppDumper.spec       # → dist/IL2CppDumper.exe
pyinstaller ActiveClassTracker.spec # → dist/ActiveClassTracker.exe
pyinstaller InventoryExtractor.spec # → dist/InventoryExtractor.exe
```

Output goes to `dist/`.  If UPX is not installed, set `upx=False` in the spec.
If the build complains about `_frida.pyd`, run
`python -c "import frida; print(frida.__file__)"` to locate it and add it to
`binaries` in the spec manually.

## Building Executables (legacy msgpack scripts)

Scripts use `pyinstaller` with `.spec` files:
```
pyinstaller SupportCardExtractor.spec
pyinstaller UmaRosterExtractor.spec
```
Output goes to `dist/`. Requires `pyinstaller`, `frida`, and `msgpack` installed.

## Dependencies

- `frida` — dynamic instrumentation (attaches to `UmamusumePrettyDerby.exe`)
- `msgpack` — for decoding binary msgpack data from memory (legacy scripts only)
- Python ≥ 3.10

## Key Findings

- The game uses **msgpack** for network/cache data serialization
- Support card field name is `support_card_id` (not `card_id`)
- Limit break field name is `limit_break_count`
- Card ID ranges: SSR = 30xxx, SR = 20xxx, R = 10xxx
- Uma character IDs: 100xxx (e.g. Special Week = 100101) — different namespace from support cards
