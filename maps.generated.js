// Generated map data. Edit through editor/editor.html.
export const MAPS = [
    {
        "id": "room-start",
        "initialEntryId": "start",
        "entries": {
            "start": {
                "col": 1,
                "row": 1,
                "facing": {
                    "dc": 0,
                    "dr": 1
                }
            },
            "fromRoom02": {
                "col": 5,
                "row": 1,
                "facing": {
                    "dc": 0,
                    "dr": -1
                }
            },
            "fromRoom04": {
                "col": 8,
                "row": 5,
                "facing": {
                    "dc": 1,
                    "dr": 0
                }
            }
        },
        "exits": [
            {
                "edge": "west",
                "range": [
                    1,
                    4
                ],
                "targetMapId": "room-entity-ownership-test",
                "targetEdge": "east",
                "preserveAxis": true,
                "offset": 0
            },
            {
                "edge": "south",
                "range": [
                    1,
                    8
                ],
                "targetMapId": "room-transition-editor-test",
                "targetEdge": "north",
                "preserveAxis": true,
                "offset": 0
            }
        ],
        "tiles": {},
        "entities": [
            {
                "id": "pink-orb",
                "active": true,
                "col": 4,
                "row": 3,
                "spriteId": "pink-orb",
                "collision": false,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action",
                        "touch"
                    ],
                    "effects": [
                        {
                            "type": "addItem",
                            "itemId": "pink-orb",
                            "quantity": 1
                        },
                        {
                            "type": "playSound",
                            "soundId": "orb-collect"
                        }
                    ],
                    "message": "You found the pink orb."
                },
                "condition": {
                    "notItem": "pink-orb"
                }
            },
            {
                "id": "north-door",
                "active": true,
                "col": 5,
                "row": 0,
                "spriteId": "door",
                "collision": false,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-intermediate-savepoint",
                        "entryId": "fromRoom01"
                    },
                    "message": "The door opens."
                }
            },
            {
                "id": "east-door",
                "active": true,
                "col": 9,
                "row": 5,
                "spriteId": "door",
                "collision": true,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-conditional-entity-test",
                        "entryId": "fromRoom01"
                    },
                    "message": "The side door opens."
                }
            }
        ],
        "layers": {
            "base": [
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ]
            ],
            "obstacles": [
                [
                    -1,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ],
                [
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    -1,
                    -1,
                    -1,
                    3,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2,
                    -1,
                    -1,
                    2
                ],
                [
                    -1,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    2,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ]
            ]
        },
        "editorGroup": "test"
    },
    {
        "id": "room-intermediate-savepoint",
        "entries": {
            "fromRoom01": {
                "col": 2,
                "row": 5,
                "facing": {
                    "dc": -1,
                    "dr": 0
                }
            },
            "fromRoom03": {
                "col": 3,
                "row": 1,
                "facing": {
                    "dc": 0,
                    "dr": -1
                }
            }
        },
        "exits": [],
        "tiles": {},
        "entities": [
            {
                "id": "save-point",
                "active": true,
                "col": 1,
                "row": 3,
                "spriteId": "save-point",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "speaker": "Save Point",
                            "pages": [
                                "A small light holds perfectly still inside the glass.",
                                "For a moment, the shape of the dream becomes easy to remember."
                            ],
                            "afterClose": [
                                {
                                    "type": "saveGame"
                                }
                            ]
                        }
                    ]
                }
            },
            {
                "id": "south-door",
                "active": true,
                "col": 1,
                "row": 5,
                "spriteId": "door",
                "collision": true,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-start",
                        "entryId": "fromRoom02"
                    },
                    "message": "You return through the door."
                }
            },
            {
                "id": "north-door",
                "active": true,
                "col": 3,
                "row": 0,
                "spriteId": "door",
                "collision": true,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-wall-interaction-test",
                        "entryId": "fromRoom02"
                    },
                    "message": "The door opens into another room."
                }
            }
        ],
        "layers": {
            "base": [
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ]
            ],
            "obstacles": [
                [
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    2,
                    -1,
                    2,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    2,
                    -1,
                    2,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ]
            ]
        },
        "editorGroup": "test"
    },
    {
        "id": "room-wall-interaction-test",
        "entries": {
            "fromRoom02": {
                "col": 2,
                "row": 5,
                "facing": {
                    "dc": 0,
                    "dr": 1
                }
            },
            "fromRoom06": {
                "col": 7,
                "row": 1,
                "facing": {
                    "dc": 0,
                    "dr": 1
                }
            }
        },
        "exits": [],
        "tiles": {
            "100": {
                "path": "./assets/atlases/world.png",
                "source": [
                    444,
                    68,
                    32,
                    32
                ],
                "condition": {
                    "notFlag": "room03.orbCollected"
                }
            }
        },
        "entities": [
            {
                "id": "blue-orb",
                "active": true,
                "col": 2,
                "row": 2,
                "spriteId": "blue-orb",
                "collision": false,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action",
                        "touch"
                    ],
                    "effects": [
                        {
                            "type": "setFlag",
                            "flag": "room03.orbCollected",
                            "value": true
                        },
                        {
                            "type": "playSound",
                            "soundId": "orb-collect"
                        }
                    ],
                    "message": "The blue orb dissolves. A section of the wall disappears."
                },
                "condition": {
                    "notFlag": "room03.orbCollected"
                }
            },
            {
                "id": "south-door",
                "active": true,
                "col": 2,
                "row": 6,
                "spriteId": "door",
                "collision": true,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-intermediate-savepoint",
                        "entryId": "fromRoom03"
                    },
                    "message": "You return to the previous room."
                }
            },
            {
                "id": "forest-door",
                "active": true,
                "col": 7,
                "row": 0,
                "spriteId": "door",
                "collision": true,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-layer-entity-forest-test",
                        "entryId": "fromRoom03"
                    },
                    "message": "The door opens onto a small forest clearing."
                }
            }
        ],
        "layers": {
            "base": [
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            ],
            "obstacles": [
                [
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    100,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ]
            ]
        },
        "editorGroup": "test"
    },
    {
        "id": "room-conditional-entity-test",
        "entries": {
            "fromRoom01": {
                "col": 1,
                "row": 3,
                "facing": {
                    "dc": 1,
                    "dr": 0
                }
            },
            "fromPinkOrb": {
                "col": 4,
                "row": 5,
                "facing": {
                    "dc": 0,
                    "dr": -1
                }
            }
        },
        "exits": [],
        "tiles": {},
        "entities": [
            {
                "id": "west-door",
                "active": true,
                "col": 0,
                "row": 3,
                "spriteId": "door",
                "collision": true,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-start",
                        "entryId": "fromRoom04"
                    },
                    "message": "You return to the main room."
                }
            },
            {
                "id": "receiver",
                "active": true,
                "col": 4,
                "row": 2,
                "spriteId": "receiver",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "playSound",
                            "soundId": "receiver-chime"
                        },
                        {
                            "type": "showText",
                            "speaker": "Receiver",
                            "pages": [
                                "The receiver wakes with a clear two-note chime.",
                                "A voice beneath the static says: The glass remembers who listened.",
                                "Then the signal cuts out."
                            ],
                            "afterClose": [
                                {
                                    "type": "setFlag",
                                    "flag": "room04.receiverUsed",
                                    "value": true
                                }
                            ]
                        }
                    ]
                }
            },
            {
                "id": "glass-figure",
                "active": true,
                "col": 6,
                "row": 3,
                "spriteId": "glass-figure",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "condition": {
                                "notFlag": "room04.receiverUsed"
                            },
                            "speaker": "Glass Figure",
                            "pages": [
                                "The glass figure is cold and perfectly still.",
                                "Its blank face is turned away from the receiver."
                            ]
                        },
                        {
                            "type": "showText",
                            "condition": {
                                "flag": "room04.receiverUsed",
                                "equals": true
                            },
                            "speaker": "Glass Figure",
                            "pages": [
                                "A faint vibration runs through the glass.",
                                "Its face is now angled toward the receiver.",
                                "There is no seam showing how it moved."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "animatedSavePoint",
                "active": true,
                "spriteId": "animated-save-point",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "speaker": "Save Point",
                            "pages": [
                                "This save point seems different then the others....",
                                "....or possibly not. who knows?"
                            ],
                            "afterClose": [
                                {
                                    "type": "saveGame"
                                }
                            ]
                        }
                    ]
                },
                "col": 1,
                "row": 5
            }
        ],
        "layers": {
            "base": [
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ],
                [
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1
                ]
            ],
            "obstacles": [
                [
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    2,
                    -1,
                    2
                ],
                [
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    2,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ]
            ]
        },
        "editorGroup": "test"
    },
    {
        "id": "room-entity-ownership-test",
        "entries": {},
        "exits": [
            {
                "edge": "east",
                "range": [
                    1,
                    4
                ],
                "targetMapId": "room-start",
                "targetEdge": "west",
                "preserveAxis": true,
                "offset": 0
            }
        ],
        "tiles": {},
        "entities": [
            {
                "id": "save-point",
                "active": true,
                "col": 1,
                "row": 3,
                "spriteId": "save-point",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "speaker": "Save Point",
                            "pages": [
                                "A small light holds perfectly still inside the glass.",
                                "For a moment, the shape of the dream becomes easy to remember."
                            ],
                            "afterClose": [
                                {
                                    "type": "saveGame"
                                }
                            ]
                        }
                    ]
                }
            },
            {
                "id": "permanent-collectible",
                "active": true,
                "col": 2,
                "row": 1,
                "spriteId": "blue-orb",
                "collision": false,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action",
                        "touch"
                    ],
                    "effects": [
                        {
                            "type": "setFlag",
                            "flag": "room05.permanentCollected",
                            "value": true
                        },
                        {
                            "type": "playSound",
                            "soundId": "orb-collect"
                        }
                    ],
                    "message": "The permanent collectible is recorded by its flag."
                },
                "condition": {
                    "notFlag": "room05.permanentCollected"
                }
            },
            {
                "id": "possession-collectible",
                "active": true,
                "col": 4,
                "row": 2,
                "spriteId": "pink-orb",
                "collision": false,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action",
                        "touch"
                    ],
                    "effects": [
                        {
                            "type": "addItem",
                            "itemId": "room05-possession-collectible",
                            "quantity": 1
                        },
                        {
                            "type": "playSound",
                            "soundId": "orb-collect"
                        }
                    ],
                    "message": "The possession collectible enters your inventory."
                },
                "condition": {
                    "notItem": "room05-possession-collectible"
                }
            },
            {
                "id": "spawned-collectible",
                "active": true,
                "col": 6,
                "row": 4,
                "spriteId": "blue-orb",
                "collision": false,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action",
                        "touch"
                    ],
                    "effects": [
                        {
                            "type": "setEntityActive",
                            "entityId": "spawned-collectible",
                            "active": false
                        },
                        {
                            "type": "playSound",
                            "soundId": "orb-collect"
                        }
                    ],
                    "message": "The independent spawned collectible disappears."
                }
            }
        ],
        "layers": {
            "base": [
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            ],
            "obstacles": [
                [
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1
                ],
                [
                    2,
                    -1,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    -1
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    2,
                    -1,
                    -1
                ],
                [
                    2,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1
                ],
                [
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ]
            ]
        },
        "editorGroup": "test"
    },
    {
        "id": "room-layer-entity-forest-test",
        "entries": {
            "fromRoom03": {
                "col": 5,
                "row": 7,
                "facing": {
                    "dc": 0,
                    "dr": -1
                }
            },
            "fromAnimationTest": {
                "col": 5,
                "row": 1,
                "facing": {
                    "dc": 0,
                    "dr": 1
                }
            }
        },
        "exits": [],
        "tiles": {},
        "entities": [
            {
                "id": "south-door",
                "active": true,
                "col": 5,
                "row": 8,
                "spriteId": "door",
                "collision": true,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-wall-interaction-test",
                        "entryId": "fromRoom06"
                    },
                    "message": "You leave the clearing."
                }
            },
            {
                "id": "north-door",
                "active": true,
                "col": 5,
                "row": 0,
                "spriteId": "door",
                "collision": true,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-animation-test",
                        "entryId": "fromRoom06"
                    },
                    "message": "The door opens into a room of moving lights."
                }
            }
        ],
        "layers": {
            "base": [
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            ],
            "obstacles": [
                [
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    4,
                    -1,
                    -1,
                    -1,
                    4,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    4,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    4,
                    -1,
                    -1,
                    -1,
                    4,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ]
            ]
        },
        "editorGroup": "test"
    },
    {
        "id": "room-animation-test",
        "entries": {
            "fromRoom06": {
                "col": 5,
                "row": 8,
                "facing": {
                    "dc": 0,
                    "dr": -1
                }
            },
            "fromAtlasTest": {
                "col": 1,
                "row": 8,
                "facing": {
                    "dc": 0,
                    "dr": -1
                }
            }
        },
        "exits": [],
        "tiles": {},
        "entities": [
            {
                "id": "south-door",
                "active": true,
                "col": 5,
                "row": 9,
                "spriteId": "door",
                "collision": true,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-layer-entity-forest-test",
                        "entryId": "fromAnimationTest"
                    },
                    "message": "You return to the forest clearing."
                }
            },
            {
                "id": "animated-save-point",
                "active": true,
                "col": 8,
                "row": 2,
                "spriteId": "animated-save-point",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "speaker": "Save Point",
                            "pages": [
                                "A small light holds perfectly still inside the glass.",
                                "For a moment, the shape of the dream becomes easy to remember."
                            ],
                            "afterClose": [
                                {
                                    "type": "saveGame"
                                }
                            ]
                        }
                    ]
                },
                "condition": {
                    "notFlag": "animationTest.hideSavePoint"
                }
            },
            {
                "id": "static-receiver",
                "active": true,
                "col": 2,
                "row": 2,
                "spriteId": "receiver",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "speaker": "Receiver",
                            "pages": [
                                "The static image remains perfectly still."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "placeholder-example",
                "active": true,
                "col": 9,
                "row": 7,
                "spriteId": "placeholder",
                "collision": false,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action",
                        "touch"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "This is an explicitly selected placeholder sprite."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "inventory-token",
                "active": true,
                "col": 5,
                "row": 7,
                "spriteId": "blue-orb",
                "collision": false,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action",
                        "touch"
                    ],
                    "effects": [
                        {
                            "type": "addItem",
                            "itemId": "animation-test-token",
                            "quantity": 1
                        },
                        {
                            "type": "setEntityActive",
                            "entityId": "inventory-token",
                            "active": false
                        },
                        {
                            "type": "playSound",
                            "soundId": "orb-collect"
                        }
                    ],
                    "message": "The test token can now keep the inventory open."
                }
            },
            {
                "id": "atlas-test-door",
                "active": true,
                "col": 1,
                "row": 9,
                "spriteId": "door",
                "collision": true,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-atlas-test",
                        "entryId": "fromAnimationTest"
                    },
                    "message": "The door opens into the atlas test gallery."
                }
            },
            {
                "id": "glittering-crystal",
                "active": true,
                "col": 5,
                "row": 4,
                "spriteId": "glittering-crystal",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "Light moves through the crystal."
                            ]
                        }
                    ]
                }
            }
        ],
        "layers": {
            "base": [
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    0
                ],
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            ],
            "obstacles": [
                [
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    4,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2
                ]
            ]
        },
        "editorGroup": "test"
    },
    {
        "id": "room-atlas-test",
        "initialEntryId": "fromAnimationTest",
        "entries": {
            "fromAnimationTest": {
                "col": 6,
                "row": 8,
                "facing": {
                    "dc": 0,
                    "dr": -1
                }
            }
        },
        "exits": [],
        "tiles": {},
        "entities": [
            {
                "id": "return-door",
                "active": true,
                "col": 6,
                "row": 9,
                "spriteId": "door",
                "collision": true,
                "interaction": {
                    "handler": "teleport",
                    "triggers": [
                        "action"
                    ],
                    "params": {
                        "mapId": "room-animation-test",
                        "entryId": "fromAtlasTest"
                    },
                    "message": "You return to the animation test room."
                }
            },
            {
                "id": "forest-sign",
                "active": true,
                "col": 3,
                "row": 4,
                "spriteId": "forest-sign",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "Atlas A occupies the upper half of this room.",
                                "Atlas B occupies the lower half."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "glowing-flower",
                "active": true,
                "col": 4,
                "row": 4,
                "spriteId": "glowing-flower",
                "collision": false,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "The small flower is a static atlas-backed entity."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "stone-statue",
                "active": true,
                "col": 7,
                "row": 4,
                "spriteId": "stone-statue",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "The statue is 32×64 but occupies one logical cell."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "lantern",
                "active": true,
                "col": 10,
                "row": 4,
                "spriteId": "lantern",
                "collision": false,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "The lantern continues animating while this dialogue is open."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "control-console",
                "active": true,
                "col": 2,
                "row": 7,
                "spriteId": "control-console",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "The console is a static region from Atlas B."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "violet-orb",
                "active": true,
                "col": 5,
                "row": 7,
                "spriteId": "violet-orb",
                "collision": false,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "A violet orb used only as an atlas-backed sprite test."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "robed-figure",
                "active": true,
                "col": 7,
                "row": 7,
                "spriteId": "robed-figure",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "The robed figure is another 32×64 entity sprite."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "signal-beacon",
                "active": true,
                "col": 9,
                "row": 7,
                "spriteId": "signal-beacon",
                "collision": false,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "The signal beacon blinks from a horizontal atlas strip."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "crystal-totem",
                "active": true,
                "col": 11,
                "row": 3,
                "spriteId": "crystal-totem",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "A cool shimmer passes through the crystal totem."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "arcane-vat",
                "active": true,
                "col": 2,
                "row": 4,
                "spriteId": "arcane-vat",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "The liquid bubbles with a soft glow."
                            ]
                        }
                    ]
                }
            }
        ],
        "layers": {
            "base": [
                [
                    7,
                    7,
                    8,
                    8,
                    9,
                    9,
                    10,
                    10,
                    7,
                    7,
                    8,
                    8,
                    9,
                    9
                ],
                [
                    7,
                    8,
                    7,
                    8,
                    9,
                    10,
                    9,
                    10,
                    7,
                    8,
                    7,
                    8,
                    9,
                    10
                ],
                [
                    8,
                    8,
                    7,
                    7,
                    10,
                    10,
                    9,
                    9,
                    8,
                    8,
                    7,
                    7,
                    10,
                    10
                ],
                [
                    7,
                    7,
                    8,
                    8,
                    9,
                    9,
                    10,
                    10,
                    7,
                    7,
                    8,
                    8,
                    9,
                    9
                ],
                [
                    10,
                    9,
                    8,
                    7,
                    10,
                    9,
                    8,
                    7,
                    10,
                    9,
                    8,
                    7,
                    10,
                    9
                ],
                [
                    17,
                    17,
                    18,
                    18,
                    19,
                    19,
                    20,
                    20,
                    17,
                    17,
                    18,
                    18,
                    19,
                    19
                ],
                [
                    17,
                    18,
                    17,
                    18,
                    19,
                    20,
                    19,
                    20,
                    17,
                    18,
                    17,
                    18,
                    19,
                    20
                ],
                [
                    18,
                    18,
                    17,
                    17,
                    20,
                    20,
                    19,
                    19,
                    18,
                    18,
                    17,
                    17,
                    20,
                    20
                ],
                [
                    17,
                    17,
                    18,
                    18,
                    19,
                    19,
                    20,
                    20,
                    17,
                    17,
                    18,
                    18,
                    19,
                    19
                ],
                [
                    20,
                    19,
                    18,
                    17,
                    20,
                    19,
                    18,
                    17,
                    20,
                    19,
                    18,
                    17,
                    20,
                    19
                ]
            ],
            "obstacles": [
                [
                    11,
                    11,
                    11,
                    11,
                    11,
                    11,
                    11,
                    11,
                    11,
                    11,
                    11,
                    11,
                    11,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    13,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    15,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    14,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    12,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    21,
                    -1,
                    22,
                    -1,
                    23,
                    -1,
                    -1,
                    24,
                    25,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    11,
                    11,
                    11,
                    11,
                    11,
                    -1,
                    11,
                    11,
                    11,
                    11,
                    11,
                    11,
                    11
                ]
            ]
        },
        "editorGroup": "test"
    },
    {
        "id": "room-transition-editor-test",
        "initialEntryId": "start",
        "entries": {
            "start": {
                "col": 1,
                "row": 1,
                "facing": {
                    "dc": 0,
                    "dr": 1
                }
            }
        },
        "exits": [
            {
                "edge": "north",
                "range": [
                    1,
                    8
                ],
                "targetMapId": "room-start",
                "targetEdge": "south",
                "preserveAxis": true,
                "offset": 0
            },
            {
                "edge": "south",
                "range": [
                    2,
                    8
                ],
                "targetMapId": "room-editor-edgetest",
                "targetEdge": "north",
                "preserveAxis": true,
                "offset": 0
            }
        ],
        "tiles": {},
        "entities": [
            {
                "id": "animatedSavePoint",
                "active": true,
                "spriteId": "animated-save-point",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "speaker": "Save Point",
                            "pages": [
                                "A small light holds perfectly still inside the glass.",
                                "For a moment, the shape of the dream becomes easy to remember."
                            ],
                            "afterClose": [
                                {
                                    "type": "saveGame"
                                }
                            ]
                        }
                    ]
                },
                "col": 5,
                "row": 4
            },
            {
                "id": "crystal-totem",
                "active": true,
                "col": 1,
                "row": 6,
                "spriteId": "crystal-totem",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "A cool shimmer passes through the crystal totem."
                            ]
                        }
                    ]
                }
            },
            {
                "id": "crystal-totem-2",
                "active": true,
                "col": 7,
                "row": 6,
                "spriteId": "crystal-totem",
                "collision": true,
                "interaction": {
                    "handler": "effects",
                    "triggers": [
                        "action"
                    ],
                    "effects": [
                        {
                            "type": "showText",
                            "pages": [
                                "A cool shimmer passes through the crystal totem."
                            ]
                        }
                    ]
                }
            }
        ],
        "layers": {
            "base": [
                [
                    9,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    9,
                    9
                ],
                [
                    9,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    9,
                    9
                ],
                [
                    9,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    9,
                    9
                ],
                [
                    9,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    9,
                    9
                ],
                [
                    9,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    9,
                    9
                ],
                [
                    9,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    9,
                    9
                ],
                [
                    9,
                    9,
                    9,
                    9,
                    9,
                    9,
                    9,
                    9,
                    9,
                    9
                ],
                [
                    9,
                    9,
                    9,
                    9,
                    9,
                    9,
                    9,
                    9,
                    9,
                    9
                ]
            ],
            "obstacles": [
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    24,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    24,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    24,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ],
                [
                    11,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    11
                ]
            ]
        },
        "editorGroup": "test"
    },
    {
        "id": "room-editor-edgetest",
        "initialEntryId": "start",
        "entries": {
            "start": {
                "col": 1,
                "row": 1,
                "facing": {
                    "dc": 0,
                    "dr": 1
                }
            }
        },
        "exits": [
            {
                "edge": "north",
                "range": [
                    1,
                    8
                ],
                "targetMapId": "room-transition-editor-test",
                "targetEdge": "south",
                "preserveAxis": true,
                "offset": 0
            }
        ],
        "tiles": {},
        "entities": [],
        "layers": {
            "base": [
                [
                    0,
                    9,
                    8,
                    20,
                    20,
                    20,
                    20,
                    8,
                    17,
                    0
                ],
                [
                    0,
                    9,
                    0,
                    8,
                    20,
                    20,
                    8,
                    17,
                    9,
                    0
                ],
                [
                    0,
                    9,
                    17,
                    17,
                    8,
                    8,
                    17,
                    0,
                    9,
                    0
                ],
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ],
                [
                    -1,
                    -1,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    -1,
                    -1
                ]
            ],
            "obstacles": [
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    2,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    2
                ],
                [
                    3,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    -1,
                    3,
                    -1
                ],
                [
                    -1,
                    -1,
                    2,
                    2,
                    2,
                    2,
                    2,
                    2,
                    -1,
                    -1
                ]
            ]
        },
        "editorGroup": "test"
    }
];
