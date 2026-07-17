export const ITEMS = {
    "waterlogged-punch-card": {
        name: "Waterlogged Punch Card",
        icon: "./assets/items/waterlogged-punch-card.png",
        description: "The holes have swollen shut. It smells faintly of warm rain.",
        usable: false,
    },
    "glass-fruit": {
        name: "Glass Fruit",
        icon: "./assets/items/glass-fruit.png",
        description: "A red light moves inside when you stop watching it.",
        usable: false,
    },
    "brass-tooth": {
        name: "Numbered Brass Tooth",
        icon: "./assets/items/brass-tooth.png",
        description: "Stamped 0 on one side and 43 on the other.",
        usable: false,
    },
};

//TODO: dont hardcode room destination here, it should be specified in map data/passed to a function from maps.generated.js
//reason: when designing the map, removing a room breaks the item, and the item should not be responsible for knowing about the map structure
// afterClose: [
//                     {
//                         type: "teleport",
//                         mapId: "room-conditional-entity-test",
//                         entryId: "fromPinkOrb",
//                     },
//                 ],
//teleport could be a callback?
