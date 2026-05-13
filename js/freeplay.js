/*
Author: Joey Jaikaran
Date: May 13, 2026
Purpose: Handles free play game mode logic. Selects a random Pokémon
         from the full pool of all 1025 Pokémon on each new game start,
         allowing unlimited replays with no streak tracking.
*/

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