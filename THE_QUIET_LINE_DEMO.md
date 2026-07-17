# The Quiet Line — engine demo

A 13-map, 10–15 minute test scenario built only from the current engine hooks.

## Route

The Quiet Platform connects to three branches in any order:

1. **Umbrella:** Rain Office → Flooded Archive → optional Copy Room. Answer the telephone, then take the waterlogged punch card.
2. **Apple:** Velvet Orchard → Glass Grove → Picnic Room. Find the save-fixed awake tree, then take the glass fruit.
3. **Eye:** Service Hall → Red Corridor → Signal Room. Cross the east edge three times; an optional deterministic detour may interrupt a loop. Remove the brass tooth.

After all three objects are owned, return to the platform and use the fourth gate.

## Systems exercised

- Conditional tiles, entities, music, and interactions.
- Cross-map persistent state.
- Save-fixed, room-visit, interaction, and use-scoped deterministic randomness.
- Temporary room-visit entity overrides.
- Random edge destinations.
- Derived doorway range mapping with different source/target coordinates.
- Inventory collectibles and conditional progression.
- Abrupt silence, crossfades, stingers, and ambient sound.
- Save/load inside random rooms.

## Useful deterministic checks

- Save before using the copier; reload and the same save-specific result is selected.
- Save before entering Glass Grove; reload and the same visit result occurs.
- Save before crossing the Red Corridor east edge; reload and the same destination occurs.
- Start a new save to change the awake tree, platform detail, copier output, and train reflection.

The bench on the platform is an in-world save point. The sidebar save controls remain available for testing arbitrary states.
