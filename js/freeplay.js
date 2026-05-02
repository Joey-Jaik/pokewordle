import  { state, initGame } from "./state.js"

function getRandomPokemon() {
    const index = Math.floor(Math.random() * state.allPokemon.length);
    return state.allPokemon[index];
}

function startFreePlayGame() {
    initGame();
    state.gameMode = "freeplay";
    state.answer = getRandomPokemon();
}

export { startFreePlayGame };