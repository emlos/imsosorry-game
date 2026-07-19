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
                id: "once-save-threshold",
                region: {
                    col: 1,
                    row: 2,
                    width: 2,
                    height: 2,
                },
                events: ["enter"],
                frequency: "once-per-save",
                effects: [
                    {
                        type: "playSound",
                        soundId: "receiver-chime",
                    },
                    {
                        type: "showText",
                        pages: ["This 2×2 region only triggers once per save file."],
                    },
                ],
            },
            {
                id: "once-visit-strip",
                region: {
                    col: 4,
                    row: 1,
                    width: 3,
                    height: 1,
                },
                events: ["enter"],
                frequency: "once-per-visit",
                effects: [
                    {
                        type: "playSound",
                        soundId: "orb-collect",
                    },
                    {
                        type: "showText",
                        pages: ["This 3×1 region triggers once during each room visit."],
                    },
                ],
            },
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
                        type: "playSound",
                        soundId: "item-use",
                    },
                    {
                        type: "showText",
                        pages: ["This 4×3 region triggers every time you walk into it."],
                    },
                ],
            },
        ],
        tiles: {},
        entities: [],
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
    },
];
