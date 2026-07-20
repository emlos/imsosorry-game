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
effects: [/* optional universal effects */]
```

The owner is:

```text
item:<itemId>
```

Global item effects may play sounds, change flags, heal, or perform other universally valid work. They cannot contain `teleport` or explicit `mapId` fields. Context-dependent behavior belongs in a map trigger with `events: ["itemUse"]`.

### 4. Map entry

```js
onEnter: [/* effects */];
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
onExit: [/* effects */];
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
];
```

Runs on room entry after the map music is applied and before `onEnter`.

Owner:

```text
map:<mapId>:music-event:<eventId>
```

### 7. Rectangular map region

```js
triggers: [
  {
    id: "hallway-distortion",
    region: {
      col: 3,
      row: 4,
      width: 5,
      height: 2,
    },
    events: ["enter"],
    // itemId: "pink-orb", // required when events includes itemUse
    frequency: "always",
    condition: { flag: "world.changed" }, // optional
    effects: [/* non-empty effect array */],
  },
];
```

Camera lifetime should use `cameraZones`, not paired camera enter/exit effects. Map triggers are invisible rectangular regions independent of tiles and entities. They are evaluated after the player completes a movement into a new tile, never once per rendered frame. The runtime tracks the trigger IDs containing the player's previous tile.

Event types:

- `enter`: the previous tile was outside and the new tile is inside.
- `exit`: the previous tile was inside and the new tile is outside.
- `step`: the completed movement ends inside. If the same trigger lists both `enter` and `step`, entering reports `enter` and executes the effects once for that movement.
- `itemUse`: the player uses `trigger.itemId` while standing inside the region. This event is dispatched from inventory use rather than movement.

Frequency values:

- `always` or omitted: every matching movement.
- `once-per-visit`: once during the current stay in that map. Leaving and entering the map starts a new visit. Saving and reloading in the same room preserves the current visit's fired state.
- `once-per-save`: once for the entire save file.

Overlapping trigger regions are allowed. Matching triggers execute in their order in the map's `triggers` array. If an earlier trigger changes maps or leaves world mode, later triggers do not continue during that movement.

Owner:

```text
map:<mapId>:trigger:<triggerId>
```

Trigger IDs must be unique within a map and should remain stable after saves exist. Conditions are checked when the movement event occurs. A false condition does not consume a one-time trigger.

### 8. Dialogue close

```js
{
    type: "showText",
    pages: ["..."],
    afterClose: [/* effects */],
}
```

Use this for every operation that must happen after dialogue. `showText` must be the final reachable effect in its current array.

### 9. Random choice branch

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

## Structured effect context and self-targeting

Effects execute with a structured context containing the current map, stable owner ID, and source subject. Entity interactions provide:

```js
{
    mapId,
    ownerId,
    subject: {
        type: "entity",
        mapId,
        entityId,
    },
}
```

This subject is preserved through `random` choices and `showText.afterClose`. The four entity mutation effects may use `target: "self"`; validation rejects that syntax from tile interactions, triggers, items, map hooks, and music events. Explicit `entityId` targeting remains available for cross-entity and cross-map mutations.

## Handler defaults and editor templates

Interaction defaults are authoring factories, not runtime fallback behavior. Every saved interaction is still validated exactly as written. Missing keys, empty effect arrays, bad item IDs, and broken map references remain errors.

Each entry in `INTERACTION_HANDLERS` exposes `createDefault(options)`. Use the public factory when code needs a fresh baseline definition:

```js
import { createDefaultInteraction } from "./interactions.js";

const interaction = createDefaultInteraction("effects");
const door = createDefaultInteraction("teleport", {
  mapId: "room-target",
  entryId: "fromSource",
});
```

The map editor exposes semantic templates from `editor/editor-catalog.js`:

- **Dialogue / description:** one `showText` effect.
- **Teleport:** a direct teleport aimed at the first available entry, preferring another map.
- **Save point:** save-point dialogue with `saveGame` in `afterClose`.
- **Item pickup:** `addItem`, pickup text, then deactivation of the selected entity.
- **Switch / flag change:** toggles an entity-specific flag.
- **Inspect once:** requires an unset flag, shows text, then sets the flag.
- **Conditional dialogue:** mutually exclusive text effects for false/true flag states.

Choosing a template replaces the interaction JSON draft in the inspector. It does not modify the entity until **Apply** is pressed. Templates may deliberately contain visible placeholders when the project has no suitable item or entry; Playtest and runtime validation do not waive those reference errors.

## Presence condition versus interaction condition

Entity or tile condition:

```js
condition: {
  notFlag: "object.removed";
}
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
