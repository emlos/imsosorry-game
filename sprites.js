export const SPRITES = {
    door: {
        path: "./assets/tiles/door.png",
        size: [32, 32],
    },
    "pink-orb": {
        path: "./assets/tiles/orb.png",
        size: [32, 32],
    },
    "blue-orb": {
        path: "./assets/tiles/orb_blue.png",
        size: [32, 32],
    },
    receiver: {
        path: "./assets/tiles/receiver.png",
        size: [32, 32],
    },
    "save-point": {
        path: "./assets/tiles/save-point.png",
        size: [32, 32],
    },
    "animated-save-point": {
        path: "./assets/sprites/animated-save-point.png",
        size: [32, 32],
        frameSize: [32, 32],
        defaultAnimation: "pulse",
        animations: {
            pulse: {
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
    "glass-figure": {
        path: "./assets/tiles/glass-figure.png",
        size: [32, 32],
    },
    placeholder: {
        path: "./assets/debug/placeholder.png",
        size: [32, 32],
    },
};

export const PLAYER_SPRITES = {
    default: {
        kind: "image",
        path: "./assets/player/default-sheet.png",
        size: [32, 64],
        frameSize: [32, 64],
        defaultAnimation: "idle-down",
        animations: {
            "idle-down": {
                fps: 8,
                frames: [[0, 0]],
            },
            "walk-down": {
                fps: 8,
                frames: [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [1, 0],
                ],
            },
            "idle-left": {
                fps: 8,
                frames: [[0, 1]],
            },
            "walk-left": {
                fps: 8,
                frames: [
                    [0, 1],
                    [1, 1],
                    [2, 1],
                    [1, 1],
                ],
            },
            "idle-right": {
                fps: 8,
                frames: [[0, 2]],
            },
            "walk-right": {
                fps: 8,
                frames: [
                    [0, 2],
                    [1, 2],
                    [2, 2],
                    [1, 2],
                ],
            },
            "idle-up": {
                fps: 8,
                frames: [[0, 3]],
            },
            "walk-up": {
                fps: 8,
                frames: [
                    [0, 3],
                    [1, 3],
                    [2, 3],
                    [1, 3],
                ],
            },
        },
    },
    "debug-shape": {
        kind: "shape",
        fillStyle: "#f3a7c0",
        strokeStyle: "#3f2945",
    },
};
