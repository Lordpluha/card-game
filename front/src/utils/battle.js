import AuthService from "../api/Auth.service.js";
import UserService from "../api/User.service.js";

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
const turnTimerEl = document.getElementById("turn-timer"); // Таймер

const TURN_TIME_LIMIT = 10000;

let userData = {};

async function initWebSocket() {
  socket = new WebSocket("ws://localhost:8080/gaming");

  socket.onopen = async () => {
    try {
      const user = await UserService.getUser()
				.catch(() => {
					AuthService.refresh().then(() => {
						window.location.reload();
					});
			});
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
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }
    switch (msg.event) {
			case "gameStarted":
      case "gameData":
        handleBattleStart(msg);
        break;
			case "startRound":
				endTurnBtn.disabled = false;
				break;
			case "cardPlayed":
				enemyDeck = msg.game.game_state.decks[msg.game.user_ids.find(id => id !== playerId)]
				renderEnemyDeck()
				playerDeck = msg.game.game_state.decks[playerId]

				if (Object.keys(msg.game.game_state.selected).length === 2) {
					handleBattleResult(msg.game);
				}
				break;
			case "mergedCards":
				playerDeck = msg.game.game_state.decks[playerId]
				renderPlayerDeck();
				setupDragAndDrop()
				break;
      case "endRound":
				setTimeout(() => {
					updateHealthUI(msg.game.game_state.health);
				}, [2000])
        break;
      case "gameEnded":
        showGameOver(msg.game.winner_id === null ? null : msg.game.winner_id === playerId);
        break;

			case "updateTimer":
				// Обновление таймера
				if (msg.payload && msg.payload.timeLeft) {
					turnTimerEl.textContent = `⏳ ${msg.payload.timeLeft} сек. на хід`;
				}
				break;
			case "endTimer":
				// Таймер завершен
				turnTimerEl.textContent = "❗ Хід завершено";
				endTurnBtn.disabled = true;
				break;
    }
  };

  socket.onerror = (error) => console.error("WebSocket Error:", error);
}

function updateHealthUI(health) {
  p1HpEl.textContent = health[playerId] || 0;
  p2HpEl.textContent =
    health[Object.keys(health).find((id) => id != playerId)] || 0;
}

function handleBattleStart(data) {
  const game = data.game;
  const gameState = game.game_state;
  const players = gameState.players;
  const decks = gameState.decks;
  const health = gameState.health;

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

  playerDeck = decks[me.user_id] || [];
  enemyDeck = decks[enemy.user_id] || [];

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
      (card.image_url?.startsWith("http")
        ? card.image_url
        : `http://localhost:8080/cards/${card.image_url}`);
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

function endTurn() {
  if (!playedCard) {
    alert("Вибери хоча б одну карту!");
    return;
  }
  socket.send(
    JSON.stringify({
      event: "playCard",
      payload: { gameId: gameID, cardId: playedCard.id },
    })
  );
  endTurnBtn.disabled = true;
}

endTurnBtn.addEventListener("click", endTurn);

function renderFightCards(gameState) {
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

  const { selected, health } = gameState;
	const myCard = selected[playerId]
	const enemyCard = selected[Object.keys(health).find(id => +id !== +playerId)];

  renderCard(myCard, myCard.attack >= enemyCard.attack);
  renderCard(enemyCard, enemyCard.attack >= myCard.attack);
}

function handleBattleResult(game) {
  const state = game.game_state;

  // отрисовать карты и выбор победителя
  renderFightCards(state);
  updateHealthUI(state.health);

  setTimeout(() => {
    document.getElementById("player-battle-zone").innerHTML = "";
    renderPlayerDeck();
    setupDragAndDrop();
    endTurnBtn.disabled = false;

    const myHp = state.health[playerId];
    const opponentId = Object.keys(state.health).find((id) => id != playerId);
    const opponentHp = state.health[opponentId];
    const bothEmpty =
      playerDeck.length === 0 && (state.decks[opponentId] || []).length === 0;

    if (game.winner_id || myHp <= 0 || opponentHp <= 0 || bothEmpty) {
      const playerWon =
        myHp > opponentHp ? true : myHp < opponentHp ? false : null;
      showGameOver(playerWon);
    }
  }, 2000);
}

function setupDragAndDrop() {
  document.querySelectorAll(".deck-card").forEach((card) => {
    card.setAttribute("draggable", "true");
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card.dataset.cardId);
    });

    // делаем каждую карту зоной приёма — если перетащили другую карту на неё
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      card.classList.add("ring", "ring-yellow-400");
    });
    card.addEventListener("dragleave", () => {
      card.classList.remove("ring", "ring-yellow-400");
    });
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("ring", "ring-yellow-400");
      const draggedId = e.dataTransfer.getData("text/plain");
      const targetId = card.dataset.cardId;
      if (draggedId && draggedId !== targetId) {
        // отправляем ход: playCard с таргетом
        socket.send(
          JSON.stringify({
            event: "mergeCards",
            payload: {
              gameId: gameID,
							cardIds: [draggedId, targetId],
            },
          })
        );
        endTurnBtn.disabled = true;
      }
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

document.addEventListener("DOMContentLoaded", () => {
  initWebSocket();
});

gameOverBtn.addEventListener("click", () => {
  window.location.href = "/pages/main-menu.html";
});