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
    spriteId: "robed-figure",
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
