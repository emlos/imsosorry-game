# Camera Test Maps

The first three entries in `maps.generated.js` are isolated camera regression maps grouped as `camera-tests` in the editor.

The game starts on the first map in `MAPS`. To test another map, open the editor, reorder or copy that map to the first array position in exported data, then Playtest. The maps intentionally have no exits so each test remains isolated.

## `camera-input-test`

Hold Right from the starting position and continue through the four-column trigger region without releasing it. Entry starts a 1,200 ms zoom to 6; exit starts a 1,200 ms reset. Movement must remain continuous, the exit transition must supersede an unfinished entry transition, and the final zoom must be 4 without a correction snap.

## `camera-ownership-test`

This map has two declarative zones:

- `close-up`, priority 10: zoom 6.
- `look-ahead`, priority 20: horizontal offset 96.

Walk through the overlap. The expected sequence is:

```text
outside:                 zoom 4, offsetX 0
close-up only:           zoom 6, offsetX 0
both zones:              zoom 6, offsetX 96
look-ahead only:         zoom 4, offsetX 96
outside:                 zoom 4, offsetX 0
```

Turn around during transitions and cross the boundaries repeatedly. The final state must always follow current membership.

## `camera-pixel-test`

The map uses zoom 6 and a checkerboard floor.

- Column 5 starts a 16-world-pixel horizontal pan over 4,000 ms.
- Column 10 resets the base camera immediately.
- Column 14 starts a continuous zoom from 6 to 3 over 4,000 ms.

At browser zoom 100% and the canvas's native 960×640 CSS size, the slow pan should progress in screen-pixel increments rather than six-pixel jumps. Adjacent checkerboard edges must remain joined. Fractional intermediate zoom frames may have uneven nearest-neighbor pixel widths; the zoom 3 endpoint must be crisp.
