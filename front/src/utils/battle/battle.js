// battle.js — логіка фронту бою

let socket;
let playerId = null;
let gameCode = null;
let playerDeck = [];
let enemyDeck = [];

const battleField = document.getElementById("battle-field");
const battleStatus = document.getElementById("battle-status");
const cardZone = document.getElementById("battle-cards");

function initWebSocket() {
  socket = new WebSocket("ws://localhost:8080/gaming");

  socket.onopen = () => {
    console.log("🔌 Підключено до WebSocket");

    // Отримай гравця з sessionStorage або cookie
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || !user.id) {
      console.error("❌ Гравець не знайдено");
      return;
    }
    playerId = user.id;
    console.log("👤 Player ID:", playerId);

    // Отримай код гри
    const params = new URLSearchParams(window.location.search);
    gameCode = params.get("code");

    if (!gameCode) {
      console.error("❌ Немає коду гри");
      return;
    }

    socket.send(JSON.stringify({ type: "join_battle", gameCode, playerId }));
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log("📨 Отримано повідомлення:", message);

    if (message.type === "battle_started") {
      handleBattleStart(message);
    }
  };

  socket.onerror = (error) => {
    console.error("WS Error:", error);
  };
}

function handleBattleStart(data) {
  battleStatus.classList.remove("hidden");
  battleStatus.textContent = data.message || "⚔️ Бій розпочався!";

  const gameState = data.game_state;
  if (!gameState || !gameState.decks) {
    console.warn("⚠️ Немає інформації про колоди");
    return;
  }

  // Зберігаємо свої і ворожі карти
  playerDeck =
    gameState.decks[`p1`] && gameState.decks[`p1`].playerId === playerId
      ? gameState.decks[`p1`].cards
      : gameState.decks[`p2`].cards;

  enemyDeck =
    gameState.decks[`p1`] && gameState.decks[`p1`].playerId !== playerId
      ? gameState.decks[`p1`].cards
      : gameState.decks[`p2`].cards;

  console.log("🃏 Player cards:", playerDeck);
  console.log("🃏 Enemy cards:", enemyDeck);

  // Через 3 секунди починаємо бій
  setTimeout(() => {
    battleStatus.classList.add("hidden");
    renderPlayerDeck();
    battleField.classList.remove("hidden");
  }, 3000);
}

function renderPlayerDeck() {
  cardZone.innerHTML = "";
  playerDeck.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.className = "deck-card";
    cardElement.innerHTML = `
      <div class="deck-image-wrapper">
        <img src="http://localhost:8080/cards/${card.image}" alt="${card.name}" class="deck-image" />
      </div>
      <div class="deck-info">
        <div class="deck-name">${card.name}</div>
        <div class="deck-stats">
          <span class="deck-stat"><i class="fas fa-fist-raised stat-attack"></i>${card.attack}</span>
          <span class="deck-stat"><i class="fas fa-shield-alt stat-defense"></i>${card.defense}</span>
        </div>
      </div>
    `;
    cardZone.appendChild(cardElement);
  });
}

document.addEventListener("DOMContentLoaded", initWebSocket);
