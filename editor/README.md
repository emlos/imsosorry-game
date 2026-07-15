# Yume Map Editor

Serve the project through a local web server and open `editor/editor.html`.

The editor works on a `structuredClone()` of `MAPS`. It never edits `Game.maps` or runtime save state. The authoritative project map file is `maps.generated.js`; `maps.js` only re-exports it.

## Implemented

- Map creation, duplication, renaming, top-left resize, deletion, and initial-entry selection.
- Base, obstacle, and foreground layer editing.
- Pencil, eraser, rectangle, flood-fill, and eyedropper tools.
- Atlas-aware static and animated previews.
- Grid, layer visibility, collision, footprint, entry, and exit overlays.
- Entity presets, placement, dragging, deletion, and basic property editing.
- Entry placement, facing, renaming, reference display, and deletion.
- Exit range display, entry-target form editing, and raw JSON editing for advanced forms.
- Full-document undo/redo snapshots grouped by completed action.
- Generated JavaScript and JSON export, import, local recovery, and pre-import backup.
- Real-game playtesting with the editor document and validation result reporting.

editor does not create tile or sprite assets, edit atlas coordinates, edit animation clips, visually construct conditions/effect sequences, simulate runtime mutations, or modify live save data.
