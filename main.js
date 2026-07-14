import { Game } from "./game.js";
import { ITEMS } from "./items.js";
import { MAPS } from "./maps.js";
import { SaveControls } from "./save-ui.js";
import { SaveStore } from "./saves.js";

const canvas = document.querySelector("#game");
export const game = new Game(canvas, MAPS, ITEMS);

canvas.addEventListener("game-interaction", (event) => {
    console.log("Interaction signal:", event.detail);
});

try {
    await game.start();
    new SaveControls({
        game,
        store: new SaveStore(),
        rootElement: document.querySelector("#save-controls"),
    });
} catch (error) {
    console.error(error);
    document.querySelector("#status").textContent = error.message;
}
