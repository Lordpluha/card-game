import AuthService from "../api/Auth.service.js";

let currentUser = null;
let currentGame = null;
let socket = null;

checkAuthOrRedirect().then(() => {
  proceed();
});

async function checkAuthOrRedirect() {
  const accessToken = getCookie("accessToken");

  if (accessToken) {
    console.log("✅ Access token найден, используем его");
    return;
  }

  console.log("🔁 Access token не найден, пробуем refresh...");

  try {
    const res = await AuthService.refresh();
    currentUser = res.user;
    console.log("✅ Refresh прошёл успешно");
  } catch (err) {
    console.warn("❌ Не авторизований:", err.message);
    alert("Ви не авторизовані. Перейдіть на сторінку входу.");
    window.location.href = "/pages/login.html";
    throw new Error("Unauthorized");
  }
}

function proceed() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("gameId");

  if (gameId) {
    initWebSocket(gameId);
  }

  setupGame();
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

      if (!response.ok) {
        throw new Error("Помилка створення гри: " + response.status);
      }

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

    if (!response.ok) {
      throw new Error("Не вдалося завантажити гру: " + response.status);
    }

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

function initWebSocket(gameId) {
  console.log("📡 Connecting WebSocket...");

  socket = new WebSocket("ws://localhost:8080/gaming");

  socket.onopen = () => {
    console.log("🟢 WS connected, sending joinGame...");
    socket.send(JSON.stringify({ event: "joinGame", payload: { gameId } }));
  };

  socket.onmessage = (msg) => {
    console.log("📨 WS raw message:", msg.data);

    try {
      const data = JSON.parse(msg.data);
      console.log("✅ WS parsed:", data);

      switch (data.event) {
        case "playerJoined":
          console.log("👥 Player joined the lobby!");
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

  socket.onerror = (err) => {
    console.error("❌ WS connection error:", err);
  };

  socket.onclose = () => {
    console.warn("🔌 WS connection closed");
  };
}

function updateUI(game) {
  if (!game || !Array.isArray(game.user_ids)) return;

  const players = game.game_state?.players || {};
  const [p1, p2] = game.user_ids;

  const isHost = currentUser?.id === p1;
  const me = isHost ? p1 : p2;
  const opponent = isHost ? p2 : p1;

  const meInfo = players[me] || {};
  const oppInfo = players[opponent] || {};

  document.getElementById("p1-name").textContent = meInfo.username || "Ви";
  document.getElementById("p1-avatar").src =
    getAvatar(meInfo.username) || "/assets/avatar1.png";
  document.getElementById("p1-status").textContent = "🟢 Готовий";

  if (oppInfo.username) {
    document.getElementById("p2-name").textContent = oppInfo.username;
    document.getElementById("p2-avatar").src =
      getAvatar(oppInfo.username) || "/assets/avatar2.png";
    document.getElementById("p2-status").textContent = "🟡 Очікує";
  } else {
    document.getElementById("p2-name").textContent = "Очікуємо...";
    document.getElementById("p2-status").textContent = "🟡 Очікує";
  }
}

function getAvatar(username) {
  if (!username) return "";
  const name = `avatar_${username}`;
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}
