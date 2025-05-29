// battle.js — логіка фронту бою

import AuthService from "../api/Auth.service.js";
import UserService from "../api/User.service.js";
import { simulateTurn } from "./battle-logic.js";
let socket;
let playerId = null;
let gameID = null;
let playerDeck = [];
let enemyDeck = [];
let selectedCards = [];
let playedCard = null;

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
const gameOverModal = document.getElementById("game-over-modal");
const gameOverText = document.getElementById("game-over-text");
const gameOverBtn = document.getElementById("game-over-btn");
const turnTimerEl = document.getElementById("turn-timer"); // Таймер на фронті

let turnTimer = null;
const TURN_TIME_LIMIT = 10000;

let userData = {};

gameOverBtn.addEventListener("click", () => {
  window.location.href = "/pages/main-menu.html";
});

async function initWebSocket() {
  socket = new WebSocket("ws://localhost:8080/gaming");

  socket.onopen = async () => {
    try {
      const user = await UserService.getUser();
      if (!user || !user.id) return;
      playerId = user.id;
      userData = user;
    } catch (err) {
      await AuthService.refresh();
      window.location.reload();
      return;
    }

    const url = new URL(window.location.href);
    const params = url.searchParams;
    gameID = params.get("code") || params.get("gameId") || params.get("game");
    if (!gameID) return;

    socket.send(
      JSON.stringify({ event: "joinGame", payload: { gameId: gameID } })
    );
  };

  socket.onmessage = (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch (err) {
      return;
    }

    switch (message.event) {
      case "gameStarted":
        handleBattleStart(message);
        break;
      case "battle_result":
        handleBattleResult(message);
        break;
      case "roundResolved": // <-- вдруг придёт с этим именем
        handleBattleResult(message);
        break;
      case "decksSelected":
        socket.send(
          JSON.stringify({ event: "startGame", payload: { gameId: gameID } })
        );
        break;
      case "update_health":
        updateHealthUI(message.health);
        break;
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
  };
}

function updateHealthUI(health) {
  p1HpEl.textContent = health[playerId] || 0;
  p2HpEl.textContent =
    health[Object.keys(health).find((id) => id != playerId)] || 0;
}

function handleBattleStart(data) {
  const game = data.game;
  const gameState = game.game_state;
  const decks = gameState.decks;
  const players = gameState.players || {};
  const hands = gameState.hands || {};
  const health = gameState.health || {};

  const userIds = Object.keys(decks);
  if (userIds.length < 2) return;

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
  p1HpEl.textContent = health[me.user_id] || 100;
  p2HpEl.textContent = health[enemy.user_id] || 100;

  playerDeck = hands[me.user_id] || [];
  enemyDeck = hands[enemy.user_id] || [];

  renderPlayerDeck();
  renderEnemyDeck();
  setupDragAndDrop();
  battleField.classList.remove("hidden");
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
  const old = document.querySelector(".enemy-cards-grid");
  if (old) old.remove();
  const enemyZone = document.createElement("div");
  enemyZone.className =
    "enemy-cards-grid absolute top-4 right-1/2 translate-x-1/2 flex gap-4 z-10";
  enemyDeck.forEach(() => {
    const cardBack = document.createElement("div");
    cardBack.className =
      "deck-card deck-card-back w-24 h-36 bg-purple-800 rounded-xl shadow-md";
    cardBack.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-xl">?</div>`;
    enemyZone.appendChild(cardBack);
  });
  battleField.appendChild(enemyZone);
}

function toggleCardSelection(card, element) {
  const index = selectedCards.findIndex((c) => c.id === card.id);
  if (index !== -1) {
    selectedCards.splice(index, 1);
    element.classList.remove("ring", "ring-violet-400");
    playedCard = null;
  } else {
    selectedCards = [card];
    document
      .querySelectorAll(".deck-card")
      .forEach((el) => el.classList.remove("ring", "ring-violet-400"));
    element.classList.add("ring", "ring-violet-400");
    playedCard = card;
  }
  endTurnBtn.disabled = !playedCard;
}

endTurnBtn.addEventListener("click", () => {
  if (!playedCard) {
    alert("Вибери хоча б одну карту!");
    return;
  }

  console.log("📤 Sending playedCard:", playedCard);
  socket.send(
    JSON.stringify({
      event: "playedCard",
      payload: { gameId: gameID, card: playedCard },
    })
  );

  setTimeout(() => {
    console.log("📤 Sending playerReady after delay");
    socket.send(
      JSON.stringify({
        event: "playerReady",
        payload: { gameId: gameID },
      })
    );
  }, 300); // 👈 задержка 300мс

  endTurnBtn.disabled = true;
});

function renderFightCards(outcome) {
  const dropZone = document.getElementById("player-battle-zone");
  dropZone.innerHTML = "";

  const renderCard = (card, isWinner) => {
    const imageUrl =
      card.image_url ||
      (card.image?.startsWith("http")
        ? card.image
        : `http://localhost:8080/cards/${card.image}`);

    const div = document.createElement("div");
    div.className =
      "deck-card scale-100 transition ring-4 " +
      (isWinner ? "ring-green-500" : "ring-red-500");
    div.innerHTML = `
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
    dropZone.appendChild(div);
  };

  const { cardA, cardB, winner } = outcome;
  const isMineFirst = cardA?.owner === playerId;
  const mineCard = isMineFirst ? cardA : cardB;
  const enemyCard = isMineFirst ? cardB : cardA;

  renderCard(mineCard, winner === playerId);
  renderCard(enemyCard, winner !== playerId);
}

function handleBattleResult({ outcome }) {
  if (!outcome || !playerId) {
    console.warn("⛔ Не отримано outcome або playerId ще не встановлено");
    return;
  }
  console.log("⚔️ handleBattleResult outcome:", outcome);

  // Установить владельцев карт, если отсутствует
  if (outcome.cardA)
    outcome.cardA.owner = outcome.cardA.owner ?? outcome.cardA.user_id ?? null;
  if (outcome.cardB)
    outcome.cardB.owner = outcome.cardB.owner ?? outcome.cardB.user_id ?? null;
  if (outcome.survivorCard)
    outcome.survivorCard.owner =
      outcome.survivorCard.owner ?? outcome.survivorCard.user_id ?? null;

  renderFightCards(outcome);

  const { winner, damage, isGameOver } = outcome;
  const meLost = winner && winner !== playerId;
  const hpEl = meLost ? p1HpEl : p2HpEl;
  const newHp = parseInt(hpEl.textContent || "0") - damage;

  p1HpEl.textContent = outcome.health[playerId];
  const opponentId = Object.keys(outcome.health).find((id) => id != playerId);
  p2HpEl.textContent = outcome.health[opponentId];

  hpEl.classList.add("text-red-500", "animate-ping");
  setTimeout(() => hpEl.classList.remove("text-red-500", "animate-ping"), 1000);

  if (outcome.survivorCard?.owner === playerId) {
    console.log("🟩 We survived! Removing our played card");
    playerDeck = playerDeck.filter((c) => c.id !== playedCard.id);
  } else {
    console.log("🟥 We lost! Removing our card");
    playerDeck = playerDeck.filter((c) => c.id !== playedCard.id);
  }
  playedCard = null;

  setTimeout(() => {
    document.getElementById("player-battle-zone").innerHTML = "";
    renderPlayerDeck();
    setupDragAndDrop();
    endTurnBtn.disabled = false;
    startTurnTimer();

    const myHp = outcome.health[playerId];
    const opponentHp = outcome.health[opponentId];

    // 🔁 определяем карты противника через outcome.hands
    const enemyHand = outcome.hands?.[opponentId] || [];
    const isMyDeckEmpty = playerDeck.length === 0;
    const isEnemyDeckEmpty = enemyHand.length === 0;
    const bothDecksEmpty = isMyDeckEmpty && isEnemyDeckEmpty;

    if (isGameOver || myHp <= 0 || opponentHp <= 0 || bothDecksEmpty) {
      const playerWon =
        myHp > opponentHp ? true : myHp < opponentHp ? false : null;

      setTimeout(() => showGameOver(playerWon), 300);
    }

    if (outcome.isDraw) {
      console.log("🤝 Draw round!");
      battleStatus.textContent = "🤝 Нічия!";
      battleStatus.classList.remove("hidden");
      setTimeout(() => battleStatus.classList.add("hidden"), 1500);
    }
  }, 2000);
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
    const card = document.querySelector(`.deck-card[data-card-id="${cardId}"]`);
    if (dropZone.querySelectorAll(".deck-card").length >= 1) {
      return;
    }
    if (card && !dropZone.contains(card)) {
      dropZone.appendChild(card);
      toggleCardSelection(
        playerDeck.find((c) => c.id == cardId),
        card
      );
    }
  });
}

function showGameOver(playerWon) {
  gameOverText.textContent =
    playerWon === null
      ? "🤝 Нічия! Але галактика чекає на реванш."
      : playerWon
      ? "🎉 Ваша перемога освітлює галактику!"
      : "☄️ Ви програли. Всесвіт готує новий виклик!";

  gameOverModal.classList.remove("hidden");
  gameOverModal.classList.add(
    "backdrop-blur-xl",
    "bg-[#2e003a]/80",
    "text-center",
    "animate-fadeIn"
  );
  gameOverText.classList.add(
    "text-3xl",
    "font-bold",
    "text-white",
    "mb-4",
    "drop-shadow-lg"
  );
  gameOverBtn.classList.add(
    "bg-violet-700",
    "hover:bg-violet-800",
    "text-white",
    "px-5",
    "py-2",
    "rounded-xl",
    "transition",
    "shadow-xl"
  );
}

function startTurnTimer() {
  clearTimeout(turnTimer);
  let secondsLeft = TURN_TIME_LIMIT / 1000;

  turnTimerEl.textContent = `⏳ ${secondsLeft} сек. на хід`;

  const interval = setInterval(() => {
    secondsLeft--;
    turnTimerEl.textContent = `⏳ ${secondsLeft} сек. на хід`;
    if (secondsLeft <= 0) {
      clearInterval(interval);
      turnTimerEl.textContent = "❗ Хід завершено";
    }
  }, 1000);

  turnTimer = setTimeout(() => {
    if (!playedCard) {
      console.warn("⌛ Час вичерпано! Авто-кінець ходу.");
      endTurnBtn.disabled = true;
      socket.send(
        JSON.stringify({
          event: "playerReady",
          payload: { gameId: gameID, timeout: true },
        })
      );
    }
  }, TURN_TIME_LIMIT);
}

document.addEventListener("DOMContentLoaded", () => {
  initWebSocket();
  startTurnTimer();
});
