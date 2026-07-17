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
    spriteId: "blue-orb",
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

## 16. Use item, then teleport after dialogue

```js
"odd-key": {
    name: "Odd Key",
    icon: "./assets/items/odd-key.png",
    description: "It fits no visible lock.",
    usable: true,
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
