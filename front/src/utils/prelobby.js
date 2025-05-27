import AuthService from "../api/Auth.service.js";
import { connectToGameWS } from "../utils/ws-game-client.js";

let currentUser = null;
let currentGame = null;

// 🟢 Перевіряємо авторизацію
AuthService.refresh()
  .then(async (res) => {
    currentUser = res.user;
    await setupGame();
  })
  .catch((err) => {
    console.warn("❌ Не авторизований:", err.message);
    alert("Ви не авторизовані. Перейдіть на сторінку входу.");
    window.location.href = "/pages/login.html";
  });

async function setupGame() {
  const urlParams = new URLSearchParams(window.location.search);
  let gameId = urlParams.get("gameId");
  let codeFromUrl = urlParams.get("code");

  // 🎮 Створення гри, якщо немає gameId
  if (!gameId) {
    try {
      const response = await fetch("http://localhost:8080/api/game/create", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Помилка створення гри: " + response.status);
      }

      const game = await response.json();
      if (!game?.id) throw new Error("Сервер не повернув ID гри");

      sessionStorage.setItem("lastCreatedGameCode", game.game_code);
      window.location.href = `/pages/prelobby.html?gameId=${game.id}&code=${game.game_code}`;
      return;
    } catch (err) {
      console.error("❌ Помилка при створенні гри:", err);
      alert("Сталася помилка при створенні гри. Спробуйте ще раз.");
      return;
    }
  }

  // 🔌 Підключення до WebSocket
  connectToGameWS(gameId, handleWSMessage);

  // 🔎 Отримання гри з бекенду
  try {
    const response = await fetch(`http://localhost:8080/api/game/${gameId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Не вдалося завантажити гру: " + response.status);
    }

    const game = await response.json();
    currentGame = game;

    // 🔁 Оновити інтерфейс
    updateUI(game);

    // 🆔 Показати код гри
    const codeEl = document.getElementById("game-code");
    const sessionCode = sessionStorage.getItem("lastCreatedGameCode");
    const finalCode = game?.game_code || codeFromUrl || sessionCode || "❌";

    if (codeEl) {
      codeEl.textContent = finalCode;
    }

    sessionStorage.removeItem("lastCreatedGameCode");
  } catch (err) {
    console.error("❌ Failed to fetch game:", err.message);
    alert("Гру не знайдено або термін її дії вичерпано.");
  }
}

function updateUI(game) {
  if (!game || !Array.isArray(game.user_ids)) return;

  const [p1, p2] = game.user_ids;
  const isHost = currentUser?.id === p1;
  const opponent = isHost ? p2 : p1;

  document.getElementById("p1-name").textContent =
    currentUser?.username || "Ви";
  document.getElementById("p1-avatar").src =
    getAvatar(currentUser?.username) || "/assets/avatar1.png";
  document.getElementById("p1-status").textContent = "🟢 Готовий";

  if (opponent) {
    document.getElementById("p2-name").textContent = "Гравець";
    document.getElementById("p2-avatar").src = "/assets/avatar2.png";
    document.getElementById("p2-status").textContent = "🟡 Очікує";
  } else {
    document.getElementById("p2-name").textContent = "Очікуємо...";
    document.getElementById("p2-status").textContent = "🟡 Очікує";
  }
}

function handleWSMessage(msg) {
  if (!msg.data) return;
  try {
    const data = JSON.parse(msg.data);
    if (data.event === "playerJoined") {
      currentGame = data.game;
      updateUI(currentGame);
    }
  } catch (err) {
    console.error("❌ WS parse error:", err);
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

//
//
(() => {
  const mainCountdownEl = document.getElementById("countdown");
  const cornerCountdownEl = document.querySelector(".corner-countdown-timer");
  const readyBtn = document.getElementById("readyBtn");
  const radios = document.querySelectorAll('input[name="deck"]');
  const mainProgressBar = document.getElementById("progress-bar");
  const cornerProgressBar = document.querySelector(".corner-progress-bar");
  const deckCards = document.querySelectorAll(".deck-card");
  const playerStatusEl = document.querySelector(
    ".player-card:nth-child(2) .player-status"
  ); // Вибираємо статус другого гравця
  let countdown = 10;
  let intervalId;
  let isCountdownStarted = false; // Прапорець для контролю запуску відліку
  let isUserReady = false; // Прапорець для відстеження готовності користувача

  // Setup initial UI
  updateButtonState();
  updateSelectedDeckUI();

  // Handle deck selection
  function updateSelectedDeckUI() {
    deckCards.forEach((card) => {
      const input = card.querySelector('input[type="radio"]');
      if (input.checked) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });
  }

  // Enable ready button only if a deck is selected
  function updateButtonState() {
    const selected = Array.from(radios).some((r) => r.checked);
    readyBtn.disabled = !selected;

    if (selected) {
      readyBtn.classList.add("active");
    } else {
      readyBtn.classList.remove("active");
    }
  }

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      updateButtonState();
      updateSelectedDeckUI();
    });
  });

  // Implementation for deck card click to select radio
  deckCards.forEach((card) => {
    card.addEventListener("click", () => {
      const radio = card.querySelector('input[type="radio"]');
      radio.checked = true;

      // Trigger change event manually
      const event = new Event("change");
      radio.dispatchEvent(event);
    });
  });

  function startCountdown() {
    // Запобігаємо повторному запуску відліку
    if (isCountdownStarted) return;
    isCountdownStarted = true;

    // Reset countdown to initial value
    countdown = 10;

    // Початкове встановлення значень таймерів
    if (mainCountdownEl) mainCountdownEl.textContent = countdown;
    if (cornerCountdownEl) cornerCountdownEl.textContent = countdown;

    // Скидаємо стилі таймера (колір) до початкових
    if (mainCountdownEl) mainCountdownEl.style.color = "";
    if (cornerCountdownEl) cornerCountdownEl.style.color = "";

    // Очищаємо попередній таймер, якщо він існує
    if (intervalId) clearInterval(intervalId);

    const totalTime = countdown;

    intervalId = setInterval(() => {
      countdown--;

      // Оновлюємо обидва таймери
      if (mainCountdownEl) mainCountdownEl.textContent = countdown;
      if (cornerCountdownEl) cornerCountdownEl.textContent = countdown;

      // Update both progress bars
      const progressPercent = (countdown / totalTime) * 100;
      if (mainProgressBar) mainProgressBar.style.width = `${progressPercent}%`;
      if (cornerProgressBar)
        cornerProgressBar.style.width = `${progressPercent}%`;

      if (countdown <= 3) {
        if (mainCountdownEl) mainCountdownEl.style.color = "#ef4444"; // red color
        if (cornerCountdownEl) cornerCountdownEl.style.color = "#ef4444"; // red color
      }

      if (countdown <= 0) {
        clearInterval(intervalId);
        if (mainCountdownEl) mainCountdownEl.textContent = "0";
        if (cornerCountdownEl) cornerCountdownEl.textContent = "0";

        // Вимикаємо кнопки
        const allReadyBtns = document.querySelectorAll(".ready-button");
        allReadyBtns.forEach((btn) => {
          btn.disabled = true;
          btn.classList.remove("active");
        });

        if (mainProgressBar) mainProgressBar.style.width = "0%";
        if (cornerProgressBar) cornerProgressBar.style.width = "0%";

        // Автоматично підтверджуємо вибір колоди після відліку
        const selectedDeck = document.querySelector(
          'input[name="deck"]:checked'
        );
        if (selectedDeck) {
          const deckName = selectedDeck
            .closest("label")
            .querySelector(".deck-name").textContent;
          showGameStartModal(deckName, selectedDeck.value);
          // Тут можна додати логіку переходу до гри
        } else {
          showErrorModal("Час вичерпано, але колода не вибрана.");
        }
      }
    }, 1000);
  }

  function showGameStartModal(deckName, deckValue) {
    // Create modal
    const modal = document.createElement("div");
    modal.className = "modal";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    modalContent.innerHTML = `
      <h3 style="font-family: 'Orbitron', sans-serif; font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; text-align: center; color: var(--secondary-accent); text-transform: uppercase; letter-spacing: 1px;">Гра починається!</h3>
      <div style="padding: 1.5rem 0; display: flex; justify-content: center;">
        <div style="width: 7rem; height: 7rem; border-radius: 50%; background-color: rgba(37, 99, 235, 0.15); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(22, 213, 255, 0.3);">
          <i class="fas fa-star" style="font-size: 3rem; color: var(--secondary-accent);"></i>
        </div>
      </div>
      <p style="text-align: center; font-size: 1.25rem; margin-bottom: 1.5rem; color: var(--text-primary);">Ви вибрали колоду: <span style="font-weight: 700; color: var(--secondary-accent); font-family: 'Orbitron', sans-serif;">${deckName}</span></p>
      <p style="text-align: center; color: var(--text-secondary); margin-bottom: 2rem;">Бажаємо успіху в грі! Насолоджуйтесь процесом.</p>
      <div style="display: flex; justify-content: center;">
        <button style="padding: 0.85rem 2rem; background: linear-gradient(to right, var(--accent-color), var(--secondary-accent)); border: none; border-radius: 0.5rem; color: white; font-weight: 600; font-family: 'Orbitron', sans-serif; text-transform: uppercase; font-size: 1rem; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(22, 213, 255, 0.3);" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Розпочати гру
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal on button click (placeholder)
    modal.querySelector("button").addEventListener("click", () => {
      modal.classList.add("fade-out");
      setTimeout(() => modal.remove(), 300);
      // Тут мав би бути перехід до гри
    });
  }

  function showErrorModal(message) {
    // Create error modal
    const modal = document.createElement("div");
    modal.className = "modal";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
        <div style="width: 5rem; height: 5rem; border-radius: 50%; background-color: rgba(239, 68, 68, 0.15); display: flex; align-items: center; justify-content: center;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ef4444;"></i>
        </div>
      </div>
      <h3 style="font-family: 'Orbitron', sans-serif; font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; text-align: center; color: #ef4444; text-transform: uppercase; letter-spacing: 1px;">Увага</h3>
      <p style="text-align: center; margin-bottom: 2rem; color: var(--text-primary); font-size: 1.1rem;">${message}</p>
      <div style="display: flex; justify-content: center;">
        <button style="padding: 0.85rem 2rem; background-color: #ef4444; border: none; border-radius: 0.5rem; color: white; font-weight: 600; font-family: 'Orbitron', sans-serif; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Зрозуміло
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal on button click
    modal.querySelector("button").addEventListener("click", () => {
      modal.classList.add("fade-out");
      setTimeout(() => modal.remove(), 300);
      // Reset the game
      location.reload();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Вибір колоди
    const deckCards = document.querySelectorAll(".deck-card");
    deckCards.forEach((card) => {
      card.addEventListener("click", function () {
        deckCards.forEach((c) => c.classList.remove("selected"));
        this.classList.add("selected");
        document.getElementById("readyBtn").removeAttribute("disabled");
      });
    });

    // Починаємо відлік автоматично при завантаженні сторінки
    startCountdown();
  });

  // Обробник для кнопки "Готовий до бою"
  readyBtn.addEventListener("click", () => {
    const selectedDeck = document.querySelector('input[name="deck"]:checked');
    if (selectedDeck && !isUserReady) {
      isUserReady = true; // Позначаємо, що користувач готовий
      const deckName = selectedDeck
        .closest("label")
        .querySelector(".deck-name").textContent;

      // Ready confirmation animation
      readyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Готово!';
      readyBtn.style.background = "#10b981"; // Green color
      readyBtn.disabled = true;

      // Update player status - змінюємо статус гравця на "ГОТОВИЙ"
      if (playerStatusEl) {
        playerStatusEl.classList.remove("status-waiting");
        playerStatusEl.classList.add("status-ready");
        playerStatusEl.innerHTML =
          '<i class="fas fa-check-circle"></i><span>ГОТОВИЙ</span>';
      }

      // Show waiting message
      const waitingMsg = document.createElement("div");
      waitingMsg.style.marginTop = "1rem";
      waitingMsg.style.textAlign = "center";
      waitingMsg.style.color = "var(--text-secondary)";
      waitingMsg.style.fontFamily = "'Rajdhani', sans-serif";
      waitingMsg.style.fontSize = "1rem";
      waitingMsg.innerHTML = "Всі гравці готові! Гра скоро розпочнеться...";
      readyBtn.parentNode.appendChild(waitingMsg);
    }
  });

  // Запускаємо відлік автоматично
  startCountdown();
})();
