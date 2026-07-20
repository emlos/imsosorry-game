# Reference Card

## Interaction triggers

```js
triggers: ["action"];
triggers: ["touch"];
triggers: ["action", "touch"];
```

- `action`: player uses the interaction button while facing the target.
- `touch`: fires when the player's footbox newly enters the interaction cell.
- A colliding entity or colliding tile placement cannot use `touch`.

## Rectangular map triggers

```js
triggers: [
  {
    id: "hallway-distortion",
    region: { col: 3, row: 4, width: 5, height: 2 },
    events: ["enter"], // enter, exit, step
    frequency: "always", // always, once-per-visit, once-per-save
    condition: { flag: "world.changed" }, // optional
    effects: [/* effects */],
  },
];
```

- Evaluated only after a completed tile movement.
- Overlaps execute in `triggers` array order.
- Stable effect owner: `map:<mapId>:trigger:<triggerId>`.

## Camera

```js
camera: { zoom: 4, follow: "player" }
```

Camera effects modify the persistent base state. Nonzero durations delay later effects in the same effect sequence, but never pause world updates or clear movement input. New targets supersede unfinished camera transitions from the current rendered state.

Continuous region-owned overrides belong in `cameraZones`:

```js
cameraZones: [
  {
    id: "close-up",
    region: { col: 5, row: 2, width: 9, height: 5 },
    priority: 10,
    camera: { zoom: 6 },
    transitionInMs: 500,
    transitionOutMs: 400,
  },
];
```

Zones are reconstructed from current position and conditions, combine by priority and array order, and remove only their own partial camera patch. Shake intensity is measured in screen pixels. World rendering rounds shared rectangle edges after applying zoom; UI remains outside the canvas world.

## Entity self-target effects

Inside an entity interaction only:

```js
{ type: "setEntityActive", target: "self", active: false }
```

Supported by `setEntityActive`, `setEntityPosition`, `setEntityVisual`, and `setEntityCollision`. Do not combine `target: "self"` with `entityId` or `mapId`. Nested random and `afterClose` effects retain the entity subject.

Missing item IDs remain validation errors; no runtime placeholder is created.

## Interaction authoring templates

In the entity inspector, choose a template and click **Replace JSON with template**. Available starting points: dialogue, teleport, save point, item pickup, switch/flag change, inspect once, and conditional dialogue. The replacement is only a draft until **Apply**. Runtime validation remains strict.

## Interaction handlers

```js
{
    handler: "effects",
    triggers: ["action"],
    condition: { flag: "machine.powered" }, // optional
    effects: [/* effects */],
    message: "A status-log line.",           // optional, not dialogue
}
```

```js
{
    handler: "teleport",
    triggers: ["action"],
    params: {
        mapId: "room-next",
        entryId: "fromHall",
        musicTransition: "crossfade", // optional
        musicTransitionMs: 700,        // optional
    },
    message: "The door opens.",
}
```

## Conditions

```js
{ flag: "x" }                 // flag is exactly true
{ flag: "x", equals: false }  // flag is exactly false; missing is not false
{ notFlag: "x" }              // flag is not true; false or missing
{ hasItem: "key" }            // quantity > 0
{ notItem: "key" }
{ all: [conditionA, conditionB] }
{ any: [conditionA, conditionB] }
```

## Effects

```text
setFlag             toggleFlag
addItem             removeItem
setPlayerSprite     setPlayerMoveSpeed
setEntityActive     setEntityPosition
setEntityVisual     setEntityCollision
setTile             teleport
cameraPan           cameraZoom
cameraFollow        cameraShake
cameraReset         saveGame
playSound
playMusic           stopMusic
pushMusic           popMusic
playMusicEffect     random
showText
```

Every effect may add:

```js
condition: {
  /* condition */
}
```

Important dialogue rule: `showText` must be the final reachable effect in its array. Put later operations in `afterClose`.

## Hooks that can run effects

```text
Entity interaction (`handler: "effects"`)
Tile interaction (`handler: "effects"`)
Usable item universal effects (`ITEMS[itemId].effects`, optional)
Map `onEnter`
Map `onExit`
Map `musicEvents[].effects`
Map `triggers[].effects` (`enter`, `exit`, `step`, or contextual `itemUse`)
`showText.afterClose`
`random.choices[].effects`
```

## Random scopes

| Scope         | Behavior                                                                |
| ------------- | ----------------------------------------------------------------------- |
| `save`        | One choice is fixed for the whole save; it executes every time invoked. |
| `once`        | Chooses and executes once for the save; later calls do nothing.         |
| `roomVisit`   | Same choice throughout one room visit; rerolls on a later visit.        |
| `interaction` | Advances its own counter on each invocation.                            |
| `use`         | Same mechanics as interaction, but a separate counter namespace.        |

## Layers

- `base`: defines walkable cells; never collides. Sized tiles are forbidden.
- `obstacles`: collides unless tile has `collision: false`.
- `foreground`: draws above the world; collides only with `collision: true`.
- Empty cell: `EMPTY_TILE_ID`, currently `-1`.

## Static edge exits

```js
{
    edge: "east",
    range: [1, 4],
    targetMapId: "room-b",
    entryId: "fromA",
}
```

```js
{
    edge: "east",
    range: [1, 4],
    targetMapId: "room-b",
    targetPosition: {
        col: 2,
        row: 3,
        facing: { dc: 1, dr: 0 },
    },
}
```

```js
{
    edge: "east",
    range: [1, 4],
    targetMapId: "room-b",
    targetEdge: "west",
    targetRange: [2, 5],
}
```

## Visual format

```js
{
    path: ATLAS_PATHS.entities,
    source: [x, y, frameWidth, frameHeight],
    size: [drawWidth, drawHeight],
}
```

Animated:

```js
{
    defaultAnimation: "pulse",
    animations: {
        pulse: {
            fps: 6,
            frames: [[0, 0], [1, 0], [2, 0], [1, 0]],
        },
    },
}
```
