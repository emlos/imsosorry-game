// Generated map data. Edit through editor/editor.html.
export const MAPS = [
    {
        id: "room-01-home",
        initialEntryId: "start",
        entries: {
            start: {
                col: 1,
                row: 1,
                facing: {
                    dc: 0,
                    dr: 1,
                },
            },
        },
        exits: [],
        triggers: [
            {
                id: "repeat-field",
                region: {
                    col: 5,
                    row: 4,
                    width: 4,
                    height: 3,
                },
                events: ["enter"],
                frequency: "always",
                effects: [
                    {
                        type: "cameraZoom",
                        zoom: 6,
                        durationMs: 500,
                    },
                    {
                        type: "playSound",
                        soundId: "item-use",
                    },
                    {
                        type: "showText",
                        pages: ["This 4×3 region triggers every time you walk into it."],
                    },
                ],
            },
            {
                id: "repeat-field-camera-reset",
                region: {
                    col: 5,
                    row: 4,
                    width: 4,
                    height: 3,
                },
                events: ["exit"],
                frequency: "always",
                effects: [
                    {
                        type: "cameraReset",
                        durationMs: 500,
                    },
                ],
            },
        ],
        tiles: {},
        entities: [
            {
                id: "robed-normal",
                active: true,
                col: 8,
                row: 2,
                visual: {
                    type: "sprite",
                    id: "robed-figure",
                },
                transform: {
                    flipX: false,
                    flipY: false,
                },
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "cameraPan",
                            offsetX: -64,
                            offsetY: 0,
                            durationMs: 500,
                        },
                        {
                            type: "showText",
                            pages: ["The camera can pan while it continues following the player."],
                            afterClose: [
                                {
                                    type: "cameraReset",
                                    durationMs: 400,
                                },
                                {
                                    type: "cameraZoom",
                                    zoom: 6,
                                    durationMs: 500,
                                },
                                {
                                    type: "showText",
                                    pages: [
                                        "Camera transitions finish before the next effect begins.",
                                    ],
                                    afterClose: [
                                        {
                                            type: "cameraReset",
                                            durationMs: 500,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    message: "Camera sequence demonstration.",
                },
                condition: null,
            },
            {
                id: "robed-flipped-x",
                active: true,
                col: 1,
                row: 7,
                visual: {
                    type: "sprite",
                    id: "robed-figure",
                },
                transform: {
                    flipX: true,
                    flipY: false,
                },
                collision: false,
                interaction: null,
                condition: null,
            },
            {
                id: "sign-normal",
                active: true,
                col: 3,
                row: 7,
                visual: {
                    type: "sprite",
                    id: "forest-sign",
                },
                transform: {
                    flipX: false,
                    flipY: false,
                },
                collision: false,
                interaction: null,
                condition: null,
            },
            {
                id: "sign-flipped-y",
                active: true,
                col: 4,
                row: 7,
                visual: {
                    type: "sprite",
                    id: "forest-sign",
                },
                transform: {
                    flipX: false,
                    flipY: true,
                },
                collision: false,
                interaction: null,
                condition: null,
            },
            {
                id: "lantern-normal",
                active: true,
                col: 7,
                row: 7,
                visual: {
                    type: "sprite",
                    id: "lantern",
                },
                transform: {
                    flipX: false,
                    flipY: false,
                },
                collision: false,
                interaction: null,
                condition: null,
            },
            {
                id: "lantern-flipped-both",
                active: true,
                col: 8,
                row: 7,
                visual: {
                    type: "sprite",
                    id: "lantern",
                },
                transform: {
                    flipX: true,
                    flipY: true,
                },
                collision: false,
                interaction: null,
                condition: null,
            },
        ],
        layers: {
            base: [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ],
            obstacles: [
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            ],
        },
        editorGroup: "demo01",
        camera: {
            zoom: 1,
            follow: "player",
        },
    },
];
