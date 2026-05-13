/*
Author: Joey Jaikaran
Date: May 13, 2026
Purpose: Acts as the intermediary between the game logic and the UI.
         Handles starting games in either daily or free play mode,
         processing guess submissions, and switching between game modes.
         Returns a structured outcome object to the UI after each guess
         containing the result, next hint, and game over state.
*/

import { state, submitGuess, getNextHint } from "./state.js";
import { startDailyGame, hasPlayedToday } from "./daily.js";
import { startFreePlayGame } from "./freeplay.js";

function startGame(mode){
    if (mode === "daily")
        startDailyGame();
    else
        startFreePlayGame();
}

function handleGuess(name) {
    if (state.gameOver) return null;
    if (!name) return null;

    const result = submitGuess(name);
    if (!result) return null;

    // Only provide the next hint if the game isn't over
    const hint = state.gameOver ? null : getNextHint();

    // Return everything UI needs to render
    return {
        result,
        hint,
        gameOver: state.gameOver,
        won: state.won,
        answer: state.gameOver ? state.answer : null,
        guessCount: state.guesses.length
    };
}

function switchMode(mode) {
    state.gameMode = mode;
    startGame(mode);
}

export { startGame, handleGuess, switchMode };