export const ITEMS = {
 
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