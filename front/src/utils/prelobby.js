import CardsService from "../api/Cards.service.js";

let currentGame = null;
let socket = null;
let gameId = null;

function proceed() {
  const urlParams = new URLSearchParams(window.location.search);
  gameId = urlParams.get("gameId");
  if (gameId) initWebSocket(gameId);
  setupGame();
  setupUIInteractions();
}

async function setupGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("gameId");
  const codeFromUrl = urlParams.get("code");

  if (!gameId) {
    try {
      const response = await fetch("http://localhost:8080/api/create", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok)
        throw new Error("Помилка створення гри: " + response.status);

      const game = await response.json();
      if (!game?.id) throw new Error("Сервер не повернув ID гри");

      sessionStorage.setItem("lastCreatedGameCode", game.game_code);

      setTimeout(() => {
        window.location.href = `/pages/prelobby.html?gameId=${game.id}&code=${game.game_code}`;
      }, 300);
      return;
    } catch (err) {
      console.error("❌ Помилка при створенні гри:", err);
      alert("Спробуйте ще раз.");
      return;
    }
  }

  try {
    const response = await fetch(`http://localhost:8080/api/game/${gameId}`, {
      credentials: "include",
    });

    if (!response.ok)
      throw new Error("Не вдалося завантажити гру: " + response.status);

    const game = await response.json();
    currentGame = game;

    updateUI(game);

    const codeEl = document.getElementById("game-code");
    const sessionCode = sessionStorage.getItem("lastCreatedGameCode");
    const finalCode = game?.game_code || codeFromUrl || sessionCode || "❌";
    if (codeEl) codeEl.textContent = finalCode;

    sessionStorage.removeItem("lastCreatedGameCode");
  } catch (err) {
    console.error("❌ Failed to fetch game:", err.message);
    alert("Гру не знайдено або вже неактивна.");
  }
}

// Load user cards for deck selection
const cards = await CardsService.getMyCards();
const grid = document.getElementById("decksGrid");
grid.innerHTML = cards
  .map(
    (c) => `
	<label class="deck-card" id="deck-card-${c.id}">
		<input type="checkbox" name="cards" value="${c.id}" />
		<div class="deck-check"><i class="fas fa-check"></i></div>
		<div class="deck-image-wrapper">
			<img src="${c.image_url}" alt="${c.name}" class="deck-image" />
		</div>
		<div class="deck-info">
			<div class="deck-name">${c.name}</div>
			<div class="deck-stats">
				<span class="deck-stat"><i class="fas fa-fist-raised stat-attack"></i>${c.attack}</span>
				<span class="deck-stat"><i class="fas fa-shield-alt stat-defense"></i>${c.defense}</span>
			</div>
		</div>
	</label>`
  )
  .join("");

function initWebSocket(gameId) {
  console.log("📡 Connecting WebSocket...");
  socket = new WebSocket("ws://localhost:8080/gaming");

  socket.onopen = () => {
    console.log("🟢 WS connected, sending joinGame...");
    socket.send(JSON.stringify({ event: "joinGame", payload: { gameId } }));
  };

  socket.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      switch (data.event) {
        case "playerJoined":
          currentGame = data.game;
          updateUI(currentGame);
          break;
        case "lobbyUpdate":
          console.log("🔄 Lobby updated:", data);
          break;
        case "gameStarted":
          console.log("🚀 Game has started!");
          break;
        case "error":
          console.error("❌ WS ERROR:", data.message);
          break;
        default:
          console.warn("⚠️ Unknown WS event:", data.event);
      }
    } catch (err) {
      console.error("❌ WS JSON parse error:", err);
    }
  };

  socket.onerror = (err) => console.error("❌ WS connection error:", err);
  socket.onclose = () => console.warn("🔌 WS connection closed");
}

import UserService from "../api/User.service.js";

async function updateUI(game) {
  if (!game || !Array.isArray(game.user_ids)) return;
  const players = game.game_state?.players || {};
  const [p1, p2] = game.user_ids;

  const myId = await UserService.getUser()
    .then((u) => u.id)
    .catch((e) => null);
  if (!myId) return;

  const isHost = myId === p1;
  const me = isHost ? p1 : p2;
  const opponent = isHost ? p2 : p1;

  const meInfo = players[me] || {};
  const oppInfo = players[opponent] || {};

  console.log("🧍 Я:", meInfo.username, "🧑‍🤝‍🧑 Противник:", oppInfo.username);

  // Я зліва
  document.getElementById("p1-name").textContent = meInfo.username || "Ви";
  document.getElementById("p1-avatar").src =
    meInfo.avatar_url || "/assets/empty-avatar.png";
  document.getElementById("p1-status").textContent = meInfo.ready
    ? "🟢 Готовий"
    : "🟡 Очікує";

  // Противник справа
  if (oppInfo.username) {
    document.getElementById("p2-name").textContent = oppInfo.username;
    document.getElementById("p2-avatar").src =
      oppInfo.avatar_url || "/assets/empty-avatar.png";
    document.getElementById("p2-status").textContent = oppInfo.ready
      ? "🟢 Готовий"
      : "🟡 Очікує";
  } else {
    document.getElementById("p2-name").textContent = "Очікуємо...";
    document.getElementById("p2-avatar").src = "/assets/empty-avatar.png";
    document.getElementById("p2-status").textContent = "🟡 Очікує";
  }
}

function setupUIInteractions() {
  const readyBtn = document.getElementById("readyBtn");
  const deckCards = document.querySelectorAll(".deck-card");
  const checkboxes = document.querySelectorAll(
    '.deck-card input[type="checkbox"]'
  );
  const playerStatusEl = document.querySelector(
    ".player-card:nth-child(2) .player-status"
  );

  let isUserReady = false;

  // add start button
  const startBtn = document.createElement("button");
  startBtn.id = "startBtn";
  startBtn.className = "ready-button hidden";
  startBtn.innerHTML = '<i class="fas fa-play"></i> Почати гру';
  startBtn.style.marginTop = "1rem";
  readyBtn.parentNode.appendChild(startBtn);

  // enforce max 6 selection
  function updateButtonState() {
    const checked = Array.from(checkboxes).filter((c) => c.checked);
    readyBtn.disabled = checked.length !== 6;
    readyBtn.classList.toggle("active", checked.length === 6);
    checkboxes.forEach((c) => {
      c.disabled = !c.checked && checked.length >= 6;
    });
    console.log("Update button state");
  }

  function updateSelectedDeckUI() {
    deckCards.forEach((card) => {
      const input = card.querySelector('input[type="checkbox"]');
      card.classList.toggle("selected", input.checked);
    });
  }
  console.log(checkboxes);
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      console.log("Checkbox changed", cb.value);

      const selected = Array.from(checkboxes).filter((c) => c.checked);
      if (selected.length > 6) {
        cb.checked = false;
        return;
      }
      updateButtonState();
      updateSelectedDeckUI();
    });
  });

  deckCards.forEach((card) => {
    card.addEventListener("click", () => {
      const cb = card.querySelector('input[type="checkbox"]');
      if (!cb.disabled) cb.checked = !cb.checked;
      cb.dispatchEvent(new Event("change"));
    });
  });

  readyBtn.addEventListener("click", () => {
    if (isUserReady) return;
    // send selected 6 card IDs to server
    const selectedIds = Array.from(checkboxes)
      .filter((c) => c.checked)
      .map((c) => Number(c.value));
    socket.send(
      JSON.stringify({
        event: "selectDeck",
        payload: { gameId, cardIds: selectedIds },
      })
    );

    isUserReady = true;
    readyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Готово!';
    readyBtn.style.background = "#10b981";
    readyBtn.disabled = true;

    if (playerStatusEl) {
      playerStatusEl.classList.remove("status-waiting");
      playerStatusEl.classList.add("status-ready");
      playerStatusEl.innerHTML =
        '<i class="fas fa-check-circle"></i><span>ГОТОВИЙ</span>';
    }

    const waitingMsg = document.createElement("div");
    waitingMsg.style.marginTop = "1rem";
    waitingMsg.style.textAlign = "center";
    waitingMsg.style.color = "var(--text-secondary)";
    waitingMsg.style.fontFamily = "'Rajdhani', sans-serif";
    waitingMsg.style.fontSize = "1rem";
    waitingMsg.innerHTML = "Всі гравці готові! Гра скоро розпочнеться...";
    readyBtn.parentNode.appendChild(waitingMsg);

    startBtn.classList.remove("hidden");
  });

  startBtn.addEventListener("click", () => {
    alert("🚀 Гра розпочалась! (тут буде перехід)");
  });

  updateButtonState();
  updateSelectedDeckUI();
}

// після динамической вставки карточек запускаем логику WS і UI
proceed();
