import { Game } from "./game.js";
import { ITEMS } from "./items.js";
import { MAPS } from "./maps.js";

const canvas = document.querySelector("#game");
export const game = new Game(canvas, MAPS, ITEMS);

canvas.addEventListener("game-interaction", (event) => {
    console.log("Interaction signal:", event.detail);
});

game.start().catch((error) => {
    console.error(error);
    document.querySelector("#status").textContent = error.message;
});
