# Hooks, Triggers, and Interactions

A **hook** is a place where an effect sequence can begin. A **trigger** is what activates an interaction. An **interaction handler** decides whether to execute effects or perform a direct teleport.

## Effect hooks

### 1. Entity interaction

```js
interaction: {
    handler: "effects",
    triggers: ["action"],
    effects: [/* ... */],
}
```

The deterministic random owner is:

```text
map:<mapId>:entity:<entityId>
```

### 2. Tile interaction

A tile definition may contain an interaction. Every occupied footprint cell points to the same anchored tile interaction.

```js
interaction: {
    handler: "effects",
    triggers: ["action"],
    effects: [/* ... */],
}
```

Tile interactions in one map share the owner namespace:

```text
map:<mapId>:tile-events
```

For that reason, random effect IDs used by different interactive tile definitions in the same map must be unique.

### 3. Usable item

```js
usable: true,
effects: [/* ... */]
```

The owner is:

```text
item:<itemId>
```

Item effects have no implicit source map during startup validation. Effects that require a local map target must provide `mapId` unless the runtime context supplies one. Teleport effects always specify a map and entry.

### 4. Map entry

```js
onEnter: [/* effects */]
```

Runs after:

1. The destination room visit is established.
2. The player is placed.
3. The map's ordinary music is applied.
4. Music entry events run.

Owner:

```text
map:<mapId>:onEnter
```

### 5. Map exit

```js
onExit: [/* effects */]
```

Runs before an edge exit or teleport transition. If it opens dialogue, changes maps, or leaves world mode, the original transition does not continue automatically. Use this intentionally; for an exit conversation followed by travel, put the teleport in `showText.afterClose`.

Owner:

```text
map:<mapId>:onExit
```

### 6. Music entry event

```js
musicEvents: [
    {
        id: "first-cue",
        frequency: "once-per-save",
        effects: [/* ... */],
    },
]
```

Runs on room entry after the map music is applied and before `onEnter`.

Owner:

```text
map:<mapId>:music-event:<eventId>
```

### 7. Dialogue close

```js
{
    type: "showText",
    pages: ["..."],
    afterClose: [/* effects */],
}
```

Use this for every operation that must happen after dialogue. `showText` must be the final reachable effect in its current array.

### 8. Random choice branch

```js
{
    type: "random",
    id: "response",
    scope: "interaction",
    choices: [
        { weight: 1, effects: [/* ... */] },
        { weight: 4, effects: [] },
    ],
}
```

The selected branch becomes another effect sequence.

## Interaction triggers

### `action`

Activated by the interaction control while the player faces an interaction cell. Appropriate for doors, dialogue, pickups that require confirmation, switches, save points, and inspectable scenery.

### `touch`

Activated only when the player's footbox newly enters the interaction target. Remaining on the cell does not repeatedly fire it; leaving and re-entering can fire it again.

Appropriate for pickups, floor triggers, and automatic transitions.

Restrictions:

- A colliding entity cannot have a `touch` trigger.
- A tile on a colliding placement cannot have a `touch` trigger.
- Use non-colliding entities or tiles for touch behavior.

## Handler: `effects`

Allowed structure:

```js
{
    handler: "effects",
    triggers: ["action"],
    condition: { flag: "machine.enabled" }, // optional
    effects: [/* non-empty effect array */],
    message: "Status text.",                 // optional
}
```

`message` writes to the game's event/status log. It does not open dialogue.

## Handler: `teleport`

```js
{
    handler: "teleport",
    triggers: ["action"],
    condition: { hasItem: "key" }, // optional
    params: {
        mapId: "room-destination",
        entryId: "fromDoor",
        musicTransition: "crossfade", // optional
        musicTransitionMs: 700,        // optional
    },
    message: "The door opens.",
}
```

Use direct `teleport` for a simple fixed destination. Use `handler: "effects"` with a `random` effect and nested `teleport` effects for random or conditional destinations.

## Presence condition versus interaction condition

Entity or tile condition:

```js
condition: { notFlag: "object.removed" }
```

Controls whether the object exists in rendering, collision, and interactions.

Interaction condition:

```js
interaction: {
    condition: { hasItem: "key" },
    // ...
}
```

The object remains visible/colliding, but its interaction is inactive while false.

Effect condition:

```js
{
    type: "playSound",
    soundId: "receiver-chime",
    condition: { flag: "receiver.powered" },
}
```

Only that operation is skipped.

## Target priority gotcha

Spatial interactions are stored per cell. Entities are added after tiles, so an active entity interaction on a cell replaces a tile interaction on the same cell. Avoid stacking two intended interaction targets on one coordinate.
