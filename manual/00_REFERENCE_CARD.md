# Reference Card

## Interaction triggers

```js
triggers: ["action"]
triggers: ["touch"]
triggers: ["action", "touch"]
```

- `action`: player uses the interaction button while facing the target.
- `touch`: fires when the player's footbox newly enters the interaction cell.
- A colliding entity or colliding tile placement cannot use `touch`.

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
setEntitySprite     setEntityCollision
setTile             teleport
saveGame            playSound
playMusic           stopMusic
pushMusic           popMusic
playMusicEffect     random
showText
```

Every effect may add:

```js
condition: { /* condition */ }
```

Important dialogue rule: `showText` must be the final reachable effect in its array. Put later operations in `afterClose`.

## Hooks that can run effects

```text
Entity interaction (`handler: "effects"`)
Tile interaction (`handler: "effects"`)
Usable item (`ITEMS[itemId].effects`)
Map `onEnter`
Map `onExit`
Map `musicEvents[].effects`
`showText.afterClose`
`random.choices[].effects`
```

## Random scopes

| Scope | Behavior |
|---|---|
| `save` | One choice is fixed for the whole save; it executes every time invoked. |
| `once` | Chooses and executes once for the save; later calls do nothing. |
| `roomVisit` | Same choice throughout one room visit; rerolls on a later visit. |
| `interaction` | Advances its own counter on each invocation. |
| `use` | Same mechanics as interaction, but a separate counter namespace. |

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
