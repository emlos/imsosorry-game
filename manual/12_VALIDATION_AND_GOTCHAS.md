# Validation and Gotchas

## Exact keys are enforced

Many objects reject extra fields. A typo such as:

```js
playbackrate: 0.8
```

will not be treated as `playbackRate`; it fails validation.

When adding engine fields, search every `requireExactKeys` set involved.

## `showText` ordering

Invalid:

```js
[
    { type: "showText", pages: ["Hello."] },
    { type: "setFlag", flag: "spoken", value: true },
]
```

Valid:

```js
[
    {
        type: "showText",
        pages: ["Hello."],
        afterClose: [
            { type: "setFlag", flag: "spoken", value: true },
        ],
    },
]
```

## Missing flag versus false

```js
{ flag: "x", equals: false }
```

requires an explicitly stored false value.

```js
{ notFlag: "x" }
```

accepts false or missing.

## Touch and collision

A colliding entity cannot use a touch interaction. A tile on a colliding layer cannot use a touch interaction. The player cannot enter the interaction cell to trigger it.

## Base layer rules

- At least one base cell must be non-empty.
- Sized tiles cannot be placed on base.
- Entries and exit targets must land on walkable base and avoid collision.

## Footprints

- Tile footprint offsets are non-negative only.
- The anchor is the placed grid cell.
- Every footprint cell must stay inside the map.
- A tile interaction covers every footprint cell.
- Sprite-backed entity collision occupies one cell. Tile-backed entities use the referenced tile footprint.

## Shallow map tile override

Map-specific tiles are shallow-merged with global tiles. Nested fields are not deep-merged.

## Random IDs

- Keep IDs stable after saves exist.
- `save`/`once` store choice indexes; reordering choices can alter old saves.
- Tile interaction random IDs must be unique across interactive tile definitions in one map.
- `roomVisit` events require the active room runtime.

## Map ID refactors

The editor can rewrite map-owned references but cannot modify external source files. Items, global tiles, sprites, presets, or other registries may block renaming.

Old saves retain old map IDs and are not migrated.


## Entity visual schema

Entities use `visual: { type, id }`. `type` is `"sprite"` or `"tile"`; the old entity `spriteId` property and `setEntitySprite` effect are not supported. Use `setEntityVisual` for runtime changes.

Every entity also requires `transform: { flipX, flipY }` with explicit booleans. These flags affect rendering only. They do not change occupied cells, collision, interaction reach, or depth sorting. Tile-layer cells have no transform schema; use a tile-backed entity when a unique tile visual needs mirroring.

## Entity ID refactors

Entity IDs are map-local but can be referenced by effects. Use the editor's rename operation rather than editing the string in one place.

## Direct teleport versus teleport effect

- Direct handler is concise for fixed destinations.
- Teleport effect composes with dialogue, conditions, random branches, sounds, flags, and item mutations.
- Do not call a teleport effect while dialogue is open; put it in `afterClose`.

## `onExit` can intercept an exit

If `onExit` opens dialogue or transitions elsewhere, the original edge/teleport transition stops. This can be useful, but a plain exit warning dialogue without an `afterClose` teleport requires the player to attempt the exit again.

## Music continuity

A shared `continuityId` preserves playback only when the requested track ID is also the same.

`restart: "never"` preserves the current track even when another track is requested, which can be surprising if used as a map default.

## Conditional music fallback

A conditional map music array must have exactly one unconditional entry, and it must be last.

## Audio metadata

Custom `loopStart`/`loopEnd` require `loop: true`. Loop end is checked against actual media duration during audio preparation.

## Atlas bounds

Every static source and every calculated animation frame must fit the loaded texture. The whole atlas does not need to be divisible by frame dimensions.

## Interaction cell conflict

Only one spatial interaction is stored per cell. A multi-cell entity interaction can replace tile interactions on any cell in its footprint.

## Player versus entity coordinates

- Player save/runtime coordinates may use quarter cells.
- Authored entries and entity positions are integer cells.
- `setEntityPosition` accepts integers only.

## Mutation safety

Spatial mutations in the active map are rolled back when they would leave the player outside walkable space or inside collision.

## Editor import

The editor imports JSON-compatible data or its own generated JavaScript. It does not parse arbitrary JavaScript expressions, imports, spreads, or constants.

## Development save changes

Clear or migrate development saves after:

- Renaming/removing maps or entities.
- Reordering/removing stored random choices.
- Changing the random algorithm/version.
- Changing persistent state schema.
- Incrementing save format requirements.

## Edge doorway ranges

- Edge-to-edge exits require `targetRange`; `preserveAxis` and `offset` are not supported.
- Source and target ranges must have equal inclusive lengths.
- Room resizing leaves ranges unchanged so invalid connections remain visible to editor validation.
- Startup validation checks every integer target doorway cell; runtime footbox validation remains authoritative for fractional placement.
