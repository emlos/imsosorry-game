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
editorGroup: "Forest";
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
