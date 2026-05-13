/*
Author: Joey Jaikaran
Date: 
Purpose: 
*/

import { buildPokemonList } from "./api.js";

const GEN_1_TO_3 = [
    "generation-i",
    "generation-ii",
    "generation-iii"
];

const state = {
    allPokemon: [],
    dailyPokemon: [],
    answer: null,
    guesses: [],
    currentHint: 0,
    gameMode: "daily",
    gameOver: false,
    won: false,
    dailyWon: false,
    streak: 0,
    lastPlayed: null,
};

async function initState(){
    state.allPokemon = await buildPokemonList();
    state.dailyPokemon = state.allPokemon.filter(p => GEN_1_TO_3.includes(p.generation));
    loadStreak();
}

function initGame(){
    state.answer = null;
    state.guesses = [];
    state.currentHint = 0;
    state.gameOver = false;
    state.won = false;
}

function loadStreak(){
    const raw = localStorage.getItem("pokewordle_streak");
    if(!raw) return;
    const parsed = JSON.parse(raw);
    state.streak = parsed.streak;
    state.lastPlayed = parsed.lastPlayed;
    state.dailyWon = parsed.dailyWon || false;
}

function saveStreak(){
    localStorage.setItem("pokewordle_streak", JSON.stringify({
        streak: state.streak,
        lastPlayed: state.lastPlayed,
        dailyWon: state.dailyWon,
    }));
}

function updateStreak(){
    const today = getTodayString();
    // If last played is today then player has already played daily game today and immediately return
    if (state.lastPlayed === today) return;

    const yesterday = getYesterdayString();
    // If they played yesterday then increment streak by 1, otherwise reset streak to 1
    if( state.lastPlayed === yesterday )
        state.streak += 1;
    else
        state.streak = 1;

    state.lastPlayed = today;
    saveStreak();
}

function getTodayString(){
    // Provides date in "YYYY-MM-DD" format
    return new Date().toISOString().split("T")[0];
}

function getYesterdayString(){
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
}

function submitGuess(name) {
    // Find pokemon that matches the name guess in pokemon list and return the corresponding pokemon object
    const guess = state.allPokemon.find(p => p.name === name.toLowerCase());
    if (!guess) return null;

    const result = compareGuess(guess);
    state.guesses.push({ pokemon: guess, result });

    // If guess is the same as answer then player has won the game, 
    // so flip the game over and game won flags to true and update their streak if in daily mode
    // Or if user has run out of guesses then end the game flip game over flag to true and game won to false
    if (guess.name === state.answer.name){
        state.gameOver = true;
        state.won = true;
        if (state.gameMode === "daily") {
            state.dailyWon = true;
            updateStreak();
            saveStreak();
        }
    }
    else if (state.guesses.length >= 6) {
        state.gameOver = true;
        state.won = false;
    }

    return result;
}

function compareGuess(guess){
    const answer = state.answer;
    const guessLetters = guess.name.split("");
    const answerLetters = answer.name.split("");
    const result = new Array(guessLetters.length).fill("grey");
    const answerUsed = new Array(answerLetters.length).fill(false);
    const guessUsed = new Array(guessLetters.length).fill(false);

    // First pass compare the guessed letter to corresponding letter in the answer, 
    // if they are the same then mark it as green and flip flag that letter has been handled
    guessLetters.forEach((letter, i) => {
        if (letter === answerLetters[i]){
            result[i] = "green";
            answerUsed[i] = true;
            guessUsed[i] = true;
        }
    });

    // Second pass for every unhandled guess letter check it against every unhandled answer letter, 
    // if the letter is found in the answer letter array then mark as yellow and flip flag that letter has been handled
    guessLetters.forEach((letter, i) => {
        if (guessUsed[i]) return;
        answerLetters.forEach((answerLetter, j) => {
            if ( !answerUsed[j] && letter === answerLetter) {
                result[i] = "yellow";
                answerUsed[j] = true;
                guessUsed[i] = true;
            }
        });
    });

    return result;
}

function getNextHint(){
    if (state.currentHint >= 5) return null;
    const hint = buildHint(state.currentHint);
    state.currentHint += 1;
    return hint;
}

function buildHint(hintIndex){
    const answer = state.answer;

    switch(hintIndex){
        case 0:
            return { type: "weakness", text: `Weak against: ${answer.weaknesses[0]}`};
        case 1:
            return { type: "type", text: `Type: ${answer.types.join(", ")}`};
        case 2:
            const gen = answer.generation.replace("generation-", "").toUpperCase();
            return { type: "generation", text: `Generation: ${gen}`};
        case 3:
            return { type: "colour", text: `Colour: ${answer.colour}`};
        case 4:
            return { type: "silhouette", sprite: answer.sprite};
    }
}

export { state, initState, initGame, updateStreak, submitGuess, getNextHint, saveStreak };