/*
Author: Joey Jaikaran
Date: 
Purpose: 
*/

import { state, initGame } from "./state.js"

function getDailyPokemon() {
    const start = new Date("2025-01-01");
    const today = new Date();
    // Ensure that player gets the same pokemon regardless of the time of day they play
    today.setHours(0, 0, 0, 0);

    // Convert millisecond difference to number of days
    const daysSinceStart = Math.floor((today - start) /  (1000 * 60 * 60 * 24));
    // Use modulo to keep index within bounds of dailyPokemon array
    const index = daysSinceStart % state.dailyPokemon.length;

    return state.dailyPokemon[index];
}

function hasPlayedToday() {
    const today = new Date().toISOString().split("T")[0];
    return state.lastPlayed === today;
}

function startDailyGame() {
    initGame();
    state.gameMode = "daily";
    state.answer = getDailyPokemon();
}

export { startDailyGame, hasPlayedToday };