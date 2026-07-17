// Generated map data. Edit through editor/editor.html.
export const MAPS = [
    {
        id: "quiet-platform",
        entries: {
            start: {
                col: 6,
                row: 7,
                facing: {
                    dc: 0,
                    dr: -1,
                },
            },
            "loop-return": {
                col: 7,
                row: 6,
                facing: {
                    dc: 0,
                    dr: -1,
                },
            },
            "from-rain": {
                col: 3,
                row: 6,
                facing: {
                    dc: 0,
                    dr: -1,
                },
            },
            "from-orchard": {
                col: 6,
                row: 6,
                facing: {
                    dc: 0,
                    dr: -1,
                },
            },
            "from-service": {
                col: 9,
                row: 6,
                facing: {
                    dc: 0,
                    dr: -1,
                },
            },
        },
        exits: [],
        tiles: {},
        entities: [
            {
                id: "bench",
                active: true,
                col: 2,
                row: 7,
                spriteId: "bench",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "save",
                        },
                        {
                            type: "saveGame",
                        },
                    ],
                },
            },
            {
                id: "clock-empty",
                active: true,
                col: 6,
                row: 1,
                spriteId: "clock-empty",
                collision: false,
                interaction: null,
                condition: {
                    all: [
                        {
                            notItem: "waterlogged-punch-card",
                        },
                        {
                            notItem: "glass-fruit",
                        },
                        {
                            notItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "clock-one",
                active: true,
                col: 6,
                row: 1,
                spriteId: "clock-one",
                collision: false,
                interaction: null,
                condition: {
                    any: [
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                    ],
                },
            },
            {
                id: "clock-down",
                active: true,
                col: 6,
                row: 1,
                spriteId: "clock-down",
                collision: false,
                interaction: null,
                condition: {
                    all: [
                        {
                            hasItem: "waterlogged-punch-card",
                        },
                        {
                            hasItem: "glass-fruit",
                        },
                        {
                            hasItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "timetable-dark",
                active: true,
                col: 9,
                row: 2,
                spriteId: "timetable-dark",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "showText",
                            pages: ["The timetable is warm."],
                        },
                    ],
                },
                condition: {
                    all: [
                        {
                            notItem: "waterlogged-punch-card",
                        },
                        {
                            notItem: "glass-fruit",
                        },
                        {
                            notItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "timetable-one",
                active: true,
                col: 9,
                row: 2,
                spriteId: "timetable-one",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "showText",
                            pages: ["The timetable is warm."],
                        },
                    ],
                },
                condition: {
                    any: [
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                    ],
                },
            },
            {
                id: "timetable-two",
                active: true,
                col: 9,
                row: 2,
                spriteId: "timetable-two",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "showText",
                            pages: ["The timetable is warm."],
                        },
                    ],
                },
                condition: {
                    any: [
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                    ],
                },
            },
            {
                id: "timetable-zero",
                active: true,
                col: 9,
                row: 2,
                spriteId: "timetable-zero",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "showText",
                            pages: ["The timetable is warm."],
                        },
                    ],
                },
                condition: {
                    all: [
                        {
                            hasItem: "waterlogged-punch-card",
                        },
                        {
                            hasItem: "glass-fruit",
                        },
                        {
                            hasItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "vending-0",
                active: true,
                col: 11,
                row: 5,
                spriteId: "vending-0",
                collision: true,
                interaction: null,
                condition: {
                    all: [
                        {
                            notItem: "waterlogged-punch-card",
                        },
                        {
                            notItem: "glass-fruit",
                        },
                        {
                            notItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "vending-1",
                active: true,
                col: 11,
                row: 5,
                spriteId: "vending-1",
                collision: true,
                interaction: null,
                condition: {
                    any: [
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                    ],
                },
            },
            {
                id: "vending-2",
                active: true,
                col: 11,
                row: 5,
                spriteId: "vending-2",
                collision: true,
                interaction: null,
                condition: {
                    any: [
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                    ],
                },
            },
            {
                id: "vending-3",
                active: true,
                col: 11,
                row: 5,
                spriteId: "vending-3",
                collision: true,
                interaction: null,
                condition: {
                    all: [
                        {
                            hasItem: "waterlogged-punch-card",
                        },
                        {
                            hasItem: "glass-fruit",
                        },
                        {
                            hasItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "attendant-0",
                active: true,
                col: 12,
                row: 2,
                spriteId: "attendant-0",
                collision: false,
                interaction: null,
                condition: {
                    all: [
                        {
                            notItem: "waterlogged-punch-card",
                        },
                        {
                            notItem: "glass-fruit",
                        },
                        {
                            notItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "attendant-1",
                active: true,
                col: 12,
                row: 2,
                spriteId: "attendant-1",
                collision: false,
                interaction: null,
                condition: {
                    any: [
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                    ],
                },
            },
            {
                id: "attendant-2",
                active: true,
                col: 12,
                row: 2,
                spriteId: "attendant-2",
                collision: false,
                interaction: null,
                condition: {
                    any: [
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                    ],
                },
            },
            {
                id: "attendant-3",
                active: true,
                col: 12,
                row: 2,
                spriteId: "attendant-3",
                collision: false,
                interaction: null,
                condition: {
                    all: [
                        {
                            hasItem: "waterlogged-punch-card",
                        },
                        {
                            hasItem: "glass-fruit",
                        },
                        {
                            hasItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "duplicate-behind-glass",
                active: true,
                col: 11,
                row: 2,
                spriteId: "duplicate-player",
                collision: false,
                interaction: null,
                condition: {
                    any: [
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                    ],
                },
            },
            {
                id: "signal-animal",
                active: true,
                col: 4,
                row: 2,
                spriteId: "signal-animal",
                collision: false,
                interaction: null,
                condition: {
                    hasItem: "brass-tooth",
                },
            },
            {
                id: "platform-variation",
                active: true,
                col: 1,
                row: 1,
                spriteId: "platform-variation-a",
                collision: false,
                interaction: null,
            },
            {
                id: "rain-gate",
                active: true,
                col: 3,
                row: 4,
                spriteId: "gate-umbrella",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "rain-office",
                            entryId: "from-platform",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
                condition: {
                    any: [
                        {
                            notItem: "waterlogged-punch-card",
                        },
                        {
                            notItem: "glass-fruit",
                        },
                        {
                            notItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "rain-gate-loop",
                active: true,
                col: 3,
                row: 4,
                spriteId: "gate-umbrella",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "quiet-platform",
                            entryId: "loop-return",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
                condition: {
                    all: [
                        {
                            hasItem: "waterlogged-punch-card",
                        },
                        {
                            hasItem: "glass-fruit",
                        },
                        {
                            hasItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "orchard-gate",
                active: true,
                col: 6,
                row: 4,
                spriteId: "gate-apple",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "velvet-orchard",
                            entryId: "from-platform",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
                condition: {
                    any: [
                        {
                            notItem: "waterlogged-punch-card",
                        },
                        {
                            notItem: "glass-fruit",
                        },
                        {
                            notItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "orchard-gate-loop",
                active: true,
                col: 6,
                row: 4,
                spriteId: "gate-apple",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "quiet-platform",
                            entryId: "loop-return",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
                condition: {
                    all: [
                        {
                            hasItem: "waterlogged-punch-card",
                        },
                        {
                            hasItem: "glass-fruit",
                        },
                        {
                            hasItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "service-gate",
                active: true,
                col: 9,
                row: 4,
                spriteId: "gate-eye",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "service-hall",
                            entryId: "from-platform",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
                condition: {
                    any: [
                        {
                            notItem: "waterlogged-punch-card",
                        },
                        {
                            notItem: "glass-fruit",
                        },
                        {
                            notItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "service-gate-loop",
                active: true,
                col: 9,
                row: 4,
                spriteId: "gate-eye",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "quiet-platform",
                            entryId: "loop-return",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
                condition: {
                    all: [
                        {
                            hasItem: "waterlogged-punch-card",
                        },
                        {
                            hasItem: "glass-fruit",
                        },
                        {
                            hasItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "blank-gate",
                active: true,
                col: 12,
                row: 4,
                spriteId: "gate-blank",
                collision: true,
                interaction: null,
                condition: {
                    any: [
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            any: [
                                {
                                    all: [
                                        {
                                            hasItem: "waterlogged-punch-card",
                                        },
                                        {
                                            notItem: "glass-fruit",
                                        },
                                        {
                                            notItem: "brass-tooth",
                                        },
                                    ],
                                },
                                {
                                    all: [
                                        {
                                            notItem: "waterlogged-punch-card",
                                        },
                                        {
                                            hasItem: "glass-fruit",
                                        },
                                        {
                                            notItem: "brass-tooth",
                                        },
                                    ],
                                },
                                {
                                    all: [
                                        {
                                            notItem: "waterlogged-punch-card",
                                        },
                                        {
                                            notItem: "glass-fruit",
                                        },
                                        {
                                            hasItem: "brass-tooth",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
            {
                id: "train-door",
                active: true,
                col: 12,
                row: 4,
                spriteId: "train-door",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "stationary-train",
                            entryId: "from-platform",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
                condition: {
                    all: [
                        {
                            hasItem: "waterlogged-punch-card",
                        },
                        {
                            hasItem: "glass-fruit",
                        },
                        {
                            hasItem: "brass-tooth",
                        },
                    ],
                },
            },
            {
                id: "display-card",
                active: true,
                col: 10,
                row: 5,
                spriteId: "punch-card",
                collision: false,
                interaction: null,
                condition: {
                    hasItem: "waterlogged-punch-card",
                },
            },
            {
                id: "display-fruit",
                active: true,
                col: 11,
                row: 5,
                spriteId: "glass-fruit",
                collision: false,
                interaction: null,
                condition: {
                    hasItem: "glass-fruit",
                },
            },
            {
                id: "display-tooth",
                active: true,
                col: 12,
                row: 5,
                spriteId: "brass-tooth",
                collision: false,
                interaction: null,
                condition: {
                    hasItem: "brass-tooth",
                },
            },
        ],
        layers: {
            base: [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ],
            obstacles: [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1],
                [1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1],
                [1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1],
                [1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1],
                [1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1],
                [1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1],
                [1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1],
                [1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            ],
            foreground: [
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, -1],
                [-1, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, -1],
                [-1, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, -1],
                [-1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, -1],
                [-1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            ],
        },
        editorGroup: "quiet-line",
        music: [
            {
                condition: {
                    all: [
                        {
                            hasItem: "waterlogged-punch-card",
                        },
                        {
                            hasItem: "glass-fruit",
                        },
                        {
                            hasItem: "brass-tooth",
                        },
                    ],
                },
                trackId: "platform-complete",
                continuityId: "quiet-platform",
                restart: "if-different",
                crossfadeMs: 600,
            },
            {
                condition: {
                    any: [
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    notItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    hasItem: "waterlogged-punch-card",
                                },
                                {
                                    notItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                        {
                            all: [
                                {
                                    notItem: "waterlogged-punch-card",
                                },
                                {
                                    hasItem: "glass-fruit",
                                },
                                {
                                    hasItem: "brass-tooth",
                                },
                            ],
                        },
                    ],
                },
                trackId: "platform-two",
                continuityId: "quiet-platform",
                restart: "if-different",
                crossfadeMs: 600,
            },
            {
                condition: {
                    any: [
                        {
                            hasItem: "waterlogged-punch-card",
                        },
                        {
                            hasItem: "glass-fruit",
                        },
                        {
                            hasItem: "brass-tooth",
                        },
                    ],
                },
                trackId: "platform-one",
                continuityId: "quiet-platform",
                restart: "if-different",
                crossfadeMs: 600,
            },
            {
                trackId: "platform-empty",
                continuityId: "quiet-platform",
                restart: "if-different",
                crossfadeMs: 600,
            },
        ],
        onEnter: [
            {
                type: "random",
                id: "platform-minor-variation",
                scope: "save",
                choices: [
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setEntitySprite",
                                entityId: "platform-variation",
                                spriteId: "platform-variation-a",
                            },
                        ],
                    },
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setEntitySprite",
                                entityId: "platform-variation",
                                spriteId: "platform-variation-b",
                            },
                        ],
                    },
                ],
            },
        ],
        initialEntryId: "start",
    },
    {
        id: "rain-office",
        entries: {
            "from-platform": {
                col: 2,
                row: 6,
                facing: {
                    dc: 1,
                    dr: 0,
                },
            },
        },
        exits: [
            {
                edge: "east",
                range: [3, 4],
                targetMapId: "flooded-archive",
                targetEdge: "west",
                targetRange: [2, 3],
                musicTransition: "crossfade",
                musicTransitionMs: 450,
            },
        ],
        tiles: {},
        entities: [
            {
                id: "return-gate",
                active: true,
                col: 1,
                row: 6,
                spriteId: "gate-umbrella",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "quiet-platform",
                            entryId: "from-rain",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
            },
            {
                id: "desk-a",
                active: true,
                col: 3,
                row: 3,
                spriteId: "desk",
                collision: true,
                interaction: null,
            },
            {
                id: "desk-b",
                active: true,
                col: 7,
                row: 3,
                spriteId: "desk",
                collision: true,
                interaction: null,
            },
            {
                id: "monitor-a-on",
                active: true,
                col: 3,
                row: 2,
                spriteId: "monitor-on",
                collision: false,
                interaction: null,
                condition: {
                    notItem: "waterlogged-punch-card",
                },
            },
            {
                id: "monitor-a-off",
                active: true,
                col: 3,
                row: 2,
                spriteId: "monitor-off",
                collision: false,
                interaction: null,
                condition: {
                    hasItem: "waterlogged-punch-card",
                },
            },
            {
                id: "monitor-b-on",
                active: true,
                col: 7,
                row: 2,
                spriteId: "monitor-on",
                collision: false,
                interaction: null,
                condition: {
                    notItem: "waterlogged-punch-card",
                },
            },
            {
                id: "monitor-b-off",
                active: true,
                col: 7,
                row: 2,
                spriteId: "monitor-off",
                collision: false,
                interaction: null,
                condition: {
                    hasItem: "waterlogged-punch-card",
                },
            },
            {
                id: "keyboard",
                active: true,
                col: 4,
                row: 3,
                spriteId: "keyboard-moss",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "showText",
                            pages: ["The keyboard is growing moss."],
                        },
                    ],
                },
            },
            {
                id: "chair",
                active: true,
                col: 8,
                row: 4,
                spriteId: "dry-chair",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "showText",
                            pages: ["Someone has carefully dried this chair."],
                        },
                    ],
                },
            },
            {
                id: "phone",
                active: true,
                col: 10,
                row: 2,
                spriteId: "ringing-phone",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "phone",
                            condition: {
                                notFlag: "rain.phone",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "rain.phone",
                            value: true,
                            condition: {
                                notFlag: "rain.phone",
                            },
                        },
                        {
                            type: "playSound",
                            soundId: "rain-swell",
                            condition: {
                                flag: "rain.phone",
                            },
                        },
                    ],
                },
            },
        ],
        layers: {
            base: [
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
            ],
            obstacles: [
                [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
                [4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4],
                [4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4],
                [4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4],
                [4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 4],
                [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
            ],
        },
        editorGroup: "quiet-line",
        music: {
            trackId: "rain-office",
            continuityId: "rain-branch",
            restart: "if-different",
            crossfadeMs: 450,
        },
    },
    {
        id: "flooded-archive",
        entries: {},
        exits: [
            {
                edge: "west",
                range: [2, 3],
                targetMapId: "rain-office",
                targetEdge: "east",
                targetRange: [3, 4],
                musicTransition: "crossfade",
                musicTransitionMs: 450,
            },
            {
                edge: "south",
                range: [4, 5],
                targetMapId: "copy-room",
                targetEdge: "north",
                targetRange: [2, 3],
                musicTransition: "crossfade",
                musicTransitionMs: 450,
            },
        ],
        tiles: {},
        entities: [
            {
                id: "shelves-a",
                active: true,
                col: 3,
                row: 2,
                spriteId: "shelves",
                collision: true,
                interaction: null,
                condition: {
                    notFlag: "rain.phone",
                },
            },
            {
                id: "shelves-b",
                active: true,
                col: 6,
                row: 2,
                spriteId: "shelves",
                collision: true,
                interaction: null,
                condition: {
                    notFlag: "rain.phone",
                },
            },
            {
                id: "cabinet-closed",
                active: true,
                col: 7,
                row: 5,
                spriteId: "cabinet-closed",
                collision: true,
                interaction: null,
                condition: {
                    notFlag: "rain.phone",
                },
            },
            {
                id: "cabinet-floating",
                active: true,
                col: 7,
                row: 4,
                spriteId: "cabinet-floating",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "addItem",
                            itemId: "waterlogged-punch-card",
                            quantity: 1,
                        },
                        {
                            type: "playSound",
                            soundId: "ticket",
                        },
                        {
                            type: "playMusicEffect",
                            musicEffectId: "ticket-stinger",
                            duckMusicTo: 0.2,
                        },
                    ],
                },
                condition: {
                    all: [
                        {
                            flag: "rain.phone",
                        },
                        {
                            notItem: "waterlogged-punch-card",
                        },
                    ],
                },
            },
            {
                id: "card-ghost",
                active: true,
                col: 7,
                row: 3,
                spriteId: "punch-card",
                collision: false,
                interaction: null,
                condition: {
                    all: [
                        {
                            flag: "rain.phone",
                        },
                        {
                            notItem: "waterlogged-punch-card",
                        },
                    ],
                },
            },
        ],
        layers: {
            base: [
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
            ],
            obstacles: [
                [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
                [4, -1, -1, -1, -1, -1, -1, -1, -1, 4],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, 4],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, 4],
                [4, -1, -1, -1, -1, -1, -1, -1, -1, 4],
                [4, -1, -1, -1, -1, -1, -1, -1, -1, 4],
                [4, -1, -1, -1, -1, -1, -1, -1, -1, 4],
                [4, 4, 4, 4, -1, -1, 4, 4, 4, 4],
            ],
            foreground: [
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, 5, -1, 5, -1, 5, -1, 5, -1, -1],
                [-1, -1, 5, -1, 5, -1, 5, -1, 5, -1],
                [-1, 5, -1, 5, -1, 5, -1, 5, -1, -1],
                [-1, -1, 5, -1, 5, -1, 5, -1, 5, -1],
                [-1, 5, -1, 5, -1, 5, -1, 5, -1, -1],
                [-1, -1, 5, -1, 5, -1, 5, -1, 5, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            ],
        },
        editorGroup: "quiet-line",
        music: [
            {
                condition: {
                    flag: "rain.phone",
                },
                trackId: "rain-muffled",
                continuityId: "rain-branch",
                restart: "if-different",
                crossfadeMs: 500,
            },
            {
                trackId: "rain-office",
                continuityId: "rain-branch",
                restart: "if-different",
                crossfadeMs: 500,
            },
        ],
    },
    {
        id: "copy-room",
        entries: {},
        exits: [
            {
                edge: "north",
                range: [2, 3],
                targetMapId: "flooded-archive",
                targetEdge: "south",
                targetRange: [4, 5],
                musicTransition: "crossfade",
                musicTransitionMs: 450,
            },
        ],
        tiles: {},
        entities: [
            {
                id: "copier",
                active: true,
                col: 4,
                row: 3,
                spriteId: "copier",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "random",
                            id: "copier-output",
                            scope: "save",
                            choices: [
                                {
                                    weight: 1,
                                    effects: [
                                        {
                                            type: "playSound",
                                            soundId: "copier",
                                        },
                                        {
                                            type: "showText",
                                            pages: ["It prints a dark silhouette."],
                                        },
                                    ],
                                },
                                {
                                    weight: 1,
                                    effects: [
                                        {
                                            type: "playSound",
                                            soundId: "copier",
                                        },
                                        {
                                            type: "showText",
                                            pages: ["It prints the current room."],
                                        },
                                    ],
                                },
                                {
                                    weight: 1,
                                    effects: [
                                        {
                                            type: "playSound",
                                            soundId: "copier",
                                        },
                                        {
                                            type: "showText",
                                            pages: ["It prints three circles."],
                                        },
                                    ],
                                },
                                {
                                    weight: 1,
                                    effects: [
                                        {
                                            type: "playSound",
                                            soundId: "copier",
                                        },
                                    ],
                                },
                                {
                                    weight: 1,
                                    effects: [
                                        {
                                            type: "playSound",
                                            soundId: "copier",
                                        },
                                        {
                                            type: "setEntityActive",
                                            entityId: "copier-duplicate",
                                            active: true,
                                            persistence: "roomVisit",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
            {
                id: "copier-duplicate",
                active: false,
                col: 6,
                row: 4,
                spriteId: "copier-duplicate",
                collision: false,
                interaction: null,
            },
        ],
        layers: {
            base: [
                [3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3],
                [3, 3, 3, 3, 3, 3, 3, 3],
            ],
            obstacles: [
                [4, 4, -1, -1, 4, 4, 4, 4],
                [4, -1, -1, -1, -1, -1, -1, 4],
                [4, -1, -1, -1, -1, -1, -1, 4],
                [4, -1, -1, -1, -1, -1, -1, 4],
                [4, -1, -1, -1, -1, -1, -1, 4],
                [4, -1, -1, -1, -1, -1, -1, 4],
                [4, 4, 4, 4, 4, 4, 4, 4],
            ],
        },
        editorGroup: "quiet-line",
        music: {
            trackId: "rain-muffled",
            continuityId: "rain-branch",
            restart: "if-different",
            crossfadeMs: 450,
        },
    },
    {
        id: "velvet-orchard",
        entries: {
            "from-platform": {
                col: 2,
                row: 6,
                facing: {
                    dc: 1,
                    dr: 0,
                },
            },
        },
        exits: [
            {
                edge: "east",
                range: [3, 4],
                targetMapId: "glass-grove",
                targetEdge: "west",
                targetRange: [2, 3],
                musicTransition: "crossfade",
                musicTransitionMs: 450,
            },
        ],
        tiles: {},
        entities: [
            {
                id: "return-gate",
                active: true,
                col: 1,
                row: 6,
                spriteId: "gate-apple",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "quiet-platform",
                            entryId: "from-orchard",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
            },
            {
                id: "tree-1",
                active: true,
                col: 3,
                row: 2,
                spriteId: "tree-sleep",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "tree-awake",
                            condition: {
                                flag: "orchard.awake-1",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.open",
                            value: true,
                            condition: {
                                flag: "orchard.awake-1",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.touched-1",
                            value: true,
                            condition: {
                                notFlag: "orchard.awake-1",
                            },
                        },
                        {
                            type: "playSound",
                            soundId: "tree-dull",
                            condition: {
                                notFlag: "orchard.awake-1",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.open",
                            value: true,
                            condition: {
                                any: [
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
            {
                id: "tree-2",
                active: true,
                col: 5,
                row: 4,
                spriteId: "tree-sleep",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "tree-awake",
                            condition: {
                                flag: "orchard.awake-2",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.open",
                            value: true,
                            condition: {
                                flag: "orchard.awake-2",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.touched-2",
                            value: true,
                            condition: {
                                notFlag: "orchard.awake-2",
                            },
                        },
                        {
                            type: "playSound",
                            soundId: "tree-dull",
                            condition: {
                                notFlag: "orchard.awake-2",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.open",
                            value: true,
                            condition: {
                                any: [
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
            {
                id: "tree-3",
                active: true,
                col: 7,
                row: 2,
                spriteId: "tree-sleep",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "tree-awake",
                            condition: {
                                flag: "orchard.awake-3",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.open",
                            value: true,
                            condition: {
                                flag: "orchard.awake-3",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.touched-3",
                            value: true,
                            condition: {
                                notFlag: "orchard.awake-3",
                            },
                        },
                        {
                            type: "playSound",
                            soundId: "tree-dull",
                            condition: {
                                notFlag: "orchard.awake-3",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.open",
                            value: true,
                            condition: {
                                any: [
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
            {
                id: "tree-4",
                active: true,
                col: 9,
                row: 4,
                spriteId: "tree-sleep",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "tree-awake",
                            condition: {
                                flag: "orchard.awake-4",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.open",
                            value: true,
                            condition: {
                                flag: "orchard.awake-4",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.touched-4",
                            value: true,
                            condition: {
                                notFlag: "orchard.awake-4",
                            },
                        },
                        {
                            type: "playSound",
                            soundId: "tree-dull",
                            condition: {
                                notFlag: "orchard.awake-4",
                            },
                        },
                        {
                            type: "setFlag",
                            flag: "orchard.open",
                            value: true,
                            condition: {
                                any: [
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-1",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                    {
                                        all: [
                                            {
                                                flag: "orchard.touched-2",
                                            },
                                            {
                                                flag: "orchard.touched-3",
                                            },
                                            {
                                                flag: "orchard.touched-4",
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
            {
                id: "glass-door-blocker",
                active: true,
                col: 10,
                row: 3,
                spriteId: "gate-blank",
                collision: true,
                interaction: null,
                condition: {
                    notFlag: "orchard.open",
                },
            },
        ],
        layers: {
            base: [
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
            ],
            obstacles: [
                [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
            ],
        },
        editorGroup: "quiet-line",
        music: {
            trackId: "orchard",
            continuityId: "orchard-branch",
            restart: "if-different",
            crossfadeMs: 450,
        },
        onEnter: [
            {
                type: "random",
                id: "awake-tree",
                scope: "save",
                choices: [
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setFlag",
                                flag: "orchard.awake-1",
                                value: true,
                            },
                            {
                                type: "setEntitySprite",
                                entityId: "tree-1",
                                spriteId: "tree-awake",
                            },
                        ],
                    },
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setFlag",
                                flag: "orchard.awake-2",
                                value: true,
                            },
                            {
                                type: "setEntitySprite",
                                entityId: "tree-2",
                                spriteId: "tree-awake",
                            },
                        ],
                    },
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setFlag",
                                flag: "orchard.awake-3",
                                value: true,
                            },
                            {
                                type: "setEntitySprite",
                                entityId: "tree-3",
                                spriteId: "tree-awake",
                            },
                        ],
                    },
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setFlag",
                                flag: "orchard.awake-4",
                                value: true,
                            },
                            {
                                type: "setEntitySprite",
                                entityId: "tree-4",
                                spriteId: "tree-awake",
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "glass-grove",
        entries: {},
        exits: [
            {
                edge: "west",
                range: [2, 3],
                targetMapId: "velvet-orchard",
                targetEdge: "east",
                targetRange: [3, 4],
                musicTransition: "crossfade",
                musicTransitionMs: 450,
            },
            {
                edge: "east",
                range: [2, 3],
                targetMapId: "picnic-room",
                targetEdge: "west",
                targetRange: [3, 4],
                musicTransition: "crossfade",
                musicTransitionMs: 450,
            },
        ],
        tiles: {},
        entities: [
            {
                id: "figure-a",
                active: true,
                col: 6,
                row: 2,
                spriteId: "glass-figure",
                collision: false,
                interaction: null,
            },
            {
                id: "figure-b",
                active: true,
                col: 7,
                row: 4,
                spriteId: "glass-figure",
                collision: false,
                interaction: null,
            },
            {
                id: "visit-figure",
                active: false,
                col: 4,
                row: 2,
                spriteId: "glass-figure",
                collision: false,
                interaction: null,
            },
        ],
        layers: {
            base: [
                [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
                [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
                [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
                [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
                [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
                [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
                [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
            ],
            obstacles: [
                [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
            ],
        },
        editorGroup: "quiet-line",
        music: {
            trackId: "orchard",
            continuityId: "orchard-branch",
            restart: "if-different",
            playbackRate: 0.92,
            crossfadeMs: 400,
        },
        onEnter: [
            {
                type: "random",
                id: "extra-figure",
                scope: "roomVisit",
                choices: [
                    {
                        weight: 2,
                        effects: [
                            {
                                type: "setEntityActive",
                                entityId: "visit-figure",
                                active: true,
                                persistence: "roomVisit",
                            },
                        ],
                    },
                    {
                        weight: 3,
                        effects: [],
                    },
                ],
            },
        ],
    },
    {
        id: "picnic-room",
        entries: {},
        exits: [
            {
                edge: "west",
                range: [3, 4],
                targetMapId: "glass-grove",
                targetEdge: "east",
                targetRange: [2, 3],
                musicTransition: "crossfade",
                musicTransitionMs: 450,
            },
        ],
        tiles: {},
        entities: [
            {
                id: "sun-normal",
                active: true,
                col: 5,
                row: 1,
                spriteId: "artificial-sun",
                collision: false,
                interaction: null,
                condition: {
                    notItem: "glass-fruit",
                },
            },
            {
                id: "sun-changed",
                active: true,
                col: 5,
                row: 1,
                spriteId: "artificial-sun-changed",
                collision: false,
                interaction: null,
                condition: {
                    hasItem: "glass-fruit",
                },
            },
            {
                id: "blanket",
                active: true,
                col: 5,
                row: 4,
                spriteId: "picnic-blanket",
                collision: true,
                interaction: null,
            },
            {
                id: "fruit",
                active: true,
                col: 5,
                row: 4,
                spriteId: "glass-fruit",
                collision: false,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "showText",
                            pages: ["It is heavier when no one is looking."],
                            afterClose: [
                                {
                                    type: "addItem",
                                    itemId: "glass-fruit",
                                    quantity: 1,
                                },
                                {
                                    type: "playSound",
                                    soundId: "ticket",
                                },
                                {
                                    type: "playMusicEffect",
                                    musicEffectId: "ticket-stinger",
                                    duckMusicTo: 0.2,
                                },
                                {
                                    type: "stopMusic",
                                    fadeOutMs: 250,
                                },
                                {
                                    type: "playSound",
                                    soundId: "insects",
                                },
                            ],
                        },
                    ],
                },
                condition: {
                    notItem: "glass-fruit",
                },
            },
            {
                id: "chair-a",
                active: true,
                col: 3,
                row: 5,
                spriteId: "chair-out",
                collision: true,
                interaction: null,
            },
            {
                id: "chair-b",
                active: true,
                col: 7,
                row: 5,
                spriteId: "chair-out",
                collision: true,
                interaction: null,
            },
            {
                id: "chair-c-before",
                active: true,
                col: 5,
                row: 6,
                spriteId: "chair-out",
                collision: true,
                interaction: null,
                condition: {
                    notItem: "glass-fruit",
                },
            },
            {
                id: "chair-c-after",
                active: true,
                col: 5,
                row: 6,
                spriteId: "chair-facing",
                collision: true,
                interaction: null,
                condition: {
                    hasItem: "glass-fruit",
                },
            },
        ],
        layers: {
            base: [
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
            ],
            obstacles: [
                [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [7, -1, -1, -1, -1, -1, -1, -1, -1, 7],
                [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
            ],
        },
        editorGroup: "quiet-line",
        music: {
            trackId: "orchard",
            continuityId: "orchard-branch",
            restart: "if-different",
            crossfadeMs: 400,
        },
        onEnter: [
            {
                type: "stopMusic",
                fadeOutMs: 200,
                condition: {
                    hasItem: "glass-fruit",
                },
            },
            {
                type: "playSound",
                soundId: "insects",
                condition: {
                    hasItem: "glass-fruit",
                },
            },
        ],
    },
    {
        id: "service-hall",
        entries: {
            "from-platform": {
                col: 2,
                row: 6,
                facing: {
                    dc: 1,
                    dr: 0,
                },
            },
            "from-signal": {
                col: 2,
                row: 5,
                facing: {
                    dc: 1,
                    dr: 0,
                },
            },
        },
        exits: [
            {
                edge: "east",
                range: [3, 4],
                targetMapId: "red-corridor",
                targetEdge: "west",
                targetRange: [2, 3],
                musicTransition: "crossfade",
                musicTransitionMs: 450,
            },
        ],
        tiles: {},
        entities: [
            {
                id: "return-gate",
                active: true,
                col: 1,
                row: 6,
                spriteId: "gate-eye",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "quiet-platform",
                            entryId: "from-service",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
            },
            {
                id: "sign-signal",
                active: true,
                col: 3,
                row: 2,
                spriteId: "sign-signal",
                collision: false,
                interaction: null,
            },
            {
                id: "sign-cleaning",
                active: true,
                col: 5,
                row: 2,
                spriteId: "sign-cleaning",
                collision: false,
                interaction: null,
            },
            {
                id: "sign-staff",
                active: true,
                col: 7,
                row: 2,
                spriteId: "sign-staff",
                collision: false,
                interaction: null,
            },
            {
                id: "sign-outside",
                active: true,
                col: 9,
                row: 2,
                spriteId: "sign-outside",
                collision: false,
                interaction: null,
            },
            {
                id: "staff-locked",
                active: true,
                col: 7,
                row: 4,
                spriteId: "staff-door-locked",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "showText",
                            pages: ["The signal is waiting for a colour."],
                        },
                    ],
                },
                condition: {
                    notItem: "brass-tooth",
                },
            },
            {
                id: "staff-open",
                active: true,
                col: 7,
                row: 4,
                spriteId: "staff-door-open",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "showText",
                            pages: ["A clipboard shows your current sprite."],
                        },
                    ],
                },
                condition: {
                    hasItem: "brass-tooth",
                },
            },
        ],
        layers: {
            base: [
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
            ],
            obstacles: [
                [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
            ],
        },
        editorGroup: "quiet-line",
        music: {
            trackId: "service",
            continuityId: "service-branch",
            restart: "if-different",
            crossfadeMs: 350,
        },
        onEnter: [
            {
                type: "random",
                id: "sign-order",
                scope: "roomVisit",
                choices: [
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setEntityPosition",
                                entityId: "sign-signal",
                                col: 3,
                                row: 2,
                            },
                            {
                                type: "setEntityPosition",
                                entityId: "sign-cleaning",
                                col: 5,
                                row: 2,
                            },
                            {
                                type: "setEntityPosition",
                                entityId: "sign-staff",
                                col: 7,
                                row: 2,
                            },
                            {
                                type: "setEntityPosition",
                                entityId: "sign-outside",
                                col: 9,
                                row: 2,
                            },
                        ],
                    },
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setEntityPosition",
                                entityId: "sign-signal",
                                col: 9,
                                row: 2,
                            },
                            {
                                type: "setEntityPosition",
                                entityId: "sign-cleaning",
                                col: 3,
                                row: 2,
                            },
                            {
                                type: "setEntityPosition",
                                entityId: "sign-staff",
                                col: 5,
                                row: 2,
                            },
                            {
                                type: "setEntityPosition",
                                entityId: "sign-outside",
                                col: 7,
                                row: 2,
                            },
                        ],
                    },
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setEntityPosition",
                                entityId: "sign-signal",
                                col: 5,
                                row: 2,
                            },
                            {
                                type: "setEntityPosition",
                                entityId: "sign-cleaning",
                                col: 9,
                                row: 2,
                            },
                            {
                                type: "setEntityPosition",
                                entityId: "sign-staff",
                                col: 3,
                                row: 2,
                            },
                            {
                                type: "setEntityPosition",
                                entityId: "sign-outside",
                                col: 7,
                                row: 2,
                            },
                        ],
                    },
                ],
            },
            {
                type: "random",
                id: "locked-door-sound",
                scope: "roomVisit",
                choices: [
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "playSound",
                                soundId: "service-knock",
                            },
                        ],
                    },
                    {
                        weight: 3,
                        effects: [],
                    },
                ],
            },
        ],
        onExit: [
            {
                type: "setFlag",
                flag: "corridor.skip",
                value: true,
            },
        ],
    },
    {
        id: "red-corridor",
        entries: {
            "from-camera": {
                col: 1,
                row: 2,
                facing: {
                    dc: 1,
                    dr: 0,
                },
            },
        },
        exits: [
            {
                edge: "west",
                range: [2, 3],
                targetMapId: "service-hall",
                targetEdge: "east",
                targetRange: [3, 4],
                musicTransition: "crossfade",
                musicTransitionMs: 450,
            },
            {
                id: "east-loop",
                edge: "east",
                range: [2, 3],
                destination: {
                    type: "random",
                    id: "east-destination",
                    scope: "use",
                    choices: [
                        {
                            weight: 4,
                            targetMapId: "red-corridor",
                            targetEdge: "west",
                            targetRange: [2, 3],
                            musicTransition: "inherit",
                        },
                        {
                            weight: 1,
                            targetMapId: "camera-test",
                            entryId: "from-corridor",
                            musicTransition: "silence",
                            musicTransitionMs: 100,
                        },
                    ],
                },
            },
        ],
        tiles: {},
        entities: [
            {
                id: "light-red",
                active: true,
                col: 6,
                row: 2,
                spriteId: "signal-red",
                collision: false,
                interaction: null,
                condition: {
                    any: [
                        {
                            notFlag: "corridor.loop-1",
                        },
                        {
                            flag: "corridor.loop-3",
                        },
                    ],
                },
            },
            {
                id: "light-amber",
                active: true,
                col: 6,
                row: 2,
                spriteId: "signal-amber",
                collision: false,
                interaction: null,
                condition: {
                    all: [
                        {
                            flag: "corridor.loop-1",
                        },
                        {
                            notFlag: "corridor.loop-2",
                        },
                    ],
                },
            },
            {
                id: "light-dark",
                active: true,
                col: 6,
                row: 2,
                spriteId: "signal-dark",
                collision: false,
                interaction: null,
                condition: {
                    all: [
                        {
                            flag: "corridor.loop-2",
                        },
                        {
                            notFlag: "corridor.loop-3",
                        },
                    ],
                },
            },
            {
                id: "north-door",
                active: true,
                col: 6,
                row: 1,
                spriteId: "gate-zero",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "signal-room",
                            entryId: "from-corridor",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
                condition: {
                    flag: "corridor.loop-3",
                },
            },
        ],
        layers: {
            base: [
                [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
                [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
                [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
                [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
                [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
                [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
            ],
            obstacles: [
                [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
            ],
        },
        editorGroup: "quiet-line",
        music: {
            trackId: "service",
            continuityId: "service-branch",
            restart: "never",
        },
        onEnter: [
            {
                type: "setFlag",
                flag: "corridor.loop-3",
                value: true,
                condition: {
                    all: [
                        {
                            flag: "corridor.loop-2",
                        },
                        {
                            notFlag: "corridor.loop-3",
                        },
                        {
                            notFlag: "corridor.skip",
                        },
                    ],
                },
            },
            {
                type: "setFlag",
                flag: "corridor.loop-2",
                value: true,
                condition: {
                    all: [
                        {
                            flag: "corridor.loop-1",
                        },
                        {
                            notFlag: "corridor.loop-2",
                        },
                        {
                            notFlag: "corridor.skip",
                        },
                    ],
                },
            },
            {
                type: "setFlag",
                flag: "corridor.loop-1",
                value: true,
                condition: {
                    all: [
                        {
                            notFlag: "corridor.loop-1",
                        },
                        {
                            notFlag: "corridor.skip",
                        },
                    ],
                },
            },
            {
                type: "setFlag",
                flag: "corridor.skip",
                value: false,
                condition: {
                    flag: "corridor.skip",
                },
            },
        ],
    },
    {
        id: "camera-test",
        entries: {
            "from-corridor": {
                col: 3,
                row: 4,
                facing: {
                    dc: 0,
                    dr: -1,
                },
            },
        },
        exits: [],
        tiles: {},
        entities: [
            {
                id: "mini-platform",
                active: true,
                col: 2,
                row: 2,
                spriteId: "camera-platform",
                collision: false,
                interaction: null,
            },
            {
                id: "figure",
                active: true,
                col: 5,
                row: 2,
                spriteId: "camera-figure",
                collision: false,
                interaction: null,
            },
            {
                id: "number",
                active: true,
                col: 6,
                row: 1,
                spriteId: "camera-number",
                collision: false,
                interaction: null,
            },
            {
                id: "return-screen",
                active: true,
                col: 4,
                row: 4,
                spriteId: "monitor-off",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "wrong-room",
                        },
                        {
                            type: "teleport",
                            mapId: "red-corridor",
                            entryId: "from-camera",
                            musicTransition: "replace",
                            musicTransitionMs: 100,
                        },
                    ],
                },
            },
        ],
        layers: {
            base: [
                [14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14],
            ],
            obstacles: [
                [13, 13, 13, 13, 13, 13, 13, 13],
                [13, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, 13],
                [13, 13, 13, 13, 13, 13, 13, 13],
            ],
        },
        editorGroup: "quiet-line",
        onEnter: [
            {
                type: "playSound",
                soundId: "wrong-room",
            },
        ],
        music: null,
    },
    {
        id: "signal-room",
        entries: {
            "from-corridor": {
                col: 2,
                row: 5,
                facing: {
                    dc: 1,
                    dr: 0,
                },
            },
        },
        exits: [],
        tiles: {},
        entities: [
            {
                id: "apparatus-red",
                active: true,
                col: 5,
                row: 2,
                spriteId: "signal-apparatus-red",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "showText",
                            pages: ["The signal is waiting for a colour."],
                            afterClose: [
                                {
                                    type: "addItem",
                                    itemId: "brass-tooth",
                                    quantity: 1,
                                },
                                {
                                    type: "playSound",
                                    soundId: "signal-release",
                                },
                                {
                                    type: "playMusicEffect",
                                    musicEffectId: "ticket-stinger",
                                    duckMusicTo: 0.15,
                                },
                                {
                                    type: "stopMusic",
                                    fadeOutMs: 0,
                                },
                            ],
                        },
                    ],
                },
                condition: {
                    notItem: "brass-tooth",
                },
            },
            {
                id: "apparatus-white",
                active: true,
                col: 5,
                row: 2,
                spriteId: "signal-apparatus-white",
                collision: true,
                interaction: null,
                condition: {
                    hasItem: "brass-tooth",
                },
            },
            {
                id: "tooth",
                active: true,
                col: 5,
                row: 5,
                spriteId: "brass-tooth",
                collision: false,
                interaction: null,
                condition: {
                    notItem: "brass-tooth",
                },
            },
            {
                id: "return-door",
                active: true,
                col: 1,
                row: 5,
                spriteId: "gate-eye",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "service-hall",
                            entryId: "from-signal",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
            },
        ],
        layers: {
            base: [
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
                [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
            ],
            obstacles: [
                [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [10, -1, -1, -1, -1, -1, -1, -1, -1, 10],
                [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
            ],
        },
        editorGroup: "quiet-line",
        music: {
            trackId: "service",
            continuityId: "service-branch",
            restart: "if-different",
        },
        onEnter: [
            {
                type: "stopMusic",
                fadeOutMs: 0,
                condition: {
                    hasItem: "brass-tooth",
                },
            },
        ],
    },
    {
        id: "stationary-train",
        entries: {
            "from-platform": {
                col: 1,
                row: 4,
                facing: {
                    dc: 1,
                    dr: 0,
                },
            },
        },
        exits: [],
        tiles: {},
        entities: [
            {
                id: "passenger-chair",
                active: true,
                col: 2,
                row: 3,
                spriteId: "passenger-chair",
                collision: false,
                interaction: null,
            },
            {
                id: "passenger-tree",
                active: true,
                col: 5,
                row: 3,
                spriteId: "passenger-tree",
                collision: false,
                interaction: null,
            },
            {
                id: "passenger-signal",
                active: true,
                col: 8,
                row: 4,
                spriteId: "passenger-signal",
                collision: false,
                interaction: null,
            },
            {
                id: "reflection-fixed-normal",
                active: true,
                col: 3,
                row: 1,
                spriteId: "reflection-normal",
                collision: false,
                interaction: null,
            },
            {
                id: "reflection-fixed-back",
                active: true,
                col: 6,
                row: 1,
                spriteId: "reflection-backward",
                collision: false,
                interaction: null,
            },
            {
                id: "reflection-random",
                active: true,
                col: 9,
                row: 1,
                spriteId: "reflection-missing",
                collision: false,
                interaction: null,
            },
            {
                id: "empty-seat",
                active: true,
                col: 11,
                row: 4,
                spriteId: "empty-seat",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "playSound",
                            soundId: "gate",
                        },
                        {
                            type: "teleport",
                            mapId: "final-carriage",
                            entryId: "from-train",
                            musicTransition: "crossfade",
                            musicTransitionMs: 450,
                        },
                    ],
                },
            },
        ],
        layers: {
            base: [
                [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
                [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
                [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
                [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
                [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
                [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
                [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
            ],
            obstacles: [
                [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],
                [13, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 13],
                [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],
            ],
        },
        editorGroup: "quiet-line",
        music: {
            trackId: "train",
            continuityId: "finale",
            restart: "if-different",
            crossfadeMs: 700,
        },
        onEnter: [
            {
                type: "playMusicEffect",
                musicEffectId: "train-stinger",
                duckMusicTo: 0.15,
                condition: {
                    notFlag: "train.entered",
                },
            },
            {
                type: "setFlag",
                flag: "train.entered",
                value: true,
                condition: {
                    notFlag: "train.entered",
                },
            },
            {
                type: "random",
                id: "window-reflection",
                scope: "save",
                choices: [
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setEntitySprite",
                                entityId: "reflection-random",
                                spriteId: "reflection-normal",
                            },
                        ],
                    },
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setEntitySprite",
                                entityId: "reflection-random",
                                spriteId: "reflection-backward",
                            },
                        ],
                    },
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setEntitySprite",
                                entityId: "reflection-random",
                                spriteId: "reflection-missing",
                            },
                        ],
                    },
                    {
                        weight: 1,
                        effects: [
                            {
                                type: "setEntitySprite",
                                entityId: "reflection-random",
                                spriteId: "reflection-attendant",
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "final-carriage",
        entries: {
            "from-train": {
                col: 5,
                row: 6,
                facing: {
                    dc: 0,
                    dr: -1,
                },
            },
        },
        exits: [],
        tiles: {},
        entities: [
            {
                id: "final-timetable",
                active: true,
                col: 5,
                row: 2,
                spriteId: "final-timetable",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
                    effects: [
                        {
                            type: "showText",
                            pages: ["There are no delays.", "THE QUIET LINE"],
                            afterClose: [
                                {
                                    type: "playMusicEffect",
                                    musicEffectId: "final-stinger",
                                },
                                {
                                    type: "playSound",
                                    soundId: "final",
                                },
                                {
                                    type: "setFlag",
                                    flag: "demo.complete",
                                    value: true,
                                },
                            ],
                        },
                    ],
                },
            },
        ],
        layers: {
            base: [
                [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
                [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
            ],
            obstacles: [
                [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],
                [13, -1, -1, -1, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, -1, -1, -1, 13],
                [13, -1, -1, -1, -1, -1, -1, -1, -1, -1, 13],
                [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],
            ],
        },
        editorGroup: "quiet-line",
        music: null,
    },
];
