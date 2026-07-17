import { ATLAS_PATHS } from "./tiles.js";

//TODO: figure out a neat way to allow to reuse sprites with mirroring - same for tiles; transform property? but how to save it to the map?
export const SPRITES = {
"artificial-sun-changed": {
    path: ATLAS_PATHS.entities,
    source: [0, 0, 64, 64],
    size: [64, 64],
    defaultAnimation: "turn",
    animations: {
        turn: {
            fps: 6,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
            ],
        },
    },
},

"artificial-sun": {
    path: ATLAS_PATHS.entities,
    source: [256, 0, 64, 64],
    size: [64, 64],
    defaultAnimation: "turn",
    animations: {
        turn: {
            fps: 4,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
            ],
        },
    },
},

"attendant-0": {
    path: ATLAS_PATHS.entities,
    source: [0, 64, 32, 64],
    size: [32, 64],
},

"attendant-1": {
    path: ATLAS_PATHS.entities,
    source: [32, 64, 32, 64],
    size: [32, 64],
},

"attendant-2": {
    path: ATLAS_PATHS.entities,
    source: [64, 64, 32, 64],
    size: [32, 64],
},

"attendant-3": {
    path: ATLAS_PATHS.entities,
    source: [96, 64, 32, 64],
    size: [32, 64],
},

"bench": {
    path: ATLAS_PATHS.entities,
    source: [128, 64, 64, 32],
    size: [64, 32],
},

"brass-tooth": {
    path: ATLAS_PATHS.entities,
    source: [192, 64, 32, 32],
    size: [32, 32],
},

"cabinet-closed": {
    path: ATLAS_PATHS.entities,
    source: [224, 64, 32, 64],
    size: [32, 64],
},

"cabinet-floating": {
    path: ATLAS_PATHS.entities,
    source: [256, 64, 32, 64],
    size: [32, 64],
},

"camera-figure": {
    path: ATLAS_PATHS.entities,
    source: [288, 64, 32, 64],
    size: [32, 64],
},

"camera-number": {
    path: ATLAS_PATHS.entities,
    source: [320, 64, 32, 32],
    size: [32, 32],
},

"camera-platform": {
    path: ATLAS_PATHS.entities,
    source: [352, 64, 64, 32],
    size: [64, 32],
},

"chair-facing": {
    path: ATLAS_PATHS.entities,
    source: [416, 64, 32, 32],
    size: [32, 32],
},

"chair-out": {
    path: ATLAS_PATHS.entities,
    source: [448, 64, 32, 32],
    size: [32, 32],
},

"clock-down": {
    path: ATLAS_PATHS.entities,
    source: [480, 64, 32, 32],
    size: [32, 32],
},

"clock-empty": {
    path: ATLAS_PATHS.entities,
    source: [0, 128, 32, 32],
    size: [32, 32],
},

"clock-one": {
    path: ATLAS_PATHS.entities,
    source: [32, 128, 32, 32],
    size: [32, 32],
},

"copier-duplicate": {
    path: ATLAS_PATHS.entities,
    source: [64, 128, 32, 32],
    size: [32, 32],
},

"copier": {
    path: ATLAS_PATHS.entities,
    source: [96, 128, 32, 32],
    size: [32, 32],
    defaultAnimation: "copy",
    animations: {
        copy: {
            fps: 6,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [2, 0],
                [1, 0],
            ],
        },
    },
},

"desk": {
    path: ATLAS_PATHS.entities,
    source: [224, 128, 64, 32],
    size: [64, 32],
},

"dry-chair": {
    path: ATLAS_PATHS.entities,
    source: [288, 128, 32, 32],
    size: [32, 32],
},

"duplicate-player": {
    path: ATLAS_PATHS.entities,
    source: [320, 128, 32, 64],
    size: [32, 64],
},

"empty-seat": {
    path: ATLAS_PATHS.entities,
    source: [352, 128, 32, 64],
    size: [32, 64],
},

"final-timetable": {
    path: ATLAS_PATHS.entities,
    source: [384, 128, 32, 64],
    size: [32, 64],
},

"gate-apple": {
    path: ATLAS_PATHS.entities,
    source: [416, 128, 32, 64],
    size: [32, 64],
},

"gate-blank": {
    path: ATLAS_PATHS.entities,
    source: [448, 128, 32, 64],
    size: [32, 64],
},

"gate-eye": {
    path: ATLAS_PATHS.entities,
    source: [480, 128, 32, 64],
    size: [32, 64],
},

"gate-umbrella": {
    path: ATLAS_PATHS.entities,
    source: [0, 192, 32, 64],
    size: [32, 64],
},

"gate-zero": {
    path: ATLAS_PATHS.entities,
    source: [32, 192, 32, 64],
    size: [32, 64],
},

"glass-figure": {
    path: ATLAS_PATHS.entities,
    source: [64, 192, 32, 64],
    size: [32, 64],
},

"glass-fruit": {
    path: ATLAS_PATHS.entities,
    source: [96, 192, 32, 32],
    size: [32, 32],
    defaultAnimation: "pulse",
    animations: {
        pulse: {
            fps: 7,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [2, 0],
                [1, 0],
            ],
        },
    },
},

"keyboard-moss": {
    path: ATLAS_PATHS.entities,
    source: [224, 192, 32, 32],
    size: [32, 32],
},

"monitor-off": {
    path: ATLAS_PATHS.entities,
    source: [256, 192, 32, 32],
    size: [32, 32],
},

"monitor-on": {
    path: ATLAS_PATHS.entities,
    source: [288, 192, 32, 32],
    size: [32, 32],
},

"passenger-chair": {
    path: ATLAS_PATHS.entities,
    source: [320, 192, 32, 64],
    size: [32, 64],
},

"passenger-signal": {
    path: ATLAS_PATHS.entities,
    source: [352, 192, 32, 32],
    size: [32, 32],
},

"passenger-tree": {
    path: ATLAS_PATHS.entities,
    source: [384, 192, 32, 64],
    size: [32, 64],
},

"picnic-blanket": {
    path: ATLAS_PATHS.entities,
    source: [416, 192, 64, 64],
    size: [64, 64],
},

"platform-variation-a": {
    path: ATLAS_PATHS.entities,
    source: [480, 192, 32, 32],
    size: [32, 32],
},

"platform-variation-b": {
    path: ATLAS_PATHS.entities,
    source: [0, 256, 32, 32],
    size: [32, 32],
},

"punch-card": {
    path: ATLAS_PATHS.entities,
    source: [32, 256, 32, 32],
    size: [32, 32],
},

"reflection-attendant": {
    path: ATLAS_PATHS.entities,
    source: [64, 256, 32, 64],
    size: [32, 64],
},

"reflection-backward": {
    path: ATLAS_PATHS.entities,
    source: [96, 256, 32, 64],
    size: [32, 64],
},

"reflection-missing": {
    path: ATLAS_PATHS.entities,
    source: [128, 256, 32, 64],
    size: [32, 64],
},

"reflection-normal": {
    path: ATLAS_PATHS.entities,
    source: [160, 256, 32, 64],
    size: [32, 64],
},

"ringing-phone": {
    path: ATLAS_PATHS.entities,
    source: [192, 256, 32, 32],
    size: [32, 32],
    defaultAnimation: "ring",
    animations: {
        ring: {
            fps: 10,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
            ],
        },
    },
},

"shelves": {
    path: ATLAS_PATHS.entities,
    source: [320, 256, 64, 64],
    size: [64, 64],
},

"sign-cleaning": {
    path: ATLAS_PATHS.entities,
    source: [384, 256, 32, 32],
    size: [32, 32],
},

"sign-outside": {
    path: ATLAS_PATHS.entities,
    source: [416, 256, 32, 32],
    size: [32, 32],
},

"sign-signal": {
    path: ATLAS_PATHS.entities,
    source: [448, 256, 32, 32],
    size: [32, 32],
},

"sign-staff": {
    path: ATLAS_PATHS.entities,
    source: [480, 256, 32, 32],
    size: [32, 32],
},

"signal-amber": {
    path: ATLAS_PATHS.entities,
    source: [0, 320, 32, 32],
    size: [32, 32],
},

"signal-animal": {
    path: ATLAS_PATHS.entities,
    source: [32, 320, 32, 32],
    size: [32, 32],
},

"signal-apparatus-red": {
    path: ATLAS_PATHS.entities,
    source: [64, 320, 64, 64],
    size: [64, 64],
    defaultAnimation: "pulse",
    animations: {
        pulse: {
            fps: 5,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
            ],
        },
    },
},

"signal-apparatus-white": {
    path: ATLAS_PATHS.entities,
    source: [0, 384, 64, 64],
    size: [64, 64],
    defaultAnimation: "pulse",
    animations: {
        pulse: {
            fps: 5,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
            ],
        },
    },
},

"signal-dark": {
    path: ATLAS_PATHS.entities,
    source: [256, 384, 32, 32],
    size: [32, 32],
},

"signal-red": {
    path: ATLAS_PATHS.entities,
    source: [288, 384, 32, 32],
    size: [32, 32],
},

"staff-door-locked": {
    path: ATLAS_PATHS.entities,
    source: [320, 384, 32, 64],
    size: [32, 64],
},

"staff-door-open": {
    path: ATLAS_PATHS.entities,
    source: [352, 384, 32, 64],
    size: [32, 64],
},

"timetable-dark": {
    path: ATLAS_PATHS.entities,
    source: [384, 384, 32, 64],
    size: [32, 64],
},

"timetable-one": {
    path: ATLAS_PATHS.entities,
    source: [416, 384, 32, 64],
    size: [32, 64],
},

"timetable-two": {
    path: ATLAS_PATHS.entities,
    source: [448, 384, 32, 64],
    size: [32, 64],
},

"timetable-zero": {
    path: ATLAS_PATHS.entities,
    source: [480, 384, 32, 64],
    size: [32, 64],
},

"train-door": {
    path: ATLAS_PATHS.entities,
    source: [0, 448, 32, 64],
    size: [32, 64],
},

"tree-awake": {
    path: ATLAS_PATHS.entities,
    source: [32, 448, 32, 64],
    size: [32, 64],
    defaultAnimation: "glow",
    animations: {
        glow: {
            fps: 7,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [2, 0],
                [1, 0],
            ],
        },
    },
},

"tree-sleep": {
    path: ATLAS_PATHS.entities,
    source: [160, 448, 32, 64],
    size: [32, 64],
    defaultAnimation: "glow",
    animations: {
        glow: {
            fps: 4,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [2, 0],
                [1, 0],
            ],
        },
    },
},

"vending-0": {
    path: ATLAS_PATHS.entities,
    source: [288, 448, 32, 64],
    size: [32, 64],
},

"vending-1": {
    path: ATLAS_PATHS.entities,
    source: [320, 448, 32, 64],
    size: [32, 64],
    defaultAnimation: "blink",
    animations: {
        blink: {
            fps: 4,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
            ],
        },
    },
},

"vending-2": {
    path: ATLAS_PATHS.entities,
    source: [448, 448, 32, 64],
    size: [32, 64],
},

"vending-3": {
    path: ATLAS_PATHS.entities,
    source: [480, 448, 32, 64],
    size: [32, 64],
},
};

export const PLAYER_SPRITES = {
    default: {
        kind: "image",
        path: ATLAS_PATHS.player,
        source: [0, 0, 32, 64],
        size: [32, 64],
        footprint: { width: 16, height: 16, offsetX: 8, offsetY: 8 },
        defaultAnimation: "idle-down",
        animations: {
            "idle-down": { fps: 8, frames: [[0, 0]] },
            "walk-down": { fps: 8, frames: [[0, 0], [1, 0], [2, 0], [1, 0]] },
            "idle-left": { fps: 8, frames: [[0, 1]] },
            "walk-left": { fps: 8, frames: [[0, 1], [1, 1], [2, 1], [1, 1]] },
            "idle-right": { fps: 8, frames: [[0, 2]] },
            "walk-right": { fps: 8, frames: [[0, 2], [1, 2], [2, 2], [1, 2]] },
            "idle-up": { fps: 8, frames: [[0, 3]] },
            "walk-up": { fps: 8, frames: [[0, 3], [1, 3], [2, 3], [1, 3]] },
        },
    },
};
