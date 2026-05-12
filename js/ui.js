/*
Author: Joey Jaikaran
Date: 
Purpose: 
*/

import { state, initState } from "./state.js";
import { handleGuess, startGame, switchMode } from "./game.js";
import { startDailyGame, hasPlayedToday } from "./daily.js";

let elements = {};

async function init() {
  elements.app = document.getElementById("app");
  elements.board = document.getElementById("board");
  elements.input = document.getElementById("guess-input");
  elements.suggestions = document.getElementById("suggestions");
  elements.submitBtn = document.getElementById("submit-btn");
  elements.hintsContainer = document.getElementById("hints-container");
  elements.streakDisplay = document.getElementById("streak-display");
  elements.dailyBtn = document.getElementById("daily-btn");
  elements.freeplayBtn = document.getElementById("freeplay-btn");
  elements.modal = document.getElementById("modal");
  elements.modalContent = document.getElementById("modal-content");
  elements.loadingScreen = document.getElementById("loading-screen");

  try {
    await initState();
    startGame(state.gameMode);
    setupEventListeners();
    renderBoard();
    updateStreak();
    elements.loadingScreen.classList.add("hidden");
    elements.app.classList.remove("hidden");

    if (state.gameMode === "daily" && hasPlayedToday())
        showModal(state.won, state.answer);
  } catch (error) {
    elements.loadingScreen.textContent = "Something went wrong. Please refresh the page.";
    console.error(error);
  }
}

function renderBoard() {
    elements.board.innerHTML = "";
    const answerLength = state.answer.name.length;

    // Build game board
    for (let row = 0; row < 6; row++){
        const rowE1 = document.createElement("div");
        rowE1.classList.add("tile-row");
        rowE1.id = `row-${row}`;

        for (let col = 0; col < answerLength; col++){
            const tile = document.createElement("div");
            tile.classList.add("tile");
            tile.id = `tile-${row}-${col}`;
            rowE1.appendChild(tile);
        }

        elements.board.appendChild(rowE1);
    } 
}

function updateStreak() {
    elements.streakDisplay.textContent = `🔥 ${state.streak}`;
}

function setupAutocomplete() {
    elements.input.addEventListener("input", handleInput);
    elements.input.addEventListener("keydown", handleKeydown);
    document.addEventListener("click", handleOutsideClick);
}

function handleInput() {
    const query = elements.input.value.toLowerCase().trim();

    if (query.length < 1) {
        clearSuggestions();
        return;
    }

    const answerLength = state.answer.name.length;
    // Create a list of the first 8 possible pokemon that match user input
    const matches = state.allPokemon.filter(p => 
        p.name.startsWith(query) &&
        p.name.length === answerLength
    ).slice(0, 8);

    renderSuggestions(matches);
}

function handleKeydown(e) {
    const items = elements.suggestions.querySelectorAll(".suggestion-item");
    const active = elements.suggestions.querySelector(".suggestion-item.active");
    let index = Array.from(items).indexOf(active);

    if (e.key === "ArrowDown") {
        e.preventDefault();
        index = index < items.length - 1 ? index + 1 : 0;
        setActiveSuggestions(items, index);
    }
    else if (e.key === "ArrowUp") {
        e.preventDefault();
        index = index > 0 ? index - 1 : items.length -1;
        setActiveSuggestions(items, index);
    }
    else if (e.key === "Enter") {
        if (active)
            selectSuggestion(active.dataset.name);
    }
    else if (e.key === "Escape") {
        clearSuggestions();
    }
}

function setActiveSuggestions(items, index) {
    items.forEach(item => item.classList.remove("active"));
    items[index].classList.add("active");
    elements.input.value = items[index].dataset.name;
}

function renderSuggestions(matches) {
    elements.suggestions.innerHTML = "";

    if (matches.length === 0) {
        clearSuggestions();
        return;
    }

    // Create element for each Pokemon suggestion that user can choose from
    matches.forEach(pokemon => {
        const item = document.createElement("div");
        item.classList.add("suggestion-item");
        item.dataset.name = pokemon.name;

        const img = document.createElement("img");
        img.src = pokemon.sprite;
        img.alt = pokemon.name;

        const name = document.createElement("span");
        name.textContent = pokemon.name;

        item.appendChild(img);
        item.appendChild(name);

        item.addEventListener("click", () => selectSuggestion(pokemon.name));
        elements.suggestions.appendChild(item);
    });

    elements.suggestions.classList.remove("hidden");
}

function selectSuggestion(name) {
    elements.input.value = name;
    clearSuggestions();
    elements.input.focus();
}

function clearSuggestions() {
    elements.suggestions.innerHTML = "";
    elements.suggestions.classList.add("hidden");
}

function handleOutsideClick(e) {
  if (!elements.input || !elements.suggestions) return;
  if (!elements.input.contains(e.target) &&
      !elements.suggestions.contains(e.target)) {
    clearSuggestions();
  }
}

function setupSubmit() {
    elements.submitBtn.addEventListener("click", processGuess);
    elements.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !elements.suggestions.querySelector(".suggestions-item.active"))
            processGuess();
    });
}

function processGuess() {
    const name = elements.input.value.toLowerCase().trim();
    if (!name) return;

    const outcome = handleGuess(name);
    if (!outcome) return;

    const rowIndex = state.guesses.length - 1;
    animateTiles(rowIndex, name, outcome.result);

    if (outcome.hint)
        renderHint(outcome.hint);

    if (outcome.gameOver)
        setTimeout(() => showModal(outcome.won, outcome.answer), 1800);

    elements.input.value = "";
    clearSuggestions();
}

function animateTiles(rowIndex, name, result) {
    const letters = name.split("");

    letters.forEach((letter, i) => {
        const tile = document.getElementById(`tile-${rowIndex}-${i}`);

        setTimeout(() => {
            tile.textContent = letter.toUpperCase();
            tile.classList.add("flip");

            setTimeout(() => {
                tile.classList.remove("flip");
                tile.classList.add(result[i]);
            }, 250);
        }, i * 150);
    });
}

function updateBoard() {
    const currentRow = state.guesses.length;
    if (currentRow >= 6) return;

    const tiles = document.querySelectorAll(`#row-${currentRow} .tile`);
    tiles.forEach(tile => {
        tile.classList.remove("green", "yellow", "grey");
        tile.textContent = "";
    });
}

function renderHint(hint) {
    const hintE1 = document.createElement("div");
    hintE1.classList.add("hint-card");

    if (hint.type === "silhouette") {
        const img = document.createElement("img");
        img.src = hint.sprite;
        img.alt = "Silhouette hint";
        img.classList.add("silhouette");
        hintE1.appendChild(img);
    }
    else
        hintE1.textContent = hint.text;

    elements.hintsContainer.appendChild(hintE1);
}

function showModal(won, answer) {
    const modal = elements.modal;
    const content = elements.modalContent
    content.innerHTML = "";

    const img = document.createElement("img");
    img.src = answer.sprite;
    img.alt = answer.name;
    img.classList.add("modal-sprite");

    // Show the name of the answer with just the first letter capitalized
    const name = document.createElement("h2");
    name.textContent = answer.name.charAt(0).toUpperCase() + answer.name.slice(1);

    const message = document.createElement("p");
    message.textContent = won ? "You got it!" : "Better luck next time!";
    message.classList.add(won ? "win-message" : "lose-message");

    content.appendChild(img);
    content.appendChild(name);
    content.appendChild(message);

    if (state.gameMode === "daily"){
        const streakE1 = document.createElement("p");
        streakE1.textContent = `Current streak: ${state.streak}`;
        streakE1.classList.add("streak-info");

        const countdown = document.createElement("p");
        countdown.classList.add("countdown");

        const freeplayBtn = document.createElement("button");
        freeplayBtn.textContent = "Play Free Play";
        freeplayBtn.classList.add("play-again-btn");
        freeplayBtn.addEventListener("click", () => {
            elements.modal.classList.add("hidden");
            switchMode("freeplay");
            renderBoard();
            elements.hintsContainer.innerHTML = "";
            elements.freeplayBtn.classList.add("active");
            elements.dailyBtn.classList.remove("active");
        });

        content.appendChild(streakE1);
        content.appendChild(freeplayBtn);
        content.appendChild(countdown);
        startCountdown(countdown);
    }
    else {
        const playAgainBtn = document.createElement("button");
        playAgainBtn.textContent = "Play Again";
        playAgainBtn.classList.add("play-again-btn");
        playAgainBtn.addEventListener("click", () => {
            modal.classList.add("hidden");
            startGame("freeplay");
            renderBoard();
            elements.hintsContainer.innerHTML = "";
        });
        content.appendChild(playAgainBtn);
    }

    modal.classList.remove("hidden");
}

function startCountdown(el) {
    function update() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        el.textContent = `Next Pokémon in: ${hours}h ${minutes}m ${seconds}s`;
    }

    update();
    setInterval(update, 1000);
}

function setupModeSwitcher() {
    elements.dailyBtn.addEventListener("click", () => {
        if (state.gameMode === "daily") return;
        switchMode("daily");
        renderBoard();
        elements.hintsContainer.innerHTML = "";
        elements.dailyBtn.classList.add("active");
        elements.freeplayBtn.classList.remove("active");

        if (hasPlayedToday()) {
            showModal(state.won, state.answer);
        }
    });

    elements.freeplayBtn.addEventListener("click", () => {
        if (state.gameMode === "freeplay") return;
        switchMode("freeplay");
        renderBoard();
        elements.hintsContainer.innerHTML = "";
        elements.freeplayBtn.classList.add("active");
        elements.dailyBtn.classList.remove("active");
    });
}

function setupModalClose() {
  elements.modal.addEventListener("click", (e) => {
    if (e.target === elements.modal && state.gameMode === "freeplay") {
      elements.modal.classList.add("hidden");
    }
  });
}

function setupEventListeners() {
    setupAutocomplete();
    setupSubmit();
    setupModeSwitcher();
    setupModalClose();
}

// Run init only after HTML has fully loaded
document.addEventListener("DOMContentLoaded", init);