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
4. For usable items, add a valid non-empty effect array.
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
