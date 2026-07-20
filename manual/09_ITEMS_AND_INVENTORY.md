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
];
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
{
  hasItem: "pink-orb";
}
{
  notItem: "pink-orb";
}
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
