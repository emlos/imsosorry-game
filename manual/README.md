# Yume Prototype v0.8.t-1 — Authoring Manual

This manual documents the systems present in the attached `0.8.t-1` project. It is intended as the central reference for map authoring, editor use, interactions, hooks, conditions, effects, deterministic randomness, music, assets, and common recipes.

The code is strict by design. Most authored objects accept only the documented keys; a misspelled or unsupported key should fail during game initialization or Playtest rather than being silently ignored.

## Start here

- `00_REFERENCE_CARD.md` — compact cheat sheet.
- `01_EDITOR_MANUAL.md` — what the map editor can and cannot edit.
- `02_HOOKS_TRIGGERS_AND_INTERACTIONS.md` — every place where authored behavior can run.
- `03_CONDITIONS.md` — flags, items, `all`, and `any`.
- `04_EFFECTS_REFERENCE.md` — complete effect reference with schemas.
- `05_MAPS_ENTITIES_EXITS.md` — map, entity, entry, layer, and exit formats.
- `06_RANDOMNESS.md` — save-seeded deterministic random choices.
- `07_MUSIC_AND_AUDIO.md` — map music, transitions, events, SFX, and stingers.
- `08_ASSETS_ANIMATION_ATLASES.md` — tile/sprite formats and atlas packing.
- `09_ITEMS_AND_INVENTORY.md` — item definitions and usable-item effects.
- `10_RECIPES.md` — pasteable patterns for common game events.
- `11_EXTENDING_THE_ENGINE.md` — files and checklists for adding new engine capabilities.
- `12_VALIDATION_AND_GOTCHAS.md` — strict rules and common failure modes.
- `FULL_REFERENCE.md` — all main reference chapters concatenated into one file.
- `snippets/templates.js` — compact JavaScript templates.

## Project files by responsibility

| File                       | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `maps.generated.js`        | Editor-owned map data.                                                    |
| `maps.js`                  | Re-exports generated maps.                                                |
| `tiles.js`                 | Tile IDs, atlas paths, and global tile definitions.                       |
| `sprites.js`               | Entity and player visual definitions.                                     |
| `editor/editor-catalog.js` | Editor labels, categories, and entity presets.                            |
| `items.js`                 | Inventory item definitions.                                               |
| `sounds.js`                | Sound, music, and music-effect registries.                                |
| `conditions.js`            | Condition operators and evaluation.                                       |
| `interactions.js`          | Interaction triggers and handlers.                                        |
| `effects.js`               | Effect types, validation, and execution.                                  |
| `random.js`                | Seed generation and deterministic weighted choice.                        |
| `music.js`                 | Map-level music definitions and music-entry events.                       |
| `audio.js`                 | Audio playback implementation.                                            |
| `game.js`                  | Runtime state, validation, transitions, mutations, saving, and rendering. |
| `editor/README.md`         | Short editor-specific project notes.                                      |
| `tools/pack_atlas.py`      | Atlas builder and snippet generator.                                      |

## Terminology

- **Hook:** a place where an effect sequence may run, such as `onEnter`, an interaction, an item use, or `showText.afterClose`.
- **Trigger:** the event that activates an interaction: currently `action` or `touch`.
- **Interaction handler:** the top-level interaction behavior: currently `effects` or direct `teleport`.
- **Effect:** one operation inside an effect array, such as `setFlag`, `showText`, or `random`.
- **Condition:** a test controlling presence, availability, music, or one effect.
- **Owner ID:** the stable namespace used by deterministic random effects.
- **Room visit:** one established stay in a map. Saving and reloading inside that room preserves its current visit serial.
