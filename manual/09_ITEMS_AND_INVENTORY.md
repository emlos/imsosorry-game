# Items and Inventory

Items are defined in `items.js`.

## Unusable/passive item

```js
"test-token": {
    name: "Test Token",
    icon: "./assets/items/token.png",
    description: "A small token.",
    usable: false,
}
```

A passive item must not define `effects`.

## Usable item

```js
"pink-orb": {
    name: "Pink Orb",
    icon: "./assets/items/pink-orb.png",
    description: "A warm pink sphere.",
    usable: true,
    effects: [
        { type: "playSound", soundId: "item-use" },
        {
            type: "showText",
            speaker: "Pink Orb",
            pages: ["The orb grows warm."],
            afterClose: [
                {
                    type: "teleport",
                    mapId: "room-other",
                    entryId: "fromOrb",
                },
            ],
        },
    ],
}
```

Required fields:

```text
name
icon
description
usable
```

`effects` is required when `usable: true` and forbidden when `usable: false`.

## Ownership

Runtime inventory state stores quantities:

```js
inventory: {
    "pink-orb": { quantity: 1 },
}
```

Use:

```js
{ hasItem: "pink-orb" }
{ notItem: "pink-orb" }
```

for conditions.

Use effects:

```js
{ type: "addItem", itemId: "pink-orb", quantity: 1 }
{ type: "removeItem", itemId: "pink-orb", quantity: 1 }
```

## Collectible pattern

Entity:

```js
{
    id: "pink-orb",
    active: true,
    col: 4,
    row: 3,
    visual: { type: "sprite", id: "pink-orb" },
    collision: false,
    interaction: {
        handler: "effects",
        triggers: ["action", "touch"],
        effects: [
            { type: "addItem", itemId: "pink-orb", quantity: 1 },
            { type: "playSound", soundId: "orb-collect" },
        ],
        message: "You found the pink orb.",
    },
    condition: { notItem: "pink-orb" },
}
```

The presence condition makes current inventory ownership authoritative, including after reload.

## Item effect context

Usable items execute with owner:

```text
item:<itemId>
```

This gives item random effects stable save-specific streams.

Because item definitions are outside map data, map-ID refactors in the editor cannot rewrite them. The editor detects and blocks a map rename when an item still references that map.

## Current limitation

Inventory icons are static standalone image paths. Animated/atlas-backed icons are not implemented.
