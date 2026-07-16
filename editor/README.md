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
- Grid, layer visibility, collision, footprint, entry, and exit overlays.
- CSS-only canvas zoom from 50% to 400%, with buttons and Ctrl/Cmd-wheel cursor anchoring.
- Entity presets, placement, dragging, deletion, and basic property editing.
- Entry placement, facing, renaming, reference display, and deletion.
- Exit range display, entry-target form editing, reciprocal opposite-edge room connections, and raw JSON editing for advanced forms.
- Full-document undo/redo snapshots grouped by completed action.
- Generated JavaScript and JSON export, import, local recovery, and pre-import backup.
- Real-game playtesting with the editor document and validation result reporting.

editor does not create tile or sprite assets, edit atlas coordinates, edit animation clips, visually construct conditions/effect sequences, simulate runtime mutations, or modify live save data.

## TODO
- connected to TODO in sprite/tile.js - button to set whether current tile/entity should be mirrored

## Read-only map graph

Use **Map graph** in the top toolbar to open a derived project overview. The graph contains one node per map, compound regions for `editorGroup` values, solid arrows for edge exits, and dashed arrows for entity or tile teleports. Repeated links of the same type are aggregated and labelled with a count. Broken map references appear as explicit missing-destination nodes.

The graph is read-only. Drag the background to pan, use the mouse wheel to zoom, use **Fit** to recenter all nodes, and use **Relayout** to generate a new force-directed arrangement. Clicking a map node closes the graph and selects that map in the normal editor. Graph positions exist only for the current editor session and are never exported with map data.
