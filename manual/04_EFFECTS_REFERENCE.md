# Effects Reference

All effect objects have:

```js
{
    type: "effectType",
    condition: { /* optional condition */ },
    // effect-specific fields
}
```

Unknown and extra keys fail validation.

## Sequence rules

- Normal effect arrays must be non-empty.
- A random choice's `effects` array may be empty to represent “nothing happens.”
- Effects execute in array order. Camera animations with a nonzero `durationMs` block later effects until the animation finishes.
- An effect whose `condition` is false is skipped.
- `showText` must be the final reachable effect in its array.
- Put work that follows dialogue in `showText.afterClose`.
- Only one dialogue-opening path may be reachable in an effect array.

## Flags

### `setFlag`

```js
{
    type: "setFlag",
    flag: "generator.on",
    value: true,
}
```

`value` must be a boolean.

### `toggleFlag`

```js
{
    type: "toggleFlag",
    flag: "lamp.on",
}
```

Toggles between true and not-true.

## Inventory

### `addItem`

```js
{
    type: "addItem",
    itemId: "pink-orb",
    quantity: 1,
}
```

Quantity must be a positive integer.

### `removeItem`

```js
{
    type: "removeItem",
    itemId: "key",
    quantity: 1,
}
```

Fails at runtime if the player owns less than the requested quantity.

## Player

### `setPlayerSprite`

```js
{
    type: "setPlayerSprite",
    spriteId: "default",
}
```

The new player's collision footprint must fit at the current position.

### `setPlayerMoveSpeed`

```js
{
    type: "setPlayerMoveSpeed",
    tilesPerSecond: 4,
}
```

Value must be positive.

## Entity mutations

When `mapId` is omitted, the effect targets its current effect-context map.

### `setEntityActive`

Persistent:

```js
{
    type: "setEntityActive",
    entityId: "stranger",
    active: true,
}
```

Another map:

```js
{
    type: "setEntityActive",
    mapId: "room-attic",
    entityId: "stranger",
    active: true,
}
```

Current room visit only:

```js
{
    type: "setEntityActive",
    entityId: "shadow",
    active: true,
    persistence: "roomVisit",
}
```

`roomVisit` persistence is allowed only for an entity in the active/current map. The temporary override disappears on a later room visit, but is included when saving inside the current visit.

### `setEntityPosition`

```js
{
    type: "setEntityPosition",
    mapId: "room-hall", // optional
    entityId: "statue",
    col: 6,
    row: 3,
}
```

Entity positions use non-negative integer cells.

### `setEntityVisual`

Use a sprite visual:

```js
{
    type: "setEntityVisual",
    entityId: "statue",
    visual: { type: "sprite", id: "glass-figure" },
}
```

Or reuse a tile visual from the target map:

```js
{
    type: "setEntityVisual",
    entityId: "statue",
    visual: { type: "tile", id: TILE_IDS.TREE },
}
```

### `setEntityCollision`

```js
{
    type: "setEntityCollision",
    entityId: "door",
    collision: false,
}
```

Mutations are checked so they cannot invalidate the player's current placement in the active map.

## Tile mutation

### `setTile`

```js
{
    type: "setTile",
    mapId: "room-hall", // optional
    layer: "obstacles",
    col: 5,
    row: 2,
    tileId: TILE_IDS.WALL,
}
```

Clear a cell:

```js
{
    type: "setTile",
    layer: "obstacles",
    col: 5,
    row: 2,
    tileId: -1,
}
```

The target tile must exist in that map's merged tile definitions, fit within the map, and be compatible with the layer.

## Camera

Camera effects control authored camera state rather than dialogue behavior. `durationMs` is optional except for `cameraShake`; a nonzero duration blocks the remaining effect sequence until the animation finishes.

### `cameraPan`

Keep the existing follow target and offset the camera in world pixels:

```js
{ type: "cameraPan", offsetX: -64, offsetY: 0, durationMs: 500 }
```

Or stop following and pan to an absolute world-space top-left position:

```js
{ type: "cameraPan", x: 128, y: 64, durationMs: 500 }
```

### `cameraZoom`

```js
{ type: "cameraZoom", zoom: 3, durationMs: 500 }
```

Zoom must be between `0.25` and `8`. Integer levels are preferred for pixel art.

### `cameraFollow`

```js
{ type: "cameraFollow", target: "player", offsetX: 0, offsetY: 0, durationMs: 400 }
{ type: "cameraFollow", target: "entity", entityId: "statue", durationMs: 400 }
{ type: "cameraFollow", target: "none", durationMs: 0 }
```

Entity targets are resolved in the effect-context map.

### `cameraShake`

```js
{ type: "cameraShake", intensity: 6, durationMs: 350 }
```

### `cameraReset`

```js
{ type: "cameraReset", durationMs: 500 }
```

Restores the active map's authored camera defaults.

## Transition and saving

### `teleport`

```js
{
    type: "teleport",
    mapId: "room-next",
    entryId: "fromHall",
}
```

Optional music transition:

```js
{
    type: "teleport",
    mapId: "room-next",
    entryId: "fromHall",
    musicTransition: "crossfade",
    musicTransitionMs: 900,
    inheritCamera: true, // optional; otherwise the destination map resets camera state
}
```

Policies: `inherit`, `replace`, `crossfade`, `silence`.

A transition cannot begin while dialogue is still open; put it in `afterClose`.

### `saveGame`

```js
{ type: "saveGame" }
```

Usually placed in save-point dialogue `afterClose`.

## Sound

### `playSound`

```js
{
    type: "playSound",
    soundId: "receiver-chime",
}
```

The sound ID must exist in `SOUNDS`.

## Background music

The playback fields shared by `playMusic` and `pushMusic` are:

```js
{
    trackId: "forest",
    continuityId: "forest-region", // optional
    fadeInMs: 500,                 // optional, >= 0
    fadeOutMs: 500,                // optional, >= 0
    crossfadeMs: 700,              // optional, >= 0
    restart: "if-different",       // always | if-different | never
    resume: false,                 // optional
    volume: 1,                     // optional, 0..1 multiplier
    playbackRate: 1,               // optional, 0.25..4
}
```

### `playMusic`

```js
{
    type: "playMusic",
    trackId: "forest",
    crossfadeMs: 700,
    restart: "if-different",
}
```

### `stopMusic`

```js
{
    type: "stopMusic",
    fadeOutMs: 900,
}
```

### `pushMusic`

Stores the current music state, then starts another track:

```js
{
    type: "pushMusic",
    trackId: "strange-room",
    crossfadeMs: 700,
    restart: "always",
}
```

### `popMusic`

Restores the most recently pushed music position and settings:

```js
{
    type: "popMusic",
    crossfadeMs: 700,
}
```

Allowed fields: `fadeInMs`, `fadeOutMs`, `crossfadeMs`.

If the stack is empty, popping stops the current music.

### `playMusicEffect`

Plays a non-looping musical stinger and ducks the background track:

```js
{
    type: "playMusicEffect",
    musicEffectId: "discovery",
    duckMusicTo: 0.2,
    volume: 1,
    playbackRate: 1,
}
```

- `duckMusicTo`, `volume`: 0..1.
- `playbackRate`: 0.25..4.

## Deterministic random branch

### `random`

```js
{
    type: "random",
    id: "crystal-response",
    scope: "interaction",
    choices: [
        {
            weight: 80,
            effects: [
                {
                    type: "showText",
                    pages: ["The crystal is quiet."],
                },
            ],
        },
        {
            weight: 20,
            effects: [
                { type: "playSound", soundId: "receiver-chime" },
                {
                    type: "showText",
                    pages: ["Something answers."],
                },
            ],
        },
    ],
}
```

See `06_RANDOMNESS.md` for scope semantics and stable IDs.

## Dialogue

### `showText`

```js
{
    type: "showText",
    speaker: "Receiver", // optional
    pages: [
        "The first page.",
        "The second page.",
    ],
    afterClose: [
        { type: "setFlag", flag: "receiver.read", value: true },
    ],
}
```

- `pages` must be a non-empty array of strings.
- `speaker` is optional.
- `afterClose` is optional but, when present, must be a non-empty effect array.
- Environmental animations continue during dialogue; the player does not move.
