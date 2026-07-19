# Yume Prototype v0.9.2
Generated from the project source on 2026-07-19.

---

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
]
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
]
```

Zones are reconstructed from current position and conditions, combine by priority and array order, and remove only their own partial camera patch. Shake intensity is measured in screen pixels. World rendering rounds shared rectangle edges after applying zoom; UI remains outside the canvas world.

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
condition: { /* condition */ }
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

---

# Editor Manual

## Starting the editor

Serve the project through a local web server and open:

```text
editor/editor.html
```

Do not open it directly with a `file://` URL. The project uses ES modules and asset fetching.

The editor works on a cloned map document. It does not modify live game state or save data. Its authoritative map output is `maps.generated.js`; `maps.js` only re-exports it.

## What the editor currently supports

- Create, duplicate, copy, rename, group, resize, and delete maps.
- Choose the initial entry and map camera zoom default.
- Edit base and obstacle layers.
- Preserve and preview existing foreground layers without editing them.
- Pencil, eraser, rectangle, fill, eyedropper, Empty tile, and clear-layer tools.
- Atlas-aware static and animated previews.
- Grid, layer, collision, footprint, entry, exit, and rectangular-trigger overlays.
- Canvas zoom from 50% to 400%, including Ctrl/Cmd-wheel zoom.
- Place entities from presets, drag them, delete them, choose either a sprite visual or a reusable tile visual, and flip them horizontally or vertically.
- Start entity interactions from semantic templates, edit the resulting JSON, and edit the primary dialogue fields for compatible interactions.
- Place and edit entries, facing directions, and entry IDs.
- Create rectangular triggers by dragging, then move, resize, reorder, and edit their event/frequency/condition/effect definitions.
- Create and edit ordinary exits, reciprocal edge connections, and advanced exit JSON.
- Undo and redo completed editor actions.
- Import and export generated JavaScript or JSON.
- Local recovery and pre-import backup.
- Playtest the current editor document through the actual game validator/runtime.
- Display a read-only force-directed map graph.

## What the editor does not build

The editor does not currently:

- Create image files or atlas layouts.
- Edit atlas source rectangles.
- Edit animation clips visually.
- Visually construct arbitrary conditions or effect sequences beyond the supplied interaction templates.
- Simulate all runtime flags, random choices, and mutations.
- Edit live save data.
- Edit existing foreground layers.
- Mirror ordinary tile-layer placements.

Advanced behavior is still authored by editing JSON fields or code definitions.

## Recommended authoring division

Use the editor for:

- Room geometry.
- Tile placement.
- Entity placement.
- Entries, exits, and rectangular trigger regions.
- Basic entity identity, collision, visual selection, and standard interaction templates.
- Map organization and connection inspection.

Use code or raw JSON for:

- Complex condition construction beyond the trigger/entity JSON inspectors.
- Complex effect sequence construction beyond the trigger/entity JSON inspectors.
- Random branches.
- Map `onEnter` and `onExit` hooks.
- Conditional music and music events.
- Map-specific tile overrides.
- New items, tile definitions, sprite definitions, sounds, and music.

## Map graph

The map graph is derived from maps and is never exported.

It shows:

- One node per map.
- Compound regions for `editorGroup`.
- Solid arrows for edge exits.
- Dashed arrows for direct teleports.
- Dotted/probabilistic links for random branches.
- Missing target nodes for broken references.

Controls:

- Drag the background to pan.
- Use the wheel to zoom.
- Use **Fit** to show all nodes.
- Use **Relayout** to generate another force-directed arrangement.
- Click a map node to close the graph and select that map.

## Technical IDs versus labels

Map IDs and entity IDs are technical references. Keep them stable once content begins depending on them.

`editorGroup` is editor-only organization and can be changed freely:

```js
editorGroup: "Forest"
```

Changing a map ID is a reference refactor. The editor updates map-owned references on a clone and commits only if valid. References in external registries such as global `TILES`, `SPRITES`, or presets block the rename and must be changed in source code first. Global item definitions are not allowed to contain map destinations.

Old development saves are not migrated when map IDs change.

## Import/export format

The editor accepts JSON-compatible map data and generated JavaScript produced by the editor. It is not a general JavaScript parser. Handwritten source using imports, spreads, comments, or computed constants cannot be faithfully reconstructed after evaluation.

Treat the editor export as a generated replacement file.

## Playtest workflow

1. Make one coherent editor action.
2. Check the editor validation panel.
3. Export or leave recovery enabled.
4. Use Playtest.
5. Fix full-game validation errors at their source.
6. Re-run after changing references, random IDs, exits, or conditions.

The full game validator is authoritative; the editor performs a lighter structural pass for responsiveness.

## Camera Zones mode

Camera Zones mode uses the same rectangular authoring workflow as trigger regions: drag empty space to create, drag a zone to move it, and drag eight selection handles to resize it. The list controls array order; the inspector edits priority, transition-in/out durations, an optional condition, and a partial camera patch as JSON. Overlays label each zone with its order, ID, and priority. Playtest validation checks bounds, duplicate IDs, camera patch properties, timing values, and entity follow references.

---

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
]
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

---

# Conditions

Conditions are plain objects with exactly one operator. They can control:

- Tile presence.
- Entity presence.
- Interaction availability.
- Individual effects.
- Conditional map music entries.
- Music entry events.

## Flag conditions

### Flag is true

```js
{ flag: "bridge.lowered" }
```

Equivalent to:

```js
{ flag: "bridge.lowered", equals: true }
```

### Flag is exactly false

```js
{ flag: "bridge.lowered", equals: false }
```

This is true only when the stored value is explicitly `false`. A missing flag is `undefined`, not false.

### Flag is not true

```js
{ notFlag: "bridge.lowered" }
```

This is true when the flag is false or missing. This is usually the correct condition for content visible before an event has occurred.

## Item conditions

```js
{ hasItem: "pink-orb" }
```

True when the inventory quantity is greater than zero.

```js
{ notItem: "pink-orb" }
```

True when the item is absent or has no positive quantity.

Item IDs are reference-validated.

## Boolean composition

### All children must be true

```js
{
    all: [
        { flag: "generator.on" },
        { hasItem: "access-card" },
        { notFlag: "door.broken" },
    ],
}
```

### At least one child must be true

```js
{
    any: [
        { hasItem: "silver-key" },
        { flag: "door.unlocked" },
    ],
}
```

`all` and `any` must contain at least one child. Conditions can be nested to any practical depth.

## Common patterns

### One-time entity disappears after pickup

```js
condition: { notItem: "blue-orb" }
```

### Alternate object after a flag

Original:

```js
condition: { notFlag: "statue.changed" }
```

Replacement:

```js
condition: { flag: "statue.changed" }
```

### Exact false versus unset

Use this only when the difference matters:

```js
condition: { flag: "choice.accepted", equals: false }
```

For normal “not yet done” content, use:

```js
condition: { notFlag: "choice.accepted" }
```

## Mutually exclusive effect branches

Effects may each have conditions:

```js
[
    {
        type: "showText",
        condition: { flag: "machine.on" },
        pages: ["It is running."],
    },
    {
        type: "showText",
        condition: { notFlag: "machine.on" },
        pages: ["It is silent."],
    },
]
```

The validator understands basic overlap between flag/item/all/any conditions. Mutually exclusive dialogue branches may coexist in one effect array. If two reachable branches can both open dialogue, validation fails.

---

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

Camera effects modify the persistent base camera state. Active `cameraZones` are resolved over that base. A nonzero `durationMs` delays later effects in the same effect array, but it does not pause player updates, clear held movement keys, or change the game mode. A newer camera target supersedes an unfinished transition from its current rendered state; the superseded effect promise resolves and its sequence continues.

Follow targets are resolved every update. Zooming or changing offsets while following the player therefore continues to track a moving player without an end-of-transition correction snap.

### `cameraPan`

Keep the base follow target and animate an offset in world pixels:

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

Zoom must be between `0.25` and `8`. Continuous transitions are supported. Fractional intermediate zoom frames use nearest-neighbor scaling and may contain uneven source-pixel widths; integer endpoints are crisp.

### `cameraFollow`

```js
{ type: "cameraFollow", target: "player", offsetX: 0, offsetY: 0, durationMs: 400 }
{ type: "cameraFollow", target: "entity", entityId: "statue", durationMs: 400 }
{ type: "cameraFollow", target: "none", durationMs: 0 }
```

Entity targets are resolved in the effect-context map. Switching follow modes begins from the current rendered position.

### `cameraShake`

```js
{ type: "cameraShake", intensity: 6, durationMs: 350 }
```

`intensity` is measured in screen pixels. Shake is additive after the stable camera transform and can run at the same time as a pan or zoom. A newer shake supersedes the previous shake.

### `cameraReset`

```js
{ type: "cameraReset", durationMs: 500 }
```

Restores the base camera to the active map defaults. It does not erase active camera-zone overrides; those remain authoritative until their region or condition becomes inactive.

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

---

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

---

# Deterministic Save-Seeded Randomness

Each new save creates a hexadecimal seed using `crypto.getRandomValues`. Random choices are derived from:

```text
save seed + stable owner/event key + scope occurrence token
```

They do not consume one global PRNG stream. Adding an unrelated random event elsewhere will not reorder every later result.

The save stores:

```js
random: {
    version: 1,
    seed: "a1b2c3d4",
    counters: {},
    resolved: {},
    roomVisits: {},
    currentRoomRuntime: null,
}
```

## Generic random effect

```js
{
    type: "random",
    id: "visitor",
    scope: "roomVisit",
    choices: [
        {
            weight: 15,
            effects: [
                {
                    type: "setEntityActive",
                    entityId: "stranger",
                    active: true,
                    persistence: "roomVisit",
                },
            ],
        },
        {
            weight: 85,
            effects: [],
        },
    ],
}
```

Weights are relative and do not need to total 100.

## Scope behavior

### `save`

```js
scope: "save"
```

- The first invocation selects and stores a choice index.
- Every later invocation in that save uses the same choice.
- The chosen effects execute each time the event is invoked.
- Good for hidden save-specific world traits and consistent variants.

### `once`

```js
scope: "once"
```

- Selects one choice the first time.
- Marks the event consumed.
- Later invocations do nothing, including when the selected branch had no effects.
- Good for a one-time chance or one-time rare event.

### `roomVisit`

```js
scope: "roomVisit"
```

- Uses the active map's visit serial.
- Repeated invocations of the same event during one visit select the same choice.
- A later visit can select another choice.
- Saving and reloading inside the room preserves the current visit serial and temporary entity overrides.
- Requires the event context map to be the active room visit.

### `interaction`

```js
scope: "interaction"
```

- Uses a per-event counter starting at zero.
- Counter increments every invocation.
- Reloading a save made before the interaction reproduces the same next result.
- Good for repeatedly inspecting an object.

### `use`

```js
scope: "use"
```

Mechanically identical to `interaction`, but stored in a separate counter namespace. Use it for exits, items, doors, or other explicit uses when that wording better describes the event.

## Stable IDs and owners

A random effect's full key is:

```text
<ownerId>:<randomId>
```

Examples:

```text
map:room-a:entity:mirror:response
map:room-a:onEnter:visitor
map:room-a:onExit:sound
map:room-a:music-event:first-cue:variant
item:pink-orb:destination
map:room-a:exit:north-exit:destination
```

Do not rename random IDs after saves exist unless changing their outcomes is intentional.

IDs are checked for duplication within one effect owner. Tile interactions share one map-wide tile-event owner, so their random IDs must not collide with each other.

## Reload behavior

Suppose the next interaction occurrence is number 3:

1. Save before interacting.
2. Interact; occurrence 3 produces branch B, then counter becomes 4.
3. Reload the earlier save; counter is 3 again.
4. Interact; branch B is reproduced.

This is the intended behavior.

## Temporary room-visit entity spawn

Author the entity inactive:

```js
{
    id: "shadow",
    active: false,
    col: 5,
    row: 3,
    visual: { type: "sprite", id: "robed-figure" },
    transform: { flipX: false, flipY: false },
    collision: false,
    interaction: null,
}
```

Then in `onEnter`:

```js
onEnter: [
    {
        type: "random",
        id: "shadow-spawn",
        scope: "roomVisit",
        choices: [
            {
                weight: 10,
                effects: [
                    {
                        type: "setEntityActive",
                        entityId: "shadow",
                        active: true,
                        persistence: "roomVisit",
                    },
                ],
            },
            { weight: 90, effects: [] },
        ],
    },
]
```

The override belongs only to that room visit.

## Persistent remote spawn

```js
{
    type: "setEntityActive",
    mapId: "room-attic",
    entityId: "stranger",
    active: true,
}
```

This modifies saved persistent entity state in another map.

## Random interaction response

```js
{
    handler: "effects",
    triggers: ["action"],
    effects: [
        {
            type: "random",
            id: "reply",
            scope: "interaction",
            choices: [
                {
                    weight: 3,
                    effects: [{ type: "showText", pages: ["It is quiet."] }],
                },
                {
                    weight: 1,
                    effects: [{ type: "showText", pages: ["It says your name."] }],
                },
            ],
        },
    ],
}
```

## Random map exit

See `05_MAPS_ENTITIES_EXITS.md`. Random exit choices are destination objects, not effect arrays.

## Random music/sound

Use a random effect inside `onEnter`, `onExit`, an interaction, or a music event:

```js
{
    type: "random",
    id: "entry-sound",
    scope: "roomVisit",
    choices: [
        { weight: 8, effects: [] },
        {
            weight: 2,
            effects: [{ type: "playSound", soundId: "receiver-chime" }],
        },
    ],
}
```

Keep randomness above `AudioSystem`; audio receives already-resolved commands.

## Editing/rebalancing warning

`save` and `once` decisions store a choice index. Reordering, deleting, or inserting choices can change the meaning of existing saved indices or make them invalid. Append choices cautiously or clear development saves after structural random-table edits.

---

# Music and Audio

The project has three registries in `sounds.js`:

- `SOUNDS`: short decoded sound effects.
- `MUSIC`: looping/background tracks.
- `MUSIC_EFFECTS`: non-looping musical stingers.

## Sound registry

```js
export const SOUNDS = {
    "receiver-chime": "./assets/sounds/receiver-chime.wav",
};
```

Play with:

```js
{ type: "playSound", soundId: "receiver-chime" }
```

## Music registry

```js
export const MUSIC = {
    forest: {
        path: "./assets/music/forest.mp3",
        title: "Glasswood",      // optional metadata
        volume: 0.68,            // optional, 0..1
        loop: true,              // optional
        loopStart: 2.5,          // optional seconds
        loopEnd: 45.0,           // optional seconds
        tags: ["forest"],        // optional metadata
        license: "...",         // optional metadata
        source: "...",          // optional metadata
    },
};
```

Rules:

- Loop points require `loop: true`.
- `loopEnd` must be greater than `loopStart` and not exceed file duration.
- Without custom `loopEnd`, looping uses the media element's normal loop behavior.

## Music-effect registry

```js
export const MUSIC_EFFECTS = {
    discovery: {
        path: "./assets/music/discovery.mp3",
        title: "Discovery",
        volume: 0.85,
        tags: ["stinger"],
    },
};
```

Music effects may use metadata fields but cannot define loop properties.

## Map music: inherit, silence, or play

### Inherit current music

Omit `music`:

```js
// no music field
```

or explicitly use a transition policy of `inherit` when transitioning.

### Explicit silence

```js
music: null
```

### Play a track

```js
music: {
    trackId: "forest",
    continuityId: "forest-region",
    fadeInMs: 650,
    restart: "if-different",
    volume: 1,
    playbackRate: 1,
}
```

Map music configuration supports:

```text
trackId
continuityId
fadeInMs
fadeOutMs
crossfadeMs
restart
resume
volume
playbackRate
```

## Conditional map music

A conditional music array must end with exactly one unconditional fallback:

```js
music: [
    {
        condition: { flag: "forest.changed" },
        trackId: "strange-room",
        playbackRate: 0.8,
    },
    {
        trackId: "forest",
        continuityId: "forest-region",
        restart: "if-different",
    },
]
```

Conditional entries before the fallback may omit `trackId` and override only playback options; they inherit the fallback track ID during reference validation/resolution.

Changing flags or inventory refreshes active map music.

## Transition policy

A map may define defaults:

```js
musicTransition: "crossfade",
musicTransitionMs: 900,
```

A teleport or exit destination can override them.

Policies:

- `inherit`: leave current music untouched.
- `replace`: apply the destination map's music without forcing a crossfade.
- `crossfade`: apply destination music and use `musicTransitionMs` as default crossfade duration.
- `silence`: fade out to silence.

Default transition duration is 700 ms when a policy needs one and no override exists.

## Restart policy

- `always`: start the requested track anew unless `resume` or an explicit stored position is used.
- `if-different`: preserve when the current track ID is the same; otherwise replace.
- `never`: preserve current music even when a different track is requested; current track parameters are not replaced with a different track.

A matching non-null `continuityId` preserves the same current track across maps. Continuity applies only when the track IDs also match.

## Resume behavior

When a track is replaced or stopped, its position may be remembered. Request:

```js
{
    type: "playMusic",
    trackId: "shrine",
    resume: true,
}
```

to begin at the remembered position instead of zero.

## Music stack

Temporary override:

```js
{
    type: "pushMusic",
    trackId: "strange-room",
    crossfadeMs: 700,
}
```

Restore prior state:

```js
{
    type: "popMusic",
    crossfadeMs: 700,
}
```

The saved snapshot includes track, position, volume, playback rate, and continuity ID.

## Music effects/stingers

```js
{
    type: "playMusicEffect",
    musicEffectId: "discovery",
    duckMusicTo: 0.2,
    volume: 1,
    playbackRate: 1,
}
```

The background music ducks, the stinger plays, and the background gain restores after completion.

## Map music entry events

```js
musicEvents: [
    {
        id: "first-discovery-cue",
        frequency: "once-per-save",
        entryId: "fromGrove",
        probability: 0.25,
        condition: { notFlag: "cue.disabled" },
        effects: [
            {
                type: "playMusicEffect",
                musicEffectId: "discovery",
                duckMusicTo: 0.18,
            },
        ],
    },
]
```

Fields:

- `id`: unique within the map.
- `frequency`: optional; default `once-per-visit`.
- `entryId`: optional filter.
- `probability`: optional deterministic 0..1 chance.
- `condition`: optional.
- `effects`: non-empty effect sequence.

Frequencies:

- `once-per-visit`: on every qualifying room visit.
- `first-entry`: once in the current browser/game session; not saved.
- `once-per-save`: once in persistent save state.

The probability roll uses the save seed. For `once-per-visit`, the room visit serial is included.

## Playback-rate behavior

`playbackRate` changes both speed and pitch in ordinary browser playback. Independent pitch shifting is not implemented.

## Audio unlock

Browsers require a user gesture before audio starts. The game listens for keydown and pointerdown to resume and unlock the Web Audio context. Sounds requested before unlock are queued.

---

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

Each entry appears automatically in the editor's graphical entity placement palette. Its `entity.visual` may reference either a sprite or a tile; the palette uses the referenced definition's atlas, animation, and size metadata for its thumbnail.

Add an entity preset only when a commonly placed sprite should carry default collision/interaction behavior:

```js
newPreset: {
    label: "New object",
    entity: {
        active: true,
        visual: { type: "sprite", id: "new-sprite" },
        transform: { flipX: false, flipY: false },
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

---

# Items and Inventory

Items are defined globally in `items.js`. Their definitions contain only universal information: display text, an inventory visual, whether the item can be used, and optional effects that make sense in every map.

## Passive item

```js
"test-token": {
    name: "Test Token",
    visual: { type: "sprite", id: "signal-beacon" },
    description: "A small token.",
    usable: false,
}
```

A passive item must not define `effects`.

## Usable item with contextual behavior

```js
"pink-orb": {
    name: "Pink Orb",
    visual: { type: "sprite", id: "pink-orb" },
    description: "A warm pink sphere.",
    usable: true,
}
```

The item does not name a map or entry. A map trigger defines what using it means in that location:

```js
triggers: [
    {
        id: "pink-orb-return",
        region: { col: 0, row: 0, width: 12, height: 8 },
        events: ["itemUse"],
        itemId: "pink-orb",
        frequency: "always",
        effects: [
            { type: "playSound", soundId: "item-use" },
            {
                type: "teleport",
                mapId: "folded-room",
                entryId: "from-orb",
            },
        ],
    },
]
```

`itemUse` runs only when the player uses the matching item while their current tile is inside the trigger rectangle. Overlapping matches execute in map trigger-array order. Like movement triggers, processing stops when an earlier trigger changes maps, opens dialogue, or otherwise leaves world mode.

Required item fields:

```text
name
visual
description
usable
```

`visual` currently references a global sprite:

```js
visual: { type: "sprite", id: "lantern" }
```

The inventory uses the sprite's atlas frame, default animation, and pixel-art rendering. The same sprite reference can therefore drive an animated world entity and its animated inventory icon.

## Universal item effects

A usable item may still define `effects` when they are genuinely independent of map structure:

```js
"music-box": {
    name: "Music Box",
    visual: { type: "sprite", id: "signal-beacon" },
    description: "It plays the same note everywhere.",
    usable: true,
    effects: [
        { type: "playSound", soundId: "item-use" },
        { type: "setFlag", flag: "musicBox.used", value: true },
    ],
}
```

Global item effects run first. When they finish, the game dispatches the contextual `itemUse` event if the player remains in the same map. Animated camera effects and dialogue closure are awaited, including `showText.afterClose` chains.

Global item effects may not contain `teleport` or an explicit `mapId`. Put those effects in a map `itemUse` trigger instead. Runtime validation rejects violations rather than silently rewriting them.

## Ownership

Runtime inventory state stores quantities:

```js
inventory: {
    "pink-orb": { quantity: 1 },
}
```

Use conditions:

```js
{ hasItem: "pink-orb" }
{ notItem: "pink-orb" }
```

Use effects:

```js
{ type: "addItem", itemId: "pink-orb", quantity: 1 }
{ type: "removeItem", itemId: "pink-orb", quantity: 1 }
```

Universal item effects use the deterministic random owner:

```text
item:<itemId>
```

Contextual trigger effects use:

```text
map:<mapId>:trigger:<triggerId>
```

## Collectible pattern

```js
{
    id: "lantern-fragment-pickup",
    active: true,
    col: 3,
    row: 1,
    visual: { type: "sprite", id: "lantern" },
    transform: { flipX: false, flipY: false },
    collision: false,
    interaction: {
        handler: "effects",
        triggers: ["action", "touch"],
        effects: [
            { type: "playSound", soundId: "orb-collect" },
            { type: "addItem", itemId: "lantern-fragment", quantity: 1 },
            {
                type: "setEntityActive",
                entityId: "lantern-fragment-pickup",
                active: false,
            },
        ],
        message: "Pick up the lantern fragment.",
    },
    condition: null,
}
```

The persistent entity-state change makes the pickup disappear and remain gone after saving. The item definition and entity can reference the same animated sprite.

---

# Common Recipes

## 1. Inspectable object

```js
interaction: {
    handler: "effects",
    triggers: ["action"],
    effects: [
        {
            type: "showText",
            pages: ["The glass is cold."],
        },
    ],
}
```

## 2. Save point

```js
interaction: {
    handler: "effects",
    triggers: ["action"],
    effects: [
        {
            type: "showText",
            speaker: "Save Point",
            pages: ["The shape of the dream becomes easy to remember."],
            afterClose: [
                {
                    type: "playMusicEffect",
                    musicEffectId: "save-complete",
                    duckMusicTo: 0.2,
                },
                { type: "saveGame" },
            ],
        },
    ],
}
```

## 3. One-time dialogue state

```js
interaction: {
    handler: "effects",
    triggers: ["action"],
    effects: [
        {
            type: "showText",
            condition: { notFlag: "statue.spoken" },
            pages: ["The statue opens its eyes."],
            afterClose: [
                { type: "setFlag", flag: "statue.spoken", value: true },
            ],
        },
        {
            type: "showText",
            condition: { flag: "statue.spoken" },
            pages: ["It does not move again."],
        },
    ],
}
```

The two conditions are mutually exclusive, so only one dialogue is reachable.

## 4. Locked door with alternate response

```js
interaction: {
    handler: "effects",
    triggers: ["action"],
    effects: [
        {
            type: "showText",
            condition: { notItem: "rusted-key" },
            pages: ["The door is locked."],
        },
        {
            type: "showText",
            condition: { hasItem: "rusted-key" },
            pages: ["The key turns."],
            afterClose: [
                {
                    type: "teleport",
                    mapId: "room-behind-door",
                    entryId: "fromLockedDoor",
                },
            ],
        },
    ],
}
```

## 5. Pickup that disappears permanently

```js
{
    id: "blue-orb",
    active: true,
    col: 3,
    row: 2,
    visual: { type: "sprite", id: "blue-orb" },
    transform: { flipX: false, flipY: false },
    collision: false,
    interaction: {
        handler: "effects",
        triggers: ["action", "touch"],
        effects: [
            { type: "addItem", itemId: "blue-orb", quantity: 1 },
            { type: "playSound", soundId: "orb-collect" },
        ],
    },
    condition: { notItem: "blue-orb" },
}
```

## 6. Switch removes a wall

```js
interaction: {
    handler: "effects",
    triggers: ["action"],
    effects: [
        { type: "playSound", soundId: "receiver-chime" },
        {
            type: "setTile",
            layer: "obstacles",
            col: 7,
            row: 3,
            tileId: -1,
        },
        { type: "setFlag", flag: "passage.open", value: true },
        {
            type: "showText",
            pages: ["Something retracts inside the wall."],
        },
    ],
}
```

## 7. Remote persistent entity spawn

```js
{
    type: "setEntityActive",
    mapId: "room-attic",
    entityId: "stranger",
    active: true,
}
```

## 8. Rare temporary visitor on room entry

```js
onEnter: [
    {
        type: "random",
        id: "rare-visitor",
        scope: "roomVisit",
        choices: [
            {
                weight: 5,
                effects: [
                    {
                        type: "setEntityActive",
                        entityId: "visitor",
                        active: true,
                        persistence: "roomVisit",
                    },
                ],
            },
            { weight: 95, effects: [] },
        ],
    },
]
```

## 9. Once-per-save chance

```js
onEnter: [
    {
        type: "random",
        id: "one-chance",
        scope: "once",
        choices: [
            {
                weight: 10,
                effects: [
                    { type: "setFlag", flag: "rare-event.happened", value: true },
                ],
            },
            { weight: 90, effects: [] },
        ],
    },
]
```

The chance is consumed whether it succeeds or fails.

## 10. Save-specific room identity

```js
onEnter: [
    {
        type: "random",
        id: "room-colour",
        scope: "save",
        choices: [
            {
                weight: 1,
                effects: [
                    { type: "setTile", layer: "base", col: 2, row: 2, tileId: 7 },
                ],
            },
            {
                weight: 1,
                effects: [
                    { type: "setTile", layer: "base", col: 2, row: 2, tileId: 8 },
                ],
            },
        ],
    },
]
```

The same branch is selected every visit. Because `setTile` is persistent, the first visit also writes the result into map state.

## 11. Random inspect response

```js
interaction: {
    handler: "effects",
    triggers: ["action"],
    effects: [
        {
            type: "random",
            id: "response",
            scope: "interaction",
            choices: [
                { weight: 8, effects: [{ type: "showText", pages: ["Static."] }] },
                { weight: 2, effects: [{ type: "showText", pages: ["A face appears."] }] },
            ],
        },
    ],
}
```

## 12. Temporary music room

Enter/interaction:

```js
{
    type: "pushMusic",
    trackId: "strange-room",
    crossfadeMs: 700,
}
```

Restore:

```js
{
    type: "popMusic",
    crossfadeMs: 700,
}
```

## 13. Conditional map music

```js
music: [
    {
        condition: { flag: "forest.corrupted" },
        trackId: "strange-room",
        playbackRate: 0.8,
    },
    {
        trackId: "forest",
        continuityId: "forest-region",
        restart: "if-different",
    },
]
```

## 14. One-time stinger on a specific entry

```js
musicEvents: [
    {
        id: "first-discovery",
        frequency: "once-per-save",
        entryId: "fromGrove",
        effects: [
            {
                type: "playMusicEffect",
                musicEffectId: "discovery",
                duckMusicTo: 0.18,
            },
        ],
    },
]
```

## 15. Random edge exit

```js
{
    id: "east-doorway",
    edge: "east",
    range: [2, 4],
    destination: {
        type: "random",
        id: "destination",
        scope: "use",
        choices: [
            {
                weight: 9,
                targetMapId: "room-normal",
                targetEdge: "west",
                targetRange: [6, 8],
            },
            {
                weight: 1,
                targetMapId: "room-rare",
                entryId: "start",
            },
        ],
    },
}
```

## 16. Use an item, then teleport after dialogue

Global item:

```js
"odd-key": {
    name: "Odd Key",
    visual: { type: "sprite", id: "signal-beacon" },
    description: "It fits no visible lock.",
    usable: true,
}
```

Map trigger:

```js
{
    id: "odd-key-space",
    region: { col: 0, row: 0, width: 10, height: 8 },
    events: ["itemUse"],
    itemId: "odd-key",
    frequency: "always",
    effects: [
        {
            type: "showText",
            pages: ["The key turns in empty air."],
            afterClose: [
                {
                    type: "teleport",
                    mapId: "room-key-space",
                    entryId: "start",
                },
            ],
        },
    ],
}
```

---

# Extending the Engine

This chapter is for adding capabilities beyond authored content. The project uses strict validation and several derived tools, so a new feature often needs more than one code change.

## Add a new tile

1. Add or generate atlas art.
2. Add an `ATLAS_PATHS` entry if using a new atlas.
3. Add a stable numeric `TILE_IDS` value.
4. Add the tile definition to `TILES`.
5. Add editor label/category to `TILE_EDITOR_META`.
6. Add collision, footprint, condition, or interaction manually as needed.
7. Run editor Playtest to validate source bounds and placement.

No game logic changes are required when using existing tile fields.

## Add a new entity sprite

1. Add art to an atlas.
2. Add a `SPRITES` definition.
3. Add `SPRITE_EDITOR_META`.
4. Add an `ENTITY_PRESETS` entry only if common placement defaults are useful.
5. Validate tall-sprite depth order and bottom alignment.

## Add a new player sprite

1. Add a `PLAYER_SPRITES` entry with `kind: "image"` or `kind: "shape"`.
2. Define a valid footbox.
3. For animated images, use directional idle/walk animation IDs.
4. Test that `setPlayerSprite` fits at representative positions.

## Add an item

1. Add `ITEMS[itemId]` in `items.js`.
2. Add icon art.
3. Choose passive or usable.
4. Assign `visual: { type: "sprite", id }`.
5. For universally valid behavior, optionally add a non-empty effect array.
6. For map-dependent behavior, add an `itemUse` trigger to the relevant map instead of referencing a map from `ITEMS`.
5. Search map-ID references before renaming targeted maps.

## Add a sound

1. Add a path to `SOUNDS`.
2. Use `playSound` with the new ID.
3. Confirm it decodes during startup preparation.

## Add music or a stinger

1. Add metadata in `MUSIC` or `MUSIC_EFFECTS`.
2. Confirm duration and loop points validate.
3. Reference it from map music, an effect, or a music event.
4. Test browser audio unlock and looping.

## Add a new effect type

Primary file: `effects.js`.

Checklist:

1. Add a handler entry to `EFFECT_HANDLERS`.
2. Define exact allowed keys with `effectKeys(...)`.
3. Validate primitive values.
4. Add `validateReferences` for map, entry, entity, item, sprite, tile, sound, or music IDs.
5. Add runtime execution, usually delegating to a `Game` method.
6. If it contains nested effect arrays, update:
   - `visitEffects`.
   - Dialogue reachability logic (`effectCanOpenDialogue`) if it can lead to `showText`.
   - Map-ID refactor traversal in `editor/editor-model.js`.
   - External-reference scanning as applicable.
   - Map graph teleport extraction if it can lead to another map.
7. Add editor validation support where the editor duplicates rules.
8. Add save serialization/versioning if it creates persistent state.
9. Add documentation and recipes.

## Add a new condition operator

Primary file: `conditions.js`.

Checklist:

1. Add the operator to `CONDITION_OPERATORS`.
2. Add exact-key/value validation.
3. Add reference validation if it names an item or other registry object.
4. Add runtime evaluation.
5. Update condition-overlap clause logic used by dialogue sequence validation.
6. Update editor-side structural/reference validation.
7. Update map rename/reference traversal if it carries map IDs.
8. Document missing/default-value semantics precisely.

Condition-overlap support is important: without it, the validator may reject valid mutually exclusive dialogue branches or allow invalid overlapping ones.

## Add a new interaction trigger

Primary files: `interactions.js`, `game.js`, and possibly `input.js`/`player.js`.

Checklist:

1. Add the string to `INTERACTION_TRIGGERS`.
2. Define exactly when the game detects it.
3. Ensure it fires once or repeatedly as intended.
4. Decide collision compatibility.
5. Dispatch through `triggerInteraction` so conditions, messages, custom events, and handlers remain consistent.
6. Update editor interaction UI and validation.

## Add a new interaction handler

Primary file: `interactions.js`.

A handler needs:

```js
{
    allowedKeys: new Set([...]),
    createDefault(options) { /* return a fresh authored definition */ },
    validateDefinition(...),
    validateReferences(...),
    execute(...),
}
```

`createDefault()` is an authoring convenience only. Runtime validation must not fill in omitted data or repair malformed interactions. Expose handler defaults through `createDefaultInteraction(handlerId, options)`.

Also update map graph/refactor logic if the handler contains teleports or map references.

Prefer composing existing effects rather than adding a handler when possible. `handler: "effects"` is the general extension point. Semantic combinations such as save points, pickups, and conditional dialogue belong in `editor/editor-catalog.js` and should be added to `INTERACTION_TEMPLATES`.

## Add a new random scope

Primary files: `random.js`, `effects.js`, `game.js`.

Checklist:

1. Add scope to `RANDOM_SCOPES`.
2. Define its occurrence token and persistence semantics in `resolveRandomChoice`.
3. Update save validation and migration if it stores new state.
4. Decide behavior on reload and room transitions.
5. Support random exits, which use the same scope set.
6. Document whether repeated calls inside one context repeat or advance.

## Add a new map hook

Examples might include a future region trigger or timer hook.

Checklist:

1. Define where in the lifecycle it runs.
2. Assign a stable owner ID for random events.
3. Validate its effect sequence and references.
4. Run it exactly once per intended event.
5. Decide what happens if it opens dialogue or transitions.
6. Update editor import/export/validation and raw JSON UI.
7. Update map ID refactors and graph extraction.

## Add a new map/entity field

Strict exact-key sets exist for tiles, sprites, player sprites, entities, items, effects, interactions, audio definitions, and many nested objects.

Search for `requireExactKeys` before adding a field. Update:

- Runtime definition validation.
- Editor validation.
- Editor model/preset/inspector.
- Renderer if visual.
- Save comparison/serialization if mutable.
- Map ID/entity ID refactor code if it carries references.

## Add persistent runtime state

Checklist:

1. Add initial state creation.
2. Mutate through a validated Game method.
3. Include it in save serialization.
4. Validate and prepare loaded data.
5. Apply it atomically.
6. Increment `SAVE_VERSION` or add migration.
7. Consider old map/entity IDs and removed definitions.
8. Add editor Playtest coverage.

## Add a new teleport-bearing structure

Update all of:

- Full game reference validation.
- Editor lightweight validation.
- Map ID refactor traversal.
- External reference scanner.
- Map graph extraction.
- Documentation.

Otherwise the game may run while editor renaming or graphing silently misses the new route.

## Shared edge geometry

Keep doorway geometry in `map-edges.js`. The game and editor both import `OPPOSITE_EDGE`, `getRangeLength()`, `mapAxisBetweenRanges()`, and `getEdgePosition()`. Schema validation remains local to each subsystem; do not reintroduce stored offsets or duplicate the coordinate mapping.

---

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

## Camera validation and presentation

- Every map explicitly contains `cameraZones`, even when empty.
- Zone IDs are unique within the map and regions remain inside map bounds.
- Zone priorities are finite; transition durations are non-negative.
- Camera patches are nonempty and contain only supported properties.
- Camera effects never imply a control lock. Add a future explicit cutscene/control-lock system when that behavior is required.
- Continuous fractional zoom cannot preserve uniform source-pixel widths on every intermediate frame. Integer endpoints are the pixel-crisp guarantee.
- Shake intensity is in screen pixels.
