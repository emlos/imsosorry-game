// Generated map data. Edit through editor/editor.html.
export const MAPS = [
    {
        id: "room-start",
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
        tiles: {},
        entities: [],
        layers: {
            base: [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            ],
            obstacles: [
                [-1, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
                [-1, -1, -1, 3, -1, -1, -1, -1, -1, 2],
                [-1, -1, -1, -1, -1, -1, 2, -1, -1, 2],
                [-1, -1, 2, -1, -1, -1, 2, -1, -1, 2],
                [2, -1, -1, -1, -1, -1, -1, -1, -1, 2],
            ],
        },
        editorGroup: "demo01",
        music: {
            // trackId: "home",
            // fadeInMs: 800,
            // restart: "if-different",
        },
    },
    // {
    //     id: "room-start",
    //     initialEntryId: "start",
    //     entries: {
    //         start: {
    //             col: 1,
    //             row: 1,
    //             facing: {
    //                 dc: 0,
    //                 dr: 1,
    //             },
    //         },
    //         fromRoom02: {
    //             col: 5,
    //             row: 1,
    //             facing: {
    //                 dc: 0,
    //                 dr: -1,
    //             },
    //         },
    //         fromRoom04: {
    //             col: 8,
    //             row: 5,
    //             facing: {
    //                 dc: 1,
    //                 dr: 0,
    //             },
    //         },
    //         fromMusicLab: {
    //             col: 1,
    //             row: 3,
    //             facing: {
    //                 dc: 0,
    //                 dr: 1,
    //             },
    //         },
    //     },
    //     exits: [
    //         {
    //             edge: "west",
    //             range: [1, 4],
    //             targetMapId: "room-entity-ownership-test",
    //             targetEdge: "east",
    //             preserveAxis: true,
    //             offset: 0,
    //         },
    //         {
    //             edge: "south",
    //             range: [1, 8],
    //             targetMapId: "room-transition-editor-test",
    //             targetEdge: "north",
    //             preserveAxis: true,
    //             offset: 0,
    //         },
    //     ],
    //     tiles: {},
    //     entities: [
    //         {
    //             id: "pink-orb",
    //             active: true,
    //             col: 4,
    //             row: 3,
    //             spriteId: "pink-orb",
    //             collision: false,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action", "touch"],
    //                 effects: [
    //                     {
    //                         type: "addItem",
    //                         itemId: "pink-orb",
    //                         quantity: 1,
    //                     },
    //                     {
    //                         type: "playSound",
    //                         soundId: "orb-collect",
    //                     },
    //                 ],
    //                 message: "You found the pink orb.",
    //             },
    //             condition: {
    //                 notItem: "pink-orb",
    //             },
    //         },
    //         {
    //             id: "north-door",
    //             active: true,
    //             col: 5,
    //             row: 0,
    //             spriteId: "door",
    //             collision: false,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-intermediate-savepoint",
    //                     entryId: "fromRoom01",
    //                 },
    //                 message: "The door opens.",
    //             },
    //         },
    //         {
    //             id: "east-door",
    //             active: true,
    //             col: 9,
    //             row: 5,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-conditional-entity-test",
    //                     entryId: "fromRoom01",
    //                 },
    //                 message: "The side door opens.",
    //             },
    //         },
    //         {
    //             id: "music-lab-door",
    //             active: true,
    //             col: 1,
    //             row: 4,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-music-grove-west",
    //                     entryId: "fromMain",
    //                 },
    //                 message: "A soft chord sounds behind the door.",
    //             },
    //         },
    //     ],
    //     layers: {
    //         base: [
    //             [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //         ],
    //         obstacles: [
    //             [-1, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [-1, -1, -1, 3, -1, -1, -1, -1, -1, 2],
    //             [-1, -1, -1, -1, -1, -1, 2, -1, -1, 2],
    //             [-1, -1, 2, -1, -1, -1, 2, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //         ],
    //     },
    //     editorGroup: "test",
    //     music: {
    //         trackId: "home",
    //         fadeInMs: 800,
    //         restart: "if-different",
    //     },
    // },
    // {
    //     id: "room-intermediate-savepoint",
    //     entries: {
    //         fromRoom01: {
    //             col: 2,
    //             row: 5,
    //             facing: {
    //                 dc: -1,
    //                 dr: 0,
    //             },
    //         },
    //         fromRoom03: {
    //             col: 3,
    //             row: 1,
    //             facing: {
    //                 dc: 0,
    //                 dr: -1,
    //             },
    //         },
    //     },
    //     exits: [],
    //     tiles: {},
    //     entities: [
    //         {
    //             id: "save-point",
    //             active: true,
    //             col: 1,
    //             row: 3,
    //             spriteId: "save-point",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         speaker: "Save Point",
    //                         pages: [
    //                             "A small light holds perfectly still inside the glass.",
    //                             "For a moment, the shape of the dream becomes easy to remember.",
    //                         ],
    //                         afterClose: [
    //                             {
    //                                 type: "playMusicEffect",
    //                                 musicEffectId: "save-complete",
    //                                 duckMusicTo: 0.2,
    //                             },
    //                             {
    //                                 type: "saveGame",
    //                             },
    //                         ],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "south-door",
    //             active: true,
    //             col: 1,
    //             row: 5,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-start",
    //                     entryId: "fromRoom02",
    //                 },
    //                 message: "You return through the door.",
    //             },
    //         },
    //         {
    //             id: "north-door",
    //             active: true,
    //             col: 3,
    //             row: 0,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-wall-interaction-test",
    //                     entryId: "fromRoom02",
    //                 },
    //                 message: "The door opens into another room.",
    //             },
    //         },
    //     ],
    //     layers: {
    //         base: [
    //             [1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1],
    //         ],
    //         obstacles: [
    //             [2, 2, 2, 2, 2, 2, 2],
    //             [2, -1, -1, -1, -1, -1, 2],
    //             [2, -1, 2, -1, 2, -1, 2],
    //             [2, -1, -1, -1, -1, -1, 2],
    //             [2, -1, 2, -1, 2, -1, 2],
    //             [2, -1, -1, -1, -1, -1, 2],
    //             [2, 2, 2, 2, 2, 2, 2],
    //         ],
    //     },
    //     editorGroup: "test",
    //     music: null,
    //     musicTransitionMs: 800,
    // },
    // {
    //     id: "room-wall-interaction-test",
    //     entries: {
    //         fromRoom02: {
    //             col: 2,
    //             row: 5,
    //             facing: {
    //                 dc: 0,
    //                 dr: 1,
    //             },
    //         },
    //         fromRoom06: {
    //             col: 7,
    //             row: 1,
    //             facing: {
    //                 dc: 0,
    //                 dr: 1,
    //             },
    //         },
    //     },
    //     exits: [],
    //     tiles: {
    //         100: {
    //             path: "./assets/atlases/world.png",
    //             source: [444, 68, 32, 32],
    //             condition: {
    //                 notFlag: "room03.orbCollected",
    //             },
    //         },
    //     },
    //     entities: [
    //         {
    //             id: "blue-orb",
    //             active: true,
    //             col: 2,
    //             row: 2,
    //             spriteId: "blue-orb",
    //             collision: false,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action", "touch"],
    //                 effects: [
    //                     {
    //                         type: "setFlag",
    //                         flag: "room03.orbCollected",
    //                         value: true,
    //                     },
    //                     {
    //                         type: "playSound",
    //                         soundId: "orb-collect",
    //                     },
    //                 ],
    //                 message: "The blue orb dissolves. A section of the wall disappears.",
    //             },
    //             condition: {
    //                 notFlag: "room03.orbCollected",
    //             },
    //         },
    //         {
    //             id: "south-door",
    //             active: true,
    //             col: 2,
    //             row: 6,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-intermediate-savepoint",
    //                     entryId: "fromRoom03",
    //                 },
    //                 message: "You return to the previous room.",
    //             },
    //         },
    //         {
    //             id: "forest-door",
    //             active: true,
    //             col: 7,
    //             row: 0,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-layer-entity-forest-test",
    //                     entryId: "fromRoom03",
    //                 },
    //                 message: "The door opens onto a small forest clearing.",
    //             },
    //         },
    //     ],
    //     layers: {
    //         base: [
    //             [0, 0, 0, 0, 0, 0, 0, 0, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 0, 0, 0, 0, 0, 0, 0, 0],
    //         ],
    //         obstacles: [
    //             [2, 2, 2, 2, 2, 2, 2, 2, 2],
    //             [2, -1, -1, -1, 2, -1, -1, -1, 2],
    //             [2, -1, -1, -1, 2, -1, -1, -1, 2],
    //             [2, -1, -1, -1, 100, -1, -1, -1, 2],
    //             [2, -1, -1, -1, 2, -1, -1, -1, 2],
    //             [2, -1, -1, -1, 2, -1, -1, -1, 2],
    //             [2, 2, 2, 2, 2, 2, 2, 2, 2],
    //         ],
    //     },
    //     editorGroup: "test",
    // },
    // {
    //     id: "room-conditional-entity-test",
    //     entries: {
    //         fromRoom01: {
    //             col: 1,
    //             row: 3,
    //             facing: {
    //                 dc: 1,
    //                 dr: 0,
    //             },
    //         },
    //         fromPinkOrb: {
    //             col: 4,
    //             row: 5,
    //             facing: {
    //                 dc: 0,
    //                 dr: -1,
    //             },
    //         },
    //     },
    //     exits: [],
    //     tiles: {},
    //     entities: [
    //         {
    //             id: "west-door",
    //             active: true,
    //             col: 0,
    //             row: 3,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-start",
    //                     entryId: "fromRoom04",
    //                 },
    //                 message: "You return to the main room.",
    //             },
    //         },
    //         {
    //             id: "receiver",
    //             active: true,
    //             col: 4,
    //             row: 2,
    //             spriteId: "receiver",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "playSound",
    //                         soundId: "receiver-chime",
    //                     },
    //                     {
    //                         type: "showText",
    //                         speaker: "Receiver",
    //                         pages: [
    //                             "The receiver wakes with a clear two-note chime.",
    //                             "A voice beneath the static says: The glass remembers who listened.",
    //                             "Then the signal cuts out.",
    //                         ],
    //                         afterClose: [
    //                             {
    //                                 type: "setFlag",
    //                                 flag: "room04.receiverUsed",
    //                                 value: true,
    //                             },
    //                         ],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "glass-figure",
    //             active: true,
    //             col: 6,
    //             row: 3,
    //             spriteId: "glass-figure",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         condition: {
    //                             notFlag: "room04.receiverUsed",
    //                         },
    //                         speaker: "Glass Figure",
    //                         pages: [
    //                             "The glass figure is cold and perfectly still.",
    //                             "Its blank face is turned away from the receiver.",
    //                         ],
    //                     },
    //                     {
    //                         type: "showText",
    //                         condition: {
    //                             flag: "room04.receiverUsed",
    //                             equals: true,
    //                         },
    //                         speaker: "Glass Figure",
    //                         pages: [
    //                             "A faint vibration runs through the glass.",
    //                             "Its face is now angled toward the receiver.",
    //                             "There is no seam showing how it moved.",
    //                         ],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "animatedSavePoint",
    //             active: true,
    //             spriteId: "animated-save-point",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         speaker: "Save Point",
    //                         pages: [
    //                             "This save point seems different then the others....",
    //                             "....or possibly not. who knows?",
    //                         ],
    //                         afterClose: [
    //                             {
    //                                 type: "saveGame",
    //                             },
    //                         ],
    //                     },
    //                 ],
    //             },
    //             col: 1,
    //             row: 5,
    //         },
    //     ],
    //     layers: {
    //         base: [
    //             [1, 1, 1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1, 1, 1],
    //             [1, 1, 1, 1, 1, 1, 1, 1, 1],
    //         ],
    //         obstacles: [
    //             [2, 2, 2, 2, 2, 2, 2, 2, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, 2, -1, -1, -1, 2, -1, 2],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, 2, -1, -1, -1, 2, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, 2, 2, 2, 2, 2, 2, 2, 2],
    //         ],
    //     },
    //     editorGroup: "test",
    // },
    // {
    //     id: "room-entity-ownership-test",
    //     entries: {},
    //     exits: [
    //         {
    //             edge: "east",
    //             range: [1, 4],
    //             targetMapId: "room-start",
    //             targetEdge: "west",
    //             preserveAxis: true,
    //             offset: 0,
    //         },
    //     ],
    //     tiles: {},
    //     entities: [
    //         {
    //             id: "save-point",
    //             active: true,
    //             col: 1,
    //             row: 3,
    //             spriteId: "save-point",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         speaker: "Save Point",
    //                         pages: [
    //                             "A small light holds perfectly still inside the glass.",
    //                             "For a moment, the shape of the dream becomes easy to remember.",
    //                         ],
    //                         afterClose: [
    //                             {
    //                                 type: "saveGame",
    //                             },
    //                         ],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "permanent-collectible",
    //             active: true,
    //             col: 2,
    //             row: 1,
    //             spriteId: "blue-orb",
    //             collision: false,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action", "touch"],
    //                 effects: [
    //                     {
    //                         type: "setFlag",
    //                         flag: "room05.permanentCollected",
    //                         value: true,
    //                     },
    //                     {
    //                         type: "playSound",
    //                         soundId: "orb-collect",
    //                     },
    //                 ],
    //                 message: "The permanent collectible is recorded by its flag.",
    //             },
    //             condition: {
    //                 notFlag: "room05.permanentCollected",
    //             },
    //         },
    //         {
    //             id: "possession-collectible",
    //             active: true,
    //             col: 4,
    //             row: 2,
    //             spriteId: "pink-orb",
    //             collision: false,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action", "touch"],
    //                 effects: [
    //                     {
    //                         type: "addItem",
    //                         itemId: "room05-possession-collectible",
    //                         quantity: 1,
    //                     },
    //                     {
    //                         type: "playSound",
    //                         soundId: "orb-collect",
    //                     },
    //                 ],
    //                 message: "The possession collectible enters your inventory.",
    //             },
    //             condition: {
    //                 notItem: "room05-possession-collectible",
    //             },
    //         },
    //         {
    //             id: "spawned-collectible",
    //             active: true,
    //             col: 6,
    //             row: 4,
    //             spriteId: "blue-orb",
    //             collision: false,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action", "touch"],
    //                 effects: [
    //                     {
    //                         type: "setEntityActive",
    //                         entityId: "spawned-collectible",
    //                         active: false,
    //                     },
    //                     {
    //                         type: "playSound",
    //                         soundId: "orb-collect",
    //                     },
    //                 ],
    //                 message: "The independent spawned collectible disappears.",
    //             },
    //         },
    //     ],
    //     layers: {
    //         base: [
    //             [0, 0, 0, 0, 0, 0, 0, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 0, 0, 0, 0, 0, 0, 0],
    //         ],
    //         obstacles: [
    //             [2, 2, 2, 2, 2, 2, 2, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1],
    //             [2, -1, -1, 2, -1, -1, -1, -1],
    //             [2, -1, -1, -1, -1, 2, -1, -1],
    //             [2, -1, 2, -1, -1, -1, -1, -1],
    //             [2, 2, 2, 2, 2, 2, 2, 2],
    //         ],
    //     },
    //     editorGroup: "test",
    // },
    // {
    //     id: "room-layer-entity-forest-test",
    //     entries: {
    //         fromRoom03: {
    //             col: 5,
    //             row: 7,
    //             facing: {
    //                 dc: 0,
    //                 dr: -1,
    //             },
    //         },
    //         fromAnimationTest: {
    //             col: 5,
    //             row: 1,
    //             facing: {
    //                 dc: 0,
    //                 dr: 1,
    //             },
    //         },
    //     },
    //     exits: [],
    //     tiles: {},
    //     entities: [
    //         {
    //             id: "south-door",
    //             active: true,
    //             col: 5,
    //             row: 8,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-wall-interaction-test",
    //                     entryId: "fromRoom06",
    //                 },
    //                 message: "You leave the clearing.",
    //             },
    //         },
    //         {
    //             id: "north-door",
    //             active: true,
    //             col: 5,
    //             row: 0,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-animation-test",
    //                     entryId: "fromRoom06",
    //                 },
    //                 message: "The door opens into a room of moving lights.",
    //             },
    //         },
    //     ],
    //     layers: {
    //         base: [
    //             [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //         ],
    //         obstacles: [
    //             [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, -1, 4, -1, -1, -1, 4, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, -1, -1, -1, 4, -1, -1, -1, -1, 2],
    //             [2, -1, -1, 4, -1, -1, -1, 4, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    //         ],
    //     },
    //     editorGroup: "test",
    // },
    // {
    //     id: "room-animation-test",
    //     entries: {
    //         fromRoom06: {
    //             col: 5,
    //             row: 8,
    //             facing: {
    //                 dc: 0,
    //                 dr: -1,
    //             },
    //         },
    //         fromAtlasTest: {
    //             col: 1,
    //             row: 8,
    //             facing: {
    //                 dc: 0,
    //                 dr: -1,
    //             },
    //         },
    //     },
    //     exits: [],
    //     tiles: {},
    //     entities: [
    //         {
    //             id: "south-door",
    //             active: true,
    //             col: 5,
    //             row: 9,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-layer-entity-forest-test",
    //                     entryId: "fromAnimationTest",
    //                 },
    //                 message: "You return to the forest clearing.",
    //             },
    //         },
    //         {
    //             id: "animated-save-point",
    //             active: true,
    //             col: 8,
    //             row: 2,
    //             spriteId: "animated-save-point",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         speaker: "Save Point",
    //                         pages: [
    //                             "A small light holds perfectly still inside the glass.",
    //                             "For a moment, the shape of the dream becomes easy to remember.",
    //                         ],
    //                         afterClose: [
    //                             {
    //                                 type: "saveGame",
    //                             },
    //                         ],
    //                     },
    //                 ],
    //             },
    //             condition: {
    //                 notFlag: "animationTest.hideSavePoint",
    //             },
    //         },
    //         {
    //             id: "static-receiver",
    //             active: true,
    //             col: 2,
    //             row: 2,
    //             spriteId: "receiver",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         speaker: "Receiver",
    //                         pages: ["The static image remains perfectly still."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "placeholder-example",
    //             active: true,
    //             col: 9,
    //             row: 7,
    //             spriteId: "placeholder",
    //             collision: false,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action", "touch"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["This is an explicitly selected placeholder sprite."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "inventory-token",
    //             active: true,
    //             col: 5,
    //             row: 7,
    //             spriteId: "blue-orb",
    //             collision: false,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action", "touch"],
    //                 effects: [
    //                     {
    //                         type: "addItem",
    //                         itemId: "animation-test-token",
    //                         quantity: 1,
    //                     },
    //                     {
    //                         type: "setEntityActive",
    //                         entityId: "inventory-token",
    //                         active: false,
    //                     },
    //                     {
    //                         type: "playSound",
    //                         soundId: "orb-collect",
    //                     },
    //                 ],
    //                 message: "The test token can now keep the inventory open.",
    //             },
    //         },
    //         {
    //             id: "atlas-test-door",
    //             active: true,
    //             col: 1,
    //             row: 9,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-atlas-test",
    //                     entryId: "fromAnimationTest",
    //                 },
    //                 message: "The door opens into the atlas test gallery.",
    //             },
    //         },
    //         {
    //             id: "glittering-crystal",
    //             active: true,
    //             col: 5,
    //             row: 4,
    //             spriteId: "glittering-crystal",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["Light moves through the crystal."],
    //                     },
    //                 ],
    //             },
    //         },
    //     ],
    //     layers: {
    //         base: [
    //             [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    //             [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //         ],
    //         obstacles: [
    //             [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, 2, -1, -1, -1, -1, -1, 4, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    //         ],
    //     },
    //     editorGroup: "test",
    // },
    // {
    //     id: "room-atlas-test",
    //     initialEntryId: "fromAnimationTest",
    //     entries: {
    //         fromAnimationTest: {
    //             col: 6,
    //             row: 8,
    //             facing: {
    //                 dc: 0,
    //                 dr: -1,
    //             },
    //         },
    //     },
    //     exits: [],
    //     tiles: {},
    //     entities: [
    //         {
    //             id: "return-door",
    //             active: true,
    //             col: 6,
    //             row: 9,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-animation-test",
    //                     entryId: "fromAtlasTest",
    //                 },
    //                 message: "You return to the animation test room.",
    //             },
    //         },
    //         {
    //             id: "forest-sign",
    //             active: true,
    //             col: 3,
    //             row: 4,
    //             spriteId: "forest-sign",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: [
    //                             "Atlas A occupies the upper half of this room.",
    //                             "Atlas B occupies the lower half.",
    //                         ],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "glowing-flower",
    //             active: true,
    //             col: 4,
    //             row: 4,
    //             spriteId: "glowing-flower",
    //             collision: false,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["The small flower is a static atlas-backed entity."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "stone-statue",
    //             active: true,
    //             col: 7,
    //             row: 4,
    //             spriteId: "stone-statue",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["The statue is 32×64 but occupies one logical cell."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "lantern",
    //             active: true,
    //             col: 10,
    //             row: 4,
    //             spriteId: "lantern",
    //             collision: false,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["The lantern continues animating while this dialogue is open."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "control-console",
    //             active: true,
    //             col: 2,
    //             row: 7,
    //             spriteId: "control-console",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["The console is a static region from Atlas B."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "violet-orb",
    //             active: true,
    //             col: 5,
    //             row: 7,
    //             spriteId: "violet-orb",
    //             collision: false,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["A violet orb used only as an atlas-backed sprite test."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "robed-figure",
    //             active: true,
    //             col: 7,
    //             row: 7,
    //             spriteId: "robed-figure",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["The robed figure is another 32×64 entity sprite."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "signal-beacon",
    //             active: true,
    //             col: 9,
    //             row: 7,
    //             spriteId: "signal-beacon",
    //             collision: false,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["The signal beacon blinks from a horizontal atlas strip."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "crystal-totem",
    //             active: true,
    //             col: 11,
    //             row: 3,
    //             spriteId: "crystal-totem",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["A cool shimmer passes through the crystal totem."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "arcane-vat",
    //             active: true,
    //             col: 2,
    //             row: 4,
    //             spriteId: "arcane-vat",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["The liquid bubbles with a soft glow."],
    //                     },
    //                 ],
    //             },
    //         },
    //     ],
    //     layers: {
    //         base: [
    //             [7, 7, 8, 8, 9, 9, 10, 10, 7, 7, 8, 8, 9, 9],
    //             [7, 8, 7, 8, 9, 10, 9, 10, 7, 8, 7, 8, 9, 10],
    //             [8, 8, 7, 7, 10, 10, 9, 9, 8, 8, 7, 7, 10, 10],
    //             [7, 7, 8, 8, 9, 9, 10, 10, 7, 7, 8, 8, 9, 9],
    //             [10, 9, 8, 7, 10, 9, 8, 7, 10, 9, 8, 7, 10, 9],
    //             [17, 17, 18, 18, 19, 19, 20, 20, 17, 17, 18, 18, 19, 19],
    //             [17, 18, 17, 18, 19, 20, 19, 20, 17, 18, 17, 18, 19, 20],
    //             [18, 18, 17, 17, 20, 20, 19, 19, 18, 18, 17, 17, 20, 20],
    //             [17, 17, 18, 18, 19, 19, 20, 20, 17, 17, 18, 18, 19, 19],
    //             [20, 19, 18, 17, 20, 19, 18, 17, 20, 19, 18, 17, 20, 19],
    //         ],
    //         obstacles: [
    //             [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, 13, -1, -1, -1, -1, -1, 15, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, 14, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 12, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, 21, -1, 22, -1, 23, -1, -1, 24, 25, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, 11, 11, 11, 11, 11, -1, 11, 11, 11, 11, 11, 11, 11],
    //         ],
    //     },
    //     editorGroup: "test",
    // },
    // {
    //     id: "room-transition-editor-test",
    //     initialEntryId: "start",
    //     entries: {
    //         start: {
    //             col: 1,
    //             row: 1,
    //             facing: {
    //                 dc: 0,
    //                 dr: 1,
    //             },
    //         },
    //     },
    //     exits: [
    //         {
    //             edge: "north",
    //             range: [1, 8],
    //             targetMapId: "room-start",
    //             targetEdge: "south",
    //             preserveAxis: true,
    //             offset: 0,
    //         },
    //         {
    //             edge: "south",
    //             range: [2, 8],
    //             targetMapId: "room-editor-edgetest",
    //             targetEdge: "north",
    //             preserveAxis: true,
    //             offset: 0,
    //         },
    //     ],
    //     tiles: {},
    //     entities: [
    //         {
    //             id: "animatedSavePoint",
    //             active: true,
    //             spriteId: "animated-save-point",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         speaker: "Save Point",
    //                         pages: [
    //                             "A small light holds perfectly still inside the glass.",
    //                             "For a moment, the shape of the dream becomes easy to remember.",
    //                         ],
    //                         afterClose: [
    //                             {
    //                                 type: "saveGame",
    //                             },
    //                         ],
    //                     },
    //                 ],
    //             },
    //             col: 5,
    //             row: 4,
    //         },
    //         {
    //             id: "crystal-totem",
    //             active: true,
    //             col: 1,
    //             row: 6,
    //             spriteId: "crystal-totem",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["A cool shimmer passes through the crystal totem."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "crystal-totem-2",
    //             active: true,
    //             col: 7,
    //             row: 6,
    //             spriteId: "crystal-totem",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         pages: ["A cool shimmer passes through the crystal totem."],
    //                     },
    //                 ],
    //             },
    //         },
    //     ],
    //     layers: {
    //         base: [
    //             [9, 20, 20, 20, 20, 20, 20, 20, 9, 9],
    //             [9, 20, 20, 20, 20, 20, 20, 20, 9, 9],
    //             [9, 20, 20, 20, 20, 20, 20, 20, 9, 9],
    //             [9, 20, 20, 20, 20, 20, 20, 20, 9, 9],
    //             [9, 20, 20, 20, 20, 20, 20, 20, 9, 9],
    //             [9, 20, 20, 20, 20, 20, 20, 20, 9, 9],
    //             [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //             [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //         ],
    //         obstacles: [
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, 24, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, 24, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, 24, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //         ],
    //     },
    //     editorGroup: "test",
    // },
    // {
    //     id: "room-editor-edgetest",
    //     initialEntryId: "start",
    //     entries: {
    //         start: {
    //             col: 1,
    //             row: 1,
    //             facing: {
    //                 dc: 0,
    //                 dr: 1,
    //             },
    //         },
    //     },
    //     exits: [
    //         {
    //             edge: "north",
    //             range: [1, 8],
    //             targetMapId: "room-transition-editor-test",
    //             targetEdge: "south",
    //             preserveAxis: true,
    //             offset: 0,
    //         },
    //     ],
    //     tiles: {},
    //     entities: [],
    //     layers: {
    //         base: [
    //             [0, 9, 8, 20, 20, 20, 20, 8, 17, 0],
    //             [0, 9, 0, 8, 20, 20, 8, 17, 9, 0],
    //             [0, 9, 17, 17, 8, 8, 17, 0, 9, 0],
    //             [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    //             [-1, -1, 0, 0, 0, 0, 0, 0, -1, -1],
    //         ],
    //         obstacles: [
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [2, -1, -1, -1, -1, -1, -1, -1, -1, 2],
    //             [3, -1, -1, -1, -1, -1, -1, -1, 3, -1],
    //             [-1, -1, 2, 2, 2, 2, 2, 2, -1, -1],
    //         ],
    //     },
    //     editorGroup: "test",
    // },
    // {
    //     id: "room-music-grove-west",
    //     initialEntryId: "fromMain",
    //     entries: {
    //         fromMain: {
    //             col: 2,
    //             row: 3,
    //             facing: {
    //                 dc: 1,
    //                 dr: 0,
    //             },
    //         },
    //         fromEast: {
    //             col: 7,
    //             row: 3,
    //             facing: {
    //                 dc: -1,
    //                 dr: 0,
    //             },
    //         },
    //     },
    //     exits: [],
    //     tiles: {},
    //     entities: [
    //         {
    //             id: "main-door",
    //             active: true,
    //             col: 1,
    //             row: 3,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-start",
    //                     entryId: "fromMusicLab",
    //                 },
    //                 message: "The bedroom waits beyond.",
    //             },
    //         },
    //         {
    //             id: "east-door",
    //             active: true,
    //             col: 8,
    //             row: 3,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-music-grove-east",
    //                     entryId: "fromWest",
    //                 },
    //                 message: "The same melody continues east.",
    //             },
    //         },
    //         {
    //             id: "continuity-sign",
    //             active: true,
    //             col: 4,
    //             row: 2,
    //             spriteId: "forest-sign",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "showText",
    //                         speaker: "Music test",
    //                         pages: [
    //                             "Both grove rooms use the forest track and the same continuity group.",
    //                             "Crossing between them should preserve the exact playback position.",
    //                         ],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "grove-flower",
    //             active: true,
    //             col: 6,
    //             row: 4,
    //             spriteId: "glowing-flower",
    //             collision: false,
    //             interaction: null,
    //         },
    //     ],
    //     music: {
    //         trackId: "forest",
    //         continuityId: "music-grove",
    //         fadeInMs: 650,
    //         restart: "if-different",
    //     },
    //     layers: {
    //         base: [
    //             [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    //             [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    //             [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    //             [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    //             [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    //             [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    //             [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
    //         ],
    //         obstacles: [
    //             [11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    //         ],
    //         foreground: [
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //         ],
    //     },
    // },
    // {
    //     id: "room-music-grove-east",
    //     initialEntryId: "fromWest",
    //     entries: {
    //         fromWest: {
    //             col: 2,
    //             row: 3,
    //             facing: {
    //                 dc: 1,
    //                 dr: 0,
    //             },
    //         },
    //         fromShrine: {
    //             col: 7,
    //             row: 3,
    //             facing: {
    //                 dc: -1,
    //                 dr: 0,
    //             },
    //         },
    //     },
    //     exits: [],
    //     tiles: {},
    //     entities: [
    //         {
    //             id: "west-door",
    //             active: true,
    //             col: 1,
    //             row: 3,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-music-grove-west",
    //                     entryId: "fromEast",
    //                 },
    //                 message: "The western grove remains in time.",
    //             },
    //         },
    //         {
    //             id: "shrine-door",
    //             active: true,
    //             col: 8,
    //             row: 3,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-music-shrine",
    //                     entryId: "fromGrove",
    //                 },
    //                 message: "A different rhythm leaks through.",
    //             },
    //         },
    //         {
    //             id: "rate-console",
    //             active: true,
    //             col: 4,
    //             row: 3,
    //             spriteId: "control-console",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "toggleFlag",
    //                         flag: "music.slowed",
    //                     },
    //                     {
    //                         type: "showText",
    //                         condition: {
    //                             flag: "music.slowed",
    //                         },
    //                         speaker: "Console",
    //                         pages: ["The forest recording slows and dims without changing files."],
    //                     },
    //                     {
    //                         type: "showText",
    //                         condition: {
    //                             notFlag: "music.slowed",
    //                         },
    //                         speaker: "Console",
    //                         pages: ["The forest recording returns to its normal rate and volume."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "grove-lantern",
    //             active: true,
    //             col: 6,
    //             row: 2,
    //             spriteId: "lantern",
    //             collision: true,
    //             interaction: null,
    //         },
    //     ],
    //     music: [
    //         {
    //             condition: {
    //                 flag: "music.slowed",
    //             },
    //             volume: 0.48,
    //             playbackRate: 0.72,
    //         },
    //         {
    //             trackId: "forest",
    //             continuityId: "music-grove",
    //             fadeInMs: 650,
    //             restart: "if-different",
    //         },
    //     ],
    //     layers: {
    //         base: [
    //             [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    //             [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    //             [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    //             [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    //             [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    //             [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    //             [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    //         ],
    //         obstacles: [
    //             [11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    //         ],
    //         foreground: [
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //         ],
    //     },
    // },
    // {
    //     id: "room-music-shrine",
    //     initialEntryId: "fromGrove",
    //     entries: {
    //         fromGrove: {
    //             col: 2,
    //             row: 3,
    //             facing: {
    //                 dc: 1,
    //                 dr: 0,
    //             },
    //         },
    //     },
    //     exits: [],
    //     tiles: {},
    //     entities: [
    //         {
    //             id: "grove-door",
    //             active: true,
    //             col: 1,
    //             row: 3,
    //             spriteId: "door",
    //             collision: true,
    //             interaction: {
    //                 handler: "teleport",
    //                 triggers: ["action"],
    //                 params: {
    //                     mapId: "room-music-grove-east",
    //                     entryId: "fromShrine",
    //                 },
    //                 message: "The forest waits outside.",
    //             },
    //         },
    //         {
    //             id: "push-crystal",
    //             active: true,
    //             col: 4,
    //             row: 2,
    //             spriteId: "glittering-crystal",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "pushMusic",
    //                         trackId: "strange-room",
    //                         crossfadeMs: 700,
    //                         restart: "always",
    //                     },
    //                     {
    //                         type: "showText",
    //                         speaker: "Crystal",
    //                         pages: [
    //                             "The shrine music is stored, then replaced by a temporary track.",
    //                         ],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "pop-totem",
    //             active: true,
    //             col: 6,
    //             row: 2,
    //             spriteId: "crystal-totem",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "popMusic",
    //                         crossfadeMs: 700,
    //                     },
    //                     {
    //                         type: "showText",
    //                         speaker: "Totem",
    //                         pages: [
    //                             "The previously stored music state returns at its old position.",
    //                         ],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "stinger-receiver",
    //             active: true,
    //             col: 4,
    //             row: 4,
    //             spriteId: "receiver",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "playMusicEffect",
    //                         musicEffectId: "save-complete",
    //                         duckMusicTo: 0.22,
    //                     },
    //                     {
    //                         type: "showText",
    //                         speaker: "Receiver",
    //                         pages: [
    //                             "A short music effect ducks the background track, then releases it.",
    //                         ],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "silence-console",
    //             active: true,
    //             col: 6,
    //             row: 4,
    //             spriteId: "control-console",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "stopMusic",
    //                         fadeOutMs: 900,
    //                     },
    //                     {
    //                         type: "showText",
    //                         speaker: "Console",
    //                         pages: ["The current background track fades to explicit silence."],
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "resume-beacon",
    //             active: true,
    //             col: 7,
    //             row: 4,
    //             spriteId: "signal-beacon",
    //             collision: true,
    //             interaction: {
    //                 handler: "effects",
    //                 triggers: ["action"],
    //                 effects: [
    //                     {
    //                         type: "playMusic",
    //                         trackId: "shrine",
    //                         resume: true,
    //                         fadeInMs: 700,
    //                     },
    //                     {
    //                         type: "showText",
    //                         speaker: "Beacon",
    //                         pages: ["The shrine track resumes from its remembered position."],
    //                     },
    //                 ],
    //             },
    //         },
    //     ],
    //     music: {
    //         trackId: "shrine",
    //         restart: "if-different",
    //     },
    //     musicTransition: "crossfade",
    //     musicTransitionMs: 900,
    //     musicEvents: [
    //         {
    //             id: "first-discovery-cue",
    //             frequency: "once-per-save",
    //             entryId: "fromGrove",
    //             effects: [
    //                 {
    //                     type: "playMusicEffect",
    //                     musicEffectId: "discovery",
    //                     duckMusicTo: 0.18,
    //                 },
    //             ],
    //         },
    //     ],
    //     layers: {
    //         base: [
    //             [17, 17, 17, 17, 17, 17, 17, 17, 17, 17],
    //             [17, 17, 17, 17, 17, 17, 17, 17, 17, 17],
    //             [17, 17, 17, 17, 17, 17, 17, 17, 17, 17],
    //             [17, 17, 17, 17, 17, 17, 17, 17, 17, 17],
    //             [17, 17, 17, 17, 17, 17, 17, 17, 17, 17],
    //             [17, 17, 17, 17, 17, 17, 17, 17, 17, 17],
    //             [17, 17, 17, 17, 17, 17, 17, 17, 17, 17],
    //         ],
    //         obstacles: [
    //             [11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, -1, -1, -1, -1, -1, -1, -1, -1, 11],
    //             [11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    //         ],
    //         foreground: [
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //             [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    //         ],
    //     },
    // },
];
