import CardsService from "../api/Cards.service.js";
import UserService from "../api/User.service.js";

/** Global variables in window object */
window.socket = null;
window.game = { id: null };

function initWebSocket() {
  console.log("📡 Connecting WebSocket...");
  window.socket = new WebSocket("ws://localhost:8080/gaming");

  window.socket.onopen = () => {
    // Если есть gameId в URL, то присоединяемся к игре, в другом случае создаем новую
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get("gameId");

    if (gameId) {
      try {
        window.socket.send(
          JSON.stringify({ event: "joinGame", payload: { gameId } })
        );
        window.game.id = gameId;
      } catch (e) {
        console.error("❌ Error joining game:", e);
      }
    } else {
      try {
        window.socket.send(JSON.stringify({ event: "createGame" }));
      } catch (e) {
        console.error("❌ Error creating game:", e);
      }
    }
  };

  window.socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    switch (data.event) {
      case "gameCreated":
        // add gameId to URL params
        window.game = data.game;
        const u = new URL(window.location.href);
        u.searchParams.set("gameId", window.game.id);
        window.history.replaceState(null, "", u);

        updateUI(data.game);
        break;
      case "playerJoined":
        updateUI(data.game);
        break;
      case "deckSelected":
        // mark the player who selected as ready
        if (data.player === myId) {
          document.getElementById("p1-status").className =
            "player-status status-ready";
          document.getElementById("p1-status").innerHTML =
            '<i class="fas fa-check-circle"></i><span>ГОТОВИЙ</span>';
        } else {
          document.getElementById("p2-status").className =
            "player-status status-ready";
          document.getElementById("p2-status").innerHTML =
            '<i class="fas fa-check-circle"></i><span>ГОТОВИЙ</span>';
        }
        break;
      case "gameStarted":
        console.log("🚀 Game has started!");
        window.location.href = `/pages/battle-field.html?gameId=${game.id}`;
        break;
      case "decksSelected": {
        // save updated game state
        window.game = data.game;
        const sb = document.getElementById("startBtn");
        // only show/enable to the host
        if (sb && window.game.host_user_id === myId) {
          sb.classList.remove("hidden");
          sb.disabled = false;
        }
        break;
      }
      case "error":
        console.error("❌ WS ERROR:", data.message);
        break;
      default:
        console.warn("⚠️ Unknown WS event:", data.event);
    }
  };

  window.socket.onerror = (err) =>
    console.error("❌ WS connection error:", err);
  window.socket.onclose = () => console.warn("🔌 WS connection closed");
}

async function init() {
  await renderDeckCards();
  setupUIInteractions();
  initWebSocket();
}

// Load user cards for deck selection
const renderDeckCards = async () => {
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
};

// store current user id for status updates
let myId;
UserService.getUser()
  .then((u) => (myId = u.id))
  .catch(() => {
		AuthService.refresh()
			.then(() => {
				window.location.reload();
			})
			.catch(() => {
				myId = null
			})
	});

async function updateUI(game) {
  const players = game.game_state?.players || {};
  const [p1, p2] = game.user_ids;

  const isHost = myId === p1;
  const me = isHost ? p1 : p2;
  const opponent = isHost ? p2 : p1;

  const meInfo = players[me] || {};
  const oppInfo = players[opponent] || {};

  // Я зліва
  document.getElementById("p1-name").textContent = meInfo.username || "Ви";
  document.getElementById("p1-avatar").src =
    meInfo.avatar_url || "/assets/empty-avatar.png";
  document.getElementById("p1-status").textContent = game.game_state?.decks?.[
    me
  ]
    ? "🟢 Ready"
    : "🟡 Waiting";

  document.getElementById("game-code").textContent = game.game_code;

  // Противник справа
  if (oppInfo.username) {
    document.getElementById("p2-name").textContent = oppInfo.username;
    document.getElementById("p2-avatar").src =
      oppInfo.avatar_url || "/assets/empty-avatar.png";
    document.getElementById("p2-status").textContent = game.game_state?.decks?.[
      opponent
    ]
      ? "🟢 Ready"
      : "🟡 Waiting";
  } else {
    document.getElementById("p2-name").textContent = "Waiting...";
    document.getElementById("p2-avatar").src = "/assets/empty-avatar.png";
    document.getElementById("p2-status").textContent = "🟡 Waiting";
  }

  // highlight ready button if this user has already selected a deck
  const readyBtn = document.getElementById("readyBtn");
  if (game.game_state.decks[me]) {
    readyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Done!';
    readyBtn.style.background = "#10b981";
    readyBtn.disabled = true;
  }

  // reflect and lock selected cards on reload
  const myDeck = game.game_state.decks[me] || [];
  const deckCards = document.querySelectorAll(".deck-card");
  deckCards.forEach((card) => {
    const input = card.querySelector('input[type="checkbox"]');
    const cid = Number(input.value);
    if (myDeck.includes(cid)) {
      input.checked = true;
      card.classList.add("selected");
    }
    // disable all inputs so user can't change selection
    input.disabled = Boolean(myDeck.length);
  });
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
  startBtn.disabled = true; // ← new: always disabled initially
  startBtn.innerHTML = '<i class="fas fa-play"></i> Start game';
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
    const selectedIds = Array.from(checkboxes)
      .filter((c) => c.checked)
      .map((c) => Number(c.value));

    // 1) tell server our deck choice
    window.socket.send(
      JSON.stringify({
        event: "selectDeck",
        payload: { gameId: window.game.id, cardIds: selectedIds },
      })
    );

    isUserReady = true;
    readyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Ready!';
    readyBtn.style.background = "#10b981";
    readyBtn.disabled = true;

    if (playerStatusEl) {
      playerStatusEl.classList.remove("status-waiting");
      playerStatusEl.classList.add("status-ready");
      playerStatusEl.innerHTML =
        '<i class="fas fa-check-circle"></i><span>READY</span>';
    }

    const waitingMsg = document.createElement("div");
    waitingMsg.style.marginTop = "1rem";
    waitingMsg.style.textAlign = "center";
    waitingMsg.style.color = "var(--text-secondary)";
    waitingMsg.style.fontFamily = "'Rajdhani', sans-serif";
    waitingMsg.style.fontSize = "1rem";
    waitingMsg.innerHTML = "All players are ready! The game will start soon...";
    readyBtn.parentNode.appendChild(waitingMsg);
  });

  startBtn.addEventListener("click", () => {
    // host starts the game
    window.socket.send(
      JSON.stringify({
        event: "startGame",
        payload: { gameId: window.game.id },
      })
    );
  });

  updateButtonState();
  updateSelectedDeckUI();
}

// після динамической вставки карточек запускаем логику WS і UI
init();
