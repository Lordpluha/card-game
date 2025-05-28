// battle.js — логіка фронту бою

import UserService from "../api/User.service.js";

let socket;
let playerId = null;
let gameID = null;
let playerDeck = [];
let enemyDeck = [];
let selectedCards = [];

const battleField = document.getElementById("battle-field");
const battleStatus = document.getElementById("battle-status");
const cardZone = document.getElementById("battle-cards");
const endTurnBtn = document.getElementById("end-turn-btn");

const p1NameEl = document.getElementById("p1-name");
const p2NameEl = document.getElementById("p2-name");
const p1HpEl = document.getElementById("p1-hp");
const p2HpEl = document.getElementById("p2-hp");
const p1AvatarEl = document.getElementById("p1-avatar");
const p2AvatarEl = document.getElementById("p2-avatar");

<<<<<<< Updated upstream
=======
let userData = {};

>>>>>>> Stashed changes
async function initWebSocket() {
  socket = new WebSocket("ws://localhost:8080/gaming");

  socket.onopen = async () => {
    console.log("🔌 Підключено до WebSocket");

    try {
      const user = await UserService.getUser();
      if (!user || !user.id) {
        console.error("❌ Гравець не знайдено");
        return;
      }
      playerId = user.id;
      userData = user;
      console.log("👤 Player ID:", playerId);
    } catch (err) {
      console.error("❌ Не вдалося отримати гравця:", err);
      return;
    }

    const url = new URL(window.location.href);
    const params = url.searchParams;
    gameID = params.get("code") || params.get("gameId") || params.get("game");

    if (!gameID) {
      console.error("❌ Немає коду гри");
      return;
    }
    console.log("🎮 Game ID:", gameID);

    socket.send(
      JSON.stringify({
        event: "joinGame",
        payload: { gameId: gameID },
      })
    );
  };

  socket.onmessage = (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
      console.log("📨 Отримано повідомлення:", message);
    } catch (err) {
      return console.error(
        "❌ Не вдалося розпарсити повідомлення WebSocket:",
        err
      );
    }

    switch (message.event) {
      case "gameStarted":
        handleBattleStart(message);
        break;
      case "battle_result":
        handleBattleResult(message);
        break;
      case "turnEnded":
        console.log("🔚 Хід завершено іншого гравця");
        break;
      case "turnStarted":
        console.log("▶️ Новий хід:", message.nextPlayer);
        break;
      case "playerJoined":
        console.log("👥 Гравець приєднався до гри");
        break;
      case "decksSelected":
        console.log("🃏 Обрано колоди, гра стартує...");
        socket.send(
          JSON.stringify({
            event: "startGame",
            payload: { gameId: gameID },
          })
        );
        break;
      default:
        console.warn("⚠️ Unknown event:", message.event);
    }
  };

  socket.onerror = (error) => {
    console.error("❌ WebSocket Error:", error);
  };
}

function handleBattleStart(data) {
  battleStatus.classList.remove("hidden");
  battleStatus.textContent = data.message || "⚔️ Бій розпочався!";

  const game = data.game;
  const gameState = game.game_state;

  if (Array.isArray(gameState.decks)) {
    console.warn("⚠️ Відсутні колоди у стані гри або вони у невірному форматі");
    return;
  }

  const decks = gameState.decks;
  const players = gameState.players || {};
  const hands = gameState.hands || {};

  const userIds = Object.keys(decks);
  if (userIds.length !== 2) {
    console.warn("⚠️ Очікується 2 гравці, отримано:", userIds.length);
    return;
  }

  const [id1, id2] = userIds;
  const deck1 = { user_id: +id1 };
  const deck2 = { user_id: +id2 };

  const isFirstDeckMine = deck1.user_id === playerId;

  const me = isFirstDeckMine ? deck1 : deck2;
  const enemy = isFirstDeckMine ? deck2 : deck1;

  const meUser = players[me.user_id] || {};
  const enemyUser = players[enemy.user_id] || {};

  p1NameEl.textContent = meUser.username || "You";
  p2NameEl.textContent = enemyUser.username || "Enemy";

  p1AvatarEl.src = meUser.avatar_url || "/assets/empty-avatar.png";
  p2AvatarEl.src = enemyUser.avatar_url || "/assets/empty-avatar.png";

  p1NameEl.classList.add("pulse-name");
  p2NameEl.classList.add("pulse-name");
  setTimeout(() => {
    p1NameEl.classList.remove("pulse-name");
    p2NameEl.classList.remove("pulse-name");
  }, 1500);

  const health = gameState.health || {};
  p1HpEl.textContent = health[me.user_id] || 100;
  p2HpEl.textContent = health[enemy.user_id] || 100;

  playerDeck = hands[me.user_id] || [];
  enemyDeck = hands[enemy.user_id] || [];

  setTimeout(() => {
    battleStatus.classList.add("hidden");
    renderPlayerDeck();
    renderEnemyDeck();
    setupDragAndDrop();
    battleField.classList.remove("hidden");
  }, 3000);
}

function renderPlayerDeck() {
  cardZone.innerHTML = "";
  selectedCards = [];

  playerDeck.forEach((card) => {
    const imageUrl =
      card.image_url ||
      (card.image?.startsWith("http")
        ? card.image
        : `http://localhost:8080/cards/${card.image}`);

    const cardElement = document.createElement("div");
    cardElement.className =
      "deck-card cursor-pointer hover:scale-105 transition";
    cardElement.innerHTML = `
      <div class="deck-image-wrapper">
        <img src="${imageUrl}" alt="${card.name}" class="deck-image" />
      </div>
      <div class="deck-info">
        <div class="deck-name">${card.name}</div>
        <div class="deck-stats">
          <span class="deck-stat"><i class="fas fa-fist-raised stat-attack"></i>${card.attack}</span>
          <span class="deck-stat"><i class="fas fa-shield-alt stat-defense"></i>${card.defense}</span>
        </div>
      </div>
    `;
    cardElement.dataset.cardId = card.id;

    cardElement.addEventListener("click", () =>
      toggleCardSelection(card, cardElement)
    );
    cardZone.appendChild(cardElement);
  });
}

function renderEnemyDeck() {
  const enemyZone = document.createElement("div");
  enemyZone.className =
    "enemy-cards-grid absolute top-4 right-1/2 translate-x-1/2 flex gap-4 z-10";

  enemyDeck.forEach(() => {
    const cardBack = document.createElement("div");
    cardBack.className =
      "deck-card deck-card-back w-24 h-36 bg-purple-800 rounded-xl shadow-md";
    cardBack.innerHTML = `
      <div class="w-full h-full flex items-center justify-center text-white font-bold text-xl">
        ?
      </div>
    `;
    enemyZone.appendChild(cardBack);
  });

  battleField.appendChild(enemyZone);
}

function toggleCardSelection(card, element) {
  const index = selectedCards.findIndex((c) => c.name === card.name);

  if (index !== -1) {
    selectedCards.splice(index, 1);
    element.classList.remove("ring", "ring-violet-400");
  } else if (selectedCards.length < 3) {
    selectedCards.push(card);
    element.classList.add("ring", "ring-violet-400");
  }

  console.log("🎯 Вибрані карти:", selectedCards);
}

endTurnBtn.addEventListener("click", () => {
  if (selectedCards.length === 0) {
    alert("Вибери хоча б одну карту!");
    return;
  }

  socket.send(
    JSON.stringify({
      event: "endTurn",
      payload: {
        gameId: gameID,
        cards: selectedCards.map((c) => c.name),
      },
    })
  );

  console.log("✅ Хід завершено. Надіслано карти:", selectedCards);
  endTurnBtn.disabled = true;
});

function handleBattleResult(data) {
  console.log("⚔️ Результати бою:", data);
  endTurnBtn.disabled = false;
}

function setupDragAndDrop() {
  document.querySelectorAll(".deck-card").forEach((card) => {
    card.setAttribute("draggable", "true");

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card.dataset.cardId);
    });
  });

  const dropZone = document.getElementById("player-battle-zone");

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("over");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("over");

    const cardId = e.dataTransfer.getData("text/plain");

    if (dropZone.children.length >= 3) {
      alert("Максимум 3 карти на полі!");
      return;
    }

    const card = document.querySelector(`.deck-card[data-card-id="${cardId}"]`);
    if (card && !dropZone.contains(card)) {
      dropZone.appendChild(card);
      card.classList.add("ring", "ring-purple-500");
    }
  });
}

document.addEventListener("DOMContentLoaded", initWebSocket);
