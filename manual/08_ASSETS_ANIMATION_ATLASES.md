# Assets, Animation, and Atlases

## Atlas paths

The current project stores atlas constants in `tiles.js`:

```js
export const ATLAS_PATHS = {
    world: "./assets/atlases/world.png",
    entities: "./assets/atlases/entities.png",
    player: "./assets/atlases/player.png",
    debug: "./assets/atlases/debug.png",
};
```

Tile and sprite definitions refer to those constants rather than repeating paths.

## Visual source model

```js
{
    path: ATLAS_PATHS.entities,
    source: [x, y, frameWidth, frameHeight],
    size: [drawWidth, drawHeight],
}
```

- `path`: shared image.
- `source`: source origin and one frame's dimensions.
- `size`: world drawing size.
- For static visuals, the source rectangle is the complete visual.
- For animated visuals, frame coordinates are relative to the source origin.

## Animation format

```js
{
    defaultAnimation: "glow",
    animations: {
        glow: {
            fps: 6,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [1, 0],
            ],
        },
    },
}
```

Rules:

- `defaultAnimation` and `animations` must appear together.
- At least one animation is required.
- FPS must be positive.
- Frame coordinates are non-negative integer pairs.
- The calculated source rectangle for every frame must fit the image.
- Repeating coordinates creates a hold/pause.

Ambient tile/entity animations use a global visual clock and continue while inventory or dialogue is open.

## Tile definition

```js
[TILE_IDS.TREE]: {
    path: ATLAS_PATHS.world,
    source: [64, 0, 32, 64],
    size: [32, 64],             // optional; default cell size
    footprint: [[0, 0]],        // optional; default one cell
    collision: true,            // optional; layer supplies default
    condition: { /* ... */ },   // optional
    interaction: { /* ... */ }, // optional
}
```

Allowed fields:

```text
path
size
source
defaultAnimation
animations
footprint
collision
condition
interaction
```

### Tile footprint

```js
footprint: [
    [0, 0],
    [1, 0],
]
```

- Offsets are non-negative integer pairs.
- Duplicates are forbidden.
- Footprint controls collision and interaction coverage.
- Image dimensions do not imply collision footprint.
- The visual is bottom-aligned to the bottom of its footprint.

## Entity sprite definition

```js
"stone-statue": {
    path: ATLAS_PATHS.entities,
    source: [102, 68, 32, 64],
    size: [32, 64],
}
```

Allowed fields:

```text
path
size
source
defaultAnimation
animations
```

Entity sprites require `size` and `source`.

## Player sprite definition

Image player:

```js
default: {
    kind: "image",
    path: ATLAS_PATHS.player,
    source: [0, 0, 32, 64],
    size: [32, 64],
    footprint: {
        width: 16,
        height: 16,
        offsetX: 8,
        offsetY: 8,
    },
    defaultAnimation: "idle-down",
    animations: { /* ... */ },
}
```

Procedural debug player:

```js
"debug-shape": {
    kind: "shape",
    fillStyle: "#f3a7c0",
    strokeStyle: "#3f2945",
    footprint: {
        width: 16,
        height: 16,
        offsetX: 8,
        offsetY: 8,
    },
}
```

Directional player animation names:

```text
idle-up       walk-up
idle-down     walk-down
idle-left     walk-left
idle-right    walk-right
```

Fallback order is requested movement clip, directional idle clip, default animation, then static behavior where applicable.

## Editor metadata

Add labels/categories in `editor/editor-catalog.js`:

```js
export const TILE_EDITOR_META = {
    [TILE_IDS.NEW_TILE]: {
        label: "New tile",
        category: "Nature",
    },
};
```

```js
export const SPRITE_EDITOR_META = {
    "new-sprite": {
        label: "New sprite",
        category: "Characters",
    },
};
```

Add an entity preset only when a commonly placed sprite should carry default collision/interaction behavior:

```js
newPreset: {
    label: "New object",
    entity: {
        active: true,
        spriteId: "new-sprite",
        collision: true,
        interaction: null,
    },
}
```

## Atlas packer

Tool:

```text
tools/pack_atlas.py
```

Example tiles command:

```bash
python tools/pack_atlas.py source-art/forest-atlas \
    --kind tiles \
    --atlas-key forest \
    --output assets/atlases/forest.png \
    --runtime-path ./assets/atlases/forest.png \
    --snippets build/forest-atlas-snippets.txt \
    --width 512 \
    --start-id 27
```

Example sprites command:

```bash
python tools/pack_atlas.py source-art/characters \
    --kind sprites \
    --atlas-key characters \
    --output assets/atlases/characters.png \
    --runtime-path ./assets/atlases/characters.png \
    --snippets build/characters-atlas-snippets.txt \
    --width 512
```

The source folder is authoritative; each run rebuilds the atlas.

### Optional `atlas.json`

```json
{
    "glittering-crystal.png": {
        "label": "Glittering crystal",
        "category": "Interactables",
        "size": [32, 64],
        "frameSize": [32, 64],
        "defaultAnimation": "glitter",
        "animations": {
            "glitter": {
                "fps": 8,
                "frames": [0, 1, 2, 3, 2, 1]
            }
        }
    }
}
```

Integer frames mean `[column, 0]`; explicit `[column, row]` pairs are also accepted.

The generated snippets intentionally omit collision, footprint, conditions, and interactions. Add those after pasting.

## Current limitations

- No per-placement tile or entity mirroring.
- Inventory icons remain standalone static image paths.
- No visual animation editor.
- No rotated/trimmed atlas regions or padding-aware packing.
