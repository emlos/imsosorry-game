# Yume-like static HTML/JS prototype

No build step and no external libraries.

## Run it

Serve the directory because the project uses JavaScript modules:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Controls

- Arrow keys or WASD: move continuously while held
- Z or Enter: activate an action interaction on the current or a nearby tile

When several movement keys are held, the most recently pressed direction wins. Held input is cleared during map transitions.

## Structure

```text
yume-html-prototype/
├── index.html
├── styles.css
├── game.js
├── player.js
├── maps.js
├── tiles.js
├── interactions.js
└── assets/
    └── tiles/
```

## Tile registry

`tiles.js` contains the shared numeric tile IDs and their definitions. Maps normally reference those IDs directly:

```js
[FLOOR, FLOOR, WALL, WALL]
```

Each map retains a `tiles` object for local overrides or additions. An override is merged onto the shared definition with the same ID.

```js
tiles: {
    [TILE_IDS.WALL]: {
        path: "./assets/tiles/special_wall.png",
    },
},
```

Tile definitions have no type field. A rendered tile only needs an image `path`. Optional properties are:

- `size: [width, height]` for a larger render and collision footprint
- `collision: true` or `false` to override a layer's collision default
- `interaction` for a declarative interaction definition

## Rectangular maps and void cells

All layers in a map must be rectangular and have the same dimensions as its base layer. There is no map compiler.

Use tile ID `-1` for an absent cell:

```js
const E = EMPTY_TILE_ID;

base: [
    [FLOOR, FLOOR, FLOOR],
    [FLOOR, E, E],
]
```

A `-1` cell is not rendered. On the base layer it is also not walkable.

## Layer defaults

- Every non-void base cell is walkable. Tile collision flags are ignored on the base layer.
- Tiles on the `obstacles` layer collide by default. Set `collision: false` on a tile to override this.
- Tiles on other layers do not collide by default. Set `collision: true` when needed.

Sized tiles are not allowed on the base layer because one base cell represents one movement cell.

## Entries

Only the first map requires `initialEntryId`. Other maps only need entries referenced by teleports or other transition mechanisms.

```js
entries: {
    fromRoom01: {
        col: 2,
        row: 5,
        facing: { dc: -1, dr: 0 },
    },
}
```

## Interactions

Reusable interaction definitions and the handler registry live in `interactions.js`. Shared tiles in `tiles.js` reference those definitions, so maps only place tile IDs.

The current handlers are:

- `collect`
- `teleport`

Supported triggers are `action`, `touch`, and `both`.

The runtime assumes at most one interaction target per occupied cell. Overlapping interactions are undefined behavior.

Every triggered interaction dispatches a `game-interaction` custom event from the canvas before its handler executes.

## Validation

Maps are validated once during startup. The pass checks map IDs, rectangular layers, tile references, entries, interaction definitions, and teleport references. Runtime map loading assumes that validated data remains unchanged.
