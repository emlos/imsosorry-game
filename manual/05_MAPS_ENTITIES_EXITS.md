# Maps, Entities, Entries, Layers, and Exits

## Map template

```js
{
    id: "room-example",
    initialEntryId: "start",
    camera: { zoom: 2, follow: "player" },

    entries: {
        start: {
            col: 2,
            row: 3,
            facing: { dc: 0, dr: 1 },
        },
    },

    exits: [],
    triggers: [],
    cameraZones: [],
    tiles: {},
    entities: [],

    layers: {
        base: [/* rectangular grid */],
        obstacles: [/* same dimensions */],
        // foreground: [/* optional, same dimensions */],
    },

    editorGroup: "Example", // editor-only, optional

    music: undefined,        // optional; see music manual
    musicTransition: "crossfade",
    musicTransitionMs: 700,
    musicEvents: [],

    onEnter: [],
    onExit: [],
}
```

`maps.generated.js` is editor-owned. The first map must have a valid `initialEntryId`. In practice, giving every map one is useful for editor defaults and debugging.


## Map camera defaults

Every map defines the base camera:

```js
camera: {
    zoom: 4,
    follow: "player",
}
```

Zoom is between `0.25` and `8`. Clamping uses the logical visible world size: `canvas.width / zoom` and `canvas.height / zoom`. Normal map transitions discard source-map camera-zone owners and initialize the destination base and any zones containing the destination position.

`inheritCamera: true` preserves the visible source camera as the starting rendered state for a short destination transition. Source-map zone owners are still removed, and an entity follow target from the previous map is never retained.

## Declarative camera zones

Camera zones are continuous region-owned state, not one-time trigger effects:

```js
cameraZones: [
    {
        id: "close-up",
        region: { col: 5, row: 2, width: 9, height: 5 },
        priority: 10,
        camera: {
            zoom: 6,
        },
        transitionInMs: 500,
        transitionOutMs: 500,
    },
    {
        id: "look-ahead",
        region: { col: 10, row: 2, width: 9, height: 5 },
        condition: { flag: "camera.lookAhead" }, // optional
        priority: 20,
        camera: {
            offsetX: 96,
        },
        transitionInMs: 500,
        transitionOutMs: 500,
    },
]
```

A zone is active while the player is inside its rectangle, its optional condition is true, and its map is current. This is reconstructed on spawn and save load, reevaluated while stationary when conditions change, and cleared on map transitions even when no ordinary exit movement occurs.

The owner ID is:

```text
map:<mapId>:camera-zone:<zoneId>
```

Zones contain partial camera patches. Resolution order is:

1. map/scripted base camera;
2. active zones sorted by ascending `priority`;
3. map array order as the tie-breaker.

Later-applied properties win, while omitted properties remain inherited. Leaving one overlapping zone removes only that owner and reveals the remaining base and overrides. Zone state ignores trigger frequency; `once-per-visit` and `once-per-save` apply only to separate trigger effects.

Supported patch properties are `zoom`, `offsetX`, `offsetY`, `x`, `y`, and `followTarget`. A local entity target uses:

```js
followTarget: { type: "entity", entityId: "statue" }
```

Enter and exit changes replace unfinished camera transitions from the current rendered state. Rapid boundary crossings do not throw or snap through an obsolete target.

## Pixel-stable world rendering

Logical camera coordinates remain floating point. Rendering converts complete world-space rectangle edges to screen coordinates and rounds those screen edges:

```js
screenLeft = Math.round((worldLeft - cameraX) * zoom)
screenRight = Math.round((worldRight - cameraX) * zoom)
```

Base tiles, obstacle tiles, foreground tiles, entities, and the player all use the same conversion. Shared edges therefore remain identical, fixed-integer-zoom pans advance in screen-pixel increments, and camera snapping never changes collision or trigger logic. The game canvas is displayed at its native `960×640` CSS size; narrow layouts scroll rather than applying a fractional responsive scale.

The selected zoom policy is continuous nearest-neighbor zoom with screen-space translation snapping. Fractional intermediate zoom values may display uneven source-pixel widths, but integer endpoints are crisp and adjacent world rectangles remain joined.

## Layers

Supported layer names:

```text
base
obstacles
foreground
```

Every present layer must have the same rectangular dimensions as `base`.

### `base`

- Every non-empty cell is walkable.
- Never creates collision.
- Must contain at least one non-empty cell.
- Cannot contain a tile with an explicit `size`; base tiles are expected to be cell-sized.

### `obstacles`

- Drawn in the depth-sorted world pass.
- Creates collision by default.
- A tile can opt out with `collision: false`.

### `foreground`

- Drawn after depth-sorted objects and the player.
- Does not collide by default.
- A tile can opt in with `collision: true`.
- Preserved and previewed by the editor, but not currently edited there.

### Empty cells

```js
-1
```

Use `EMPTY_TILE_ID` in code when convenient.

## Map-specific tile overrides

Each map's `tiles` object is shallow-merged over global `TILES` by tile ID:

```js
{
    tiles: {
        [TILE_IDS.WALL]: {
            condition: { flag: "walls.visible" },
        },
    },
}
```

Because the merge is shallow, an override replaces whole nested fields such as `animations` or `interaction`; include the complete nested object when overriding it.

Map-specific new numeric IDs are also allowed, provided every placed ID resolves after merging.

## Entries

```js
entries: {
    fromHall: {
        col: 3,
        row: 5,
        facing: { dc: 0, dr: -1 },
    },
}
```

Rules:

- `col` and `row` are non-negative integer cells.
- Facing is cardinal and must satisfy `abs(dc) + abs(dr) === 1`.
- The entry cell must be walkable and not colliding in initial state.

Cardinal facings:

```js
{ dc: 0, dr: -1 } // up
{ dc: 0, dr: 1 }  // down
{ dc: -1, dr: 0 } // left
{ dc: 1, dr: 0 }  // right
```

## Entities

```js
{
    id: "receiver",
    active: true,
    col: 4,
    row: 3,
    visual: { type: "sprite", id: "receiver" },
    transform: { flipX: false, flipY: false },
    collision: true,
    interaction: null,
    condition: { notFlag: "receiver.removed" }, // optional
}
```

A unique interactive placement can reuse any tile visual without duplicating it in `SPRITES`:

```js
{
    id: "strange-tree",
    active: true,
    col: 4,
    row: 6,
    visual: { type: "tile", id: TILE_IDS.TREE },
    transform: { flipX: true, flipY: false },
    collision: true,
    interaction: {
        handler: "effects",
        triggers: ["action"],
        effects: [{ type: "showText", pages: ["The bark is warm."] }],
    },
}
```

The tile supplies only the artwork, animation, size, and footprint. The entity supplies its own condition, collision, interaction, position, and runtime state.

Rules:

- IDs are unique within one map.
- Positions are non-negative integer cells.
- Sprite-backed entities occupy one cell. Tile-backed entities use the referenced tile footprint.
- `transform` is required and contains boolean `flipX` and `flipY` values.
- Mirroring affects drawing only; footprint, collision, interaction cells, and depth sorting are unchanged.
- Ordinary tile-layer placements do not support mirroring.
- `active` is saved runtime state and can be mutated.
- `visual`, `transform`, `collision`, position, and active state are represented in persistent entity state.
- `condition` controls authored presence in addition to runtime `active`.
- `interaction` must be `null` or a valid interaction.
- Collision plus a `touch` interaction is forbidden.

## Rectangular triggers

```js
triggers: [
    {
        id: "hallway-distortion",
        region: { col: 3, row: 4, width: 5, height: 2 },
        events: ["enter"],
        // itemId: "pink-orb", // required for itemUse
        frequency: "once-per-visit",
        condition: { notFlag: "hallway.resolved" }, // optional
        effects: [
            { type: "playSound", soundId: "receiver-chime" },
            { type: "showText", pages: ["The corridor bends behind you."] },
        ],
    },
],
```

Rules:

- `id` is unique within the map.
- `region.col` and `region.row` are non-negative integers.
- `region.width` and `region.height` are positive integers.
- The complete rectangle must fit inside the map.
- `events` is a non-empty, duplicate-free list containing `enter`, `exit`, `step`, and/or `itemUse`.
- `itemId` is required exactly when `events` contains `itemUse`; the item must exist in `ITEMS`.
- `frequency` is optional and defaults to `always`; supported values are `always`, `once-per-visit`, and `once-per-save`.
- `condition` is optional.
- `effects` is a non-empty effect sequence.
- Overlapping rectangles are valid and execute in array order.
- `enter`, `exit`, and `step` are evaluated after completed tile movement. `itemUse` is dispatched by the inventory while the player stands in the region.
- The regions have no rendering or collision of their own.

The editor's Trigger mode creates, moves, resizes, reorders, and overlays these rectangles. Its inspector edits condition and effect arrays as JSON.

## Static edge exit: target entry

```js
{
    edge: "east",
    range: [1, 4],
    targetMapId: "room-b",
    entryId: "fromA",
    musicTransition: "crossfade", // optional
    musicTransitionMs: 700,        // optional
}
```

## Static edge exit: target position

```js
{
    edge: "south",
    range: [2, 6],
    targetMapId: "room-b",
    targetPosition: {
        col: 4,
        row: 1,
        facing: { dc: 0, dr: 1 },
    },
}
```

The target position must be walkable and non-colliding.

Edge-to-edge geometry is shared by the game and editor through `map-edges.js`. Authored exits store both doorway ranges; the runtime derives the axis delta and never stores an offset.

## Static edge exit: connected doorway

```js
{
    edge: "east",
    range: [1, 5],
    targetMapId: "room-b",
    targetEdge: "west",
    targetRange: [3, 7],
}
```

Rules:

- `targetEdge` must be the opposite of `edge`.
- `targetRange` describes the corresponding opening on the target edge.
- `range` and `targetRange` must contain the same number of cells.
- The player keeps the exact relative, including fractional, position within the opening.
- Every target doorway cell must fit and be walkable.

## Random edge destination

```js
{
    id: "north-exit",
    edge: "north",
    range: [2, 5],
    destination: {
        type: "random",
        id: "destination",
        scope: "use",
        choices: [
            {
                weight: 95,
                targetMapId: "forest-normal",
                targetEdge: "south",
                targetRange: [1, 4],
            },
            {
                weight: 5,
                targetMapId: "forest-rare",
                entryId: "start",
                musicTransition: "crossfade",
                musicTransitionMs: 900,
            },
        ],
    },
}
```

Random exits need both:

- `exit.id`, which identifies the exit owner.
- `destination.id`, which identifies the random decision within that owner.

Each choice has a positive `weight` plus one complete destination form.

## Exit constraints

- `edge`: `north`, `south`, `east`, or `west`.
- `range`: two ordered non-negative integers, inclusive.
- Range must fit the source edge.
- Two exits on the same edge may not overlap.
- All destination references are validated.

## Player movement coordinates

The player moves on quarter-cell increments (`MOVEMENT_SUBDIVISIONS = 4`), but authored entries and entity positions remain integer cells. Player save coordinates may be quarter-cell values.
