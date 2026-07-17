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
