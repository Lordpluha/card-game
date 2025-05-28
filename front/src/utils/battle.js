// battle.js — логіка фронту бою

import UserService from "../api/User.service.js";

let socket;
let playerId = null;
let gameID = null;
let playerDeck = [];
let enemyDeck = [];
let selectedCards = []; // Вибрані карти для бою

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

async function initWebSocket() {
  socket = new WebSocket("ws://localhost:8080/gaming");

  socket.onopen = async () => {
    console.log("🔌 Підключено до WebSocket");

    try {
      const user = await UserService.getUser();
      console.log("🧠 Отримано user з API:", user);
      if (!user || !user.id) {
        console.error("❌ Гравець не знайдено");
        return;
      }
      playerId = user.id;
      username = user.username || "You";
      console.log("👤 Player ID:", playerId);
    } catch (err) {
      console.error("❌ Не вдалося отримати гравця:", err);
      return;
    }

    const url = new URL(window.location.href);
    console.log("🌐 Поточний URL:", url.href);

    const params = url.searchParams;
    gameID =
      params.get("code") || params.get("gameId") || params.get("game") || null;

    if (!gameID) {
      console.error("❌ Немає коду гри");
      return;
    }
    console.log("🎮 Game ID:", gameID);

    socket.send(
      JSON.stringify({
        type: "joinGame",
        payload: { gameId: gameID, playerId },
      })
    );
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log("📨 Отримано повідомлення:", message);

      if (message.event === "battle_started") handleBattleStart(message);
      else if (message.event === "battle_result") handleBattleResult(message);
      else if (message.event === "turnEnded")
        console.log("🛑 Хід завершено іншого гравця");
      else if (message.event === "turnStarted")
        console.log("▶️ Новий хід для:", message.nextPlayer);
      else console.warn("⚠️ Unknown event type:", message.event);
    } catch (err) {
      console.error("❌ Не вдалося розпарсити повідомлення WebSocket:", err);
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

  const p1 = gameState.decks.p1;
  const p2 = gameState.decks.p2;

  let isP1 = p1.playerId === playerId;
  const me = isP1 ? p1 : p2;
  const enemy = isP1 ? p2 : p1;

  playerDeck = me.cards;
  enemyDeck = enemy.cards;

  p1NameEl.textContent = me.username || "You";
  p2NameEl.textContent = enemy.username || "Enemy";

  p1HpEl.textContent = me.hp;
  p2HpEl.textContent = enemy.hp;

  if (me.avatar) p1AvatarEl.src = me.avatar;
  if (enemy.avatar) p2AvatarEl.src = enemy.avatar;

  console.log("🃏 Player cards:", playerDeck);
  console.log("🃏 Enemy cards:", enemyDeck);

  setTimeout(() => {
    battleStatus.classList.add("hidden");
    renderPlayerDeck();
    battleField.classList.remove("hidden");
  }, 3000);
}

function renderPlayerDeck() {
  cardZone.innerHTML = "";
  selectedCards = [];

  playerDeck.forEach((card, index) => {
    const cardElement = document.createElement("div");
    cardElement.className =
      "deck-card cursor-pointer hover:scale-105 transition";
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

    cardElement.addEventListener("click", () =>
      toggleCardSelection(card, cardElement)
    );
    cardZone.appendChild(cardElement);
  });
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
      type: "endTurn",
      payload: {
        gameId: gameID,
        playerId,
        cards: selectedCards.map((c) => c.name),
      },
    })
  );

  console.log("✅ Хід завершено. Надіслано карти:", selectedCards);
  endTurnBtn.disabled = true;
});

function handleBattleResult(data) {
  console.log("⚔️ Результати бою:", data);

  // todo: тут буде логіка анімацій, візуальних ефектів та оновлення здоров’я

  // Після обробки результатів знову дозволити вибір
  endTurnBtn.disabled = false;
}

document.addEventListener("DOMContentLoaded", initWebSocket);
