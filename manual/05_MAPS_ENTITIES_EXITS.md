# Maps, Entities, Entries, Layers, and Exits

## Map template

```js
{
    id: "room-example",
    initialEntryId: "start",

    entries: {
        start: {
            col: 2,
            row: 3,
            facing: { dc: 0, dr: 1 },
        },
    },

    exits: [],
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
- `active` is saved runtime state and can be mutated.
- `visual`, `collision`, position, and active state can be changed persistently.
- `condition` controls authored presence in addition to runtime `active`.
- `interaction` must be `null` or a valid interaction.
- Collision plus a `touch` interaction is forbidden.

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
