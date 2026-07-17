export { MAPS } from "./maps.generated.js";

//TODO: empty trigger areas: allow for triggers that are not tied to a specific tile, but rather a rectangular area of the map. 
// this would allow for more complex interactions, such as triggering events when the player enters a certain area, regardless of the tile they are on. should have same hooks as interaction triggers/handlers etc
//actually, maybe this needs to be a generalized trigger system? i feel like this is scattered across different types of files