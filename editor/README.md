# Yume Map Editor

Serve the project through a local web server and open `editor/editor.html`.

The editor works on a `structuredClone()` of `MAPS`. It never edits `Game.maps` or runtime save state. The authoritative project map file is `maps.generated.js`; `maps.js` only re-exports it.

Maps may define an optional `editorGroup` string. The editor uses it to organize the current-map selector; the game ignores it as editor-only authored metadata. Maps without the field appear under **Ungrouped**.

## Implemented

- Map creation, duplication, selected-map clipboard copying, renaming, visual grouping, top-left resize, deletion, and initial-entry selection.
- Base and obstacle layer editing.
- Existing foreground layers are preserved and previewed, but are not currently editable.
- Pencil, eraser, rectangle, flood-fill, eyedropper, Empty palette selection, and active-layer clearing tools.
- Atlas-aware static and animated previews.
- Grid, layer visibility, collision, footprint, entry, exit, and rectangular-trigger overlays.
- CSS-only canvas zoom from 50% to 400%, with buttons and Ctrl/Cmd-wheel cursor anchoring.
- Graphical animated entity preset palette, placement, dragging, deletion, and basic property editing.
- Entry placement, facing, renaming, reference display, and deletion.
- Rectangular trigger creation, dragging, handle resizing, ordering, event/frequency controls, and condition/effect JSON editing.
- Exit range display, entry-target and edge-target form editing, reciprocal equal-length doorway connections, and raw JSON editing for advanced forms.
- Full-document undo/redo snapshots grouped by completed action.
- Generated JavaScript and JSON export, import, local recovery, and pre-import backup.
- Real-game playtesting with the editor document and validation result reporting.

editor does not create tile or sprite assets, edit atlas coordinates, edit animation clips, visually construct conditions/effect sequences, simulate runtime mutations, or modify live save data.

## TODO

- connected to TODO in sprite/tile.js - button to set whether current tile/entity should be mirrored

## Read-only map graph

Use **Map graph** in the top toolbar to open a derived project overview. The graph contains one node per map, compound regions for `editorGroup` values, solid arrows for edge exits, and dashed arrows for entity, tile, or trigger teleports. Edge links display their source and target doorway ranges; repeated non-exit links of the same type are aggregated and labelled with a count. Broken map references appear as explicit missing-destination nodes.

The graph is read-only. Drag the background to pan, use the mouse wheel to zoom, use **Fit** to recenter all nodes, and use **Relayout** to generate a new force-directed arrangement. Clicking a map node closes the graph and selects that map in the normal editor. Graph positions exist only for the current editor session and are never exported with map data.

## Map ID refactors

Changing a map ID is an atomic reference refactor, not an ordinary label edit. The editor rewrites map-owned exits, teleport interactions, trigger effects, nested effects, cross-map entity effects, and map-specific tile interactions on a cloned document, validates the candidate, and commits only when the result is valid. References found in read-only source registries such as `ITEMS`, global `TILES`, `SPRITES`, or entity presets block the operation and report their source paths; update those source definitions before retrying.

Development saves are not migrated when a map ID changes. Clear old development save slots after a successful ID refactor. Prefer keeping technical map IDs stable and use `editorGroup` or authored dialogue for human-readable organization.

## Deterministic random branches

Random effects, map `onEnter`/`onExit` sequences, and random edge destinations can be authored through the relevant JSON inspectors/imported map data. Random edge exits keep their edge/range controls in the inspector while their full `destination` definition remains in the JSON field. The graph displays probabilistic exits and teleports as dotted links. Rename refactors recurse through every random choice branch.

## Reciprocal doorway connections

The connection form authors separate source and target ranges. After choosing the source range, enter the target start; the editor derives the target end so both openings always have equal length. The generated reciprocal exits swap the two ranges. Editing either linked exit in the inspector updates the reciprocal exit in the same undoable mutation: its source range mirrors the edited target range, and its target range mirrors the edited source range. Resizing a room does not silently clamp exit ranges; structural validation reports any opening that no longer fits.


## Entity placement palette

Entity placement uses one animated thumbnail card per `ENTITY_PRESETS` entry. Presets may reference either a sprite or a tile visual. Click a card to choose it, or use the arrow keys, Home, and End while the palette has focus. Missing visual definitions appear as disabled placeholder cards; the entity inspector visual controls remain available for changing already-placed entities.
