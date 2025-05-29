import CardsService from "../api/Cards.service.js";
window.CardsService = CardsService;
/*************** 1. DATA ************************************************/
// Master list of all cards (keep aspect 300×420 for base images)
window.allCards = [];
window.unlockedCards = [];
let userCards = [];
import UserService from "../api/User.service.js";

// Build dynamic lookup
let cardMap = {};
const getCard = (id) => cardMap[id] || null;
const getCardImage = (id, fallback = "Card") =>
  getCard(id)?.image_url || fallback;

/*************** 3. UI HELPERS *****************************************/
window.getRarityTextColor = function (type) {
  switch (type) {
    case "COMMON":
      return "text-gray-400";
    case "RARE":
      return "text-blue-400";
    case "EPIC":
      return "text-purple-400";
    case "MYTHICAL":
      return "text-red-400";
    case "LEGENDARY":
      return "text-yellow-400";
    default:
      return "text-gray-400";
  }
};

function getCardStats(id) {
  const c = getCard(id);
  return c
    ? { cost: c.cost, attack: c.attack, defense: c.defense }
    : { cost: 50, cost: 50, defense: 50 };
}

/*************** 4. TABS ***********************************************/
window.switchTab = function (tabName) {
  document
    .querySelectorAll(".collection-tab")
    .forEach((tab) => tab.classList.add("hidden"));

  document.querySelectorAll("#collectionTabs button").forEach((btn) => {
    btn.classList.toggle(
      "bg-indigo-900",
      btn.textContent.toLowerCase().includes(tabName.toLowerCase())
    );
    btn.classList.toggle(
      "bg-gray-800",
      !btn.textContent.toLowerCase().includes(tabName.toLowerCase())
    );
  });

  document.getElementById(`${tabName}Tab`)?.classList.remove("hidden");
};

/*************** 5. CARD DETAILS MODAL *********************************/
function showCardDetails(card, options = {}) {
  const {
    name = "Unknown",
    type = "COMMON",
    description = "—",
    cost = 0,
    attack = 0,
    defense = 0,
    id = 0,
    image_url = "",
    isLocked = false,
  } = card;

  const readonly = options.readonly || false;

  const m = document.getElementById("cardDetailsModal");
  const img = document.getElementById("detailCardImage");
  const nm = document.getElementById("detailCardName");
  const rt = document.getElementById("detailCardRarity");
  const ds = document.getElementById("detailCardDescription");
  const at = document.getElementById("detailCardAttack");
  const df = document.getElementById("detailCardDefense");
  const ab = document.getElementById("detailCardAttackBar");
  const db = document.getElementById("detailCardDefenseBar");
  const cb = document.getElementById("craftButtonContainer");
  const upgradeBtn = document.getElementById("upgradeBtn");
  const costEl = document.getElementById("detailCardCost");

  costEl.textContent = cost;
  nm.textContent = name;
  rt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
  rt.className = `text-sm mb-2 ${getRarityTextColor(type)}`;
  ds.textContent = description;
  at.textContent = `${attack} / 100`;
  df.textContent = `${defense} / 100`;

  ab.style.width = `${Math.min((attack / 100) * 100, 100)}%`;
  db.style.width = `${Math.min((defense / 100) * 100, 100)}%`;

  img.innerHTML = `<img src="${image_url}" class="w-full h-full object-cover ${
    isLocked ? "locked-image" : ""
  }">`;

  // 👇 прокачка доступна тільки якщо не readonly
  upgradeBtn.classList.toggle("hidden", readonly || isLocked);
  upgradeBtn.disabled = readonly || (attack >= 100 && defense >= 100);
  upgradeBtn.textContent =
    attack >= 100 && defense >= 100 ? "Максимум 💯" : "Прокачать за 50 💰";

  cb.classList.toggle("hidden", isLocked);
  m.classList.remove("hidden");

  window.selectedCardForUpgrade = readonly ? null : card;
}

function closeCardDetails() {
  document.getElementById("cardDetailsModal").classList.add("hidden");
}

/*************** 8. COLLECTION GRID ************************************/
function updateCollectionDisplay(cards) {
  const ct = document.getElementById("unlockedTab");
  const uniqueCards = Array.from(new Map(cards.map((c) => [c.id, c])).values());
  ct.innerHTML = "";

  if (!uniqueCards.length) {
    ct.innerHTML = `<div class="flex items-center justify-center h-[100px] text-gray-500 col-span-full">No cards match filters</div>`;
    return;
  }

  const g = document.createElement("div");
  g.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4";
  ct.appendChild(g);

  uniqueCards.forEach((c) => {
    const rc = `rarity-${c.type.toLowerCase()}`;
    const e = document.createElement("div");
    e.className = `card ${rc} rounded-lg overflow-hidden cursor-pointer`;

    e.innerHTML = `
    <div class="relative pt-[140%]">
      <img src="${
        c.image_url
      }" class="absolute inset-0 w-full h-full object-cover card-image">
      <div class="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">x${
        c.count || 1
      }</div>
    </div>
    <div class="p-2 text-center">
      <h3 class="font-medium text-white">${c.name}</h3>
      <p class="rarity-label ${getRarityTextColor(c.type)}">
        ${c.type.charAt(0).toUpperCase() + c.type.slice(1)}
      </p>
    </div>
  `;

    // 👇 Тут вставляємо логіку вибору або показу
    if (document.getElementById("unlockedTab") && !e.closest("#allTab")) {
      if (selectedForMerge.some((s) => s.id === c.id)) {
        e.classList.add("ring-4", "ring-yellow-400");
      }
    } else {
      e.addEventListener("click", () => showCardDetails(c));
    }

    g.appendChild(e); // 👈 додаємо в DOM після
    e.addEventListener("click", () => {
      if (isMergeMode) {
        const idx = selectedForMerge.findIndex((s) => s.id === c.id);
        if (idx !== -1) {
          selectedForMerge.splice(idx, 1);
        } else if (selectedForMerge.length < 2) {
          selectedForMerge.push(c);
        }
        renderMergeSelection();
        updateCollectionDisplay(unlockedCards); // оновити підсвітку
      } else {
        showCardDetails(c);
      }
    });
    if (isMergeMode && selectedForMerge.find((s) => s.id === c.id)) {
      e.classList.add("ring-4", "ring-yellow-400");
    }
  });
}

/*************** 11. INITIAL LOAD *************************************/
let selectedForMerge = [];
let isMergeMode = false;
document.addEventListener("DOMContentLoaded", async () => {
  const [all, my] = await Promise.all([
    CardsService.getAll(),
    CardsService.getMyCards(),
  ]);

  const user = await UserService.getUser(); // 👈 Получаем пользователя
  document.getElementById("user-coins").textContent = user.coins; // 💰 Обновляем UI
  document.getElementById("user-coins-2").textContent = user.coins; // 💰 Обновляем UI

  allCards = all;
  unlockedCards = my.map((mc) => {
    const full = all.find((c) => Number(c.id) === Number(mc.id));
    return { ...full, ...mc }; // змерджили все — stats + count
  });

  // 🔄 Мапа для швидкого доступу
  cardMap = Object.fromEntries(allCards.map((c) => [Number(c.id), c]));

  // 🔐 Відзначаємо locked карти
  const unlockedIds = new Set(unlockedCards.map((c) => String(c.id)));
  allCards.forEach((c) => {
    c.locked = true;
  });
  unlockedCards.forEach((uc) => {
    const match = allCards.find((c) => String(c.id) === String(uc.id));
    if (match) match.locked = false;
  });

  console.log("✅ allCards:", allCards);
  console.log("✅ unlockedCards:", unlockedCards);

  window.switchTab("unlocked");
  updateCollectionDisplay(unlockedCards); // 👈 показати розблоковані
  renderAllCardsTab(); // 👈 показати всі

  function renderMergeSelection() {
    const container = document.getElementById("mergeSelectedCards");
    const btn = document.getElementById("mergeBtn");
    container.innerHTML = "";

    selectedForMerge.forEach((card) => {
      const div = document.createElement("div");
      div.className =
        "border border-yellow-400 p-2 bg-gray-800 rounded max-w-[64px] w-100 h-100";
      div.innerHTML = `
      <img src="${card.image_url}" class="w-16 h-20 object-cover" />
      <p class="text-xs text-center mt-1 text-white">${card.name}</p>
    `;
      container.appendChild(div);
    });

    btn.disabled = selectedForMerge.length !== 2;
  }
  window.renderMergeSelection = renderMergeSelection;

  window.toggleMergeSelect = function (card) {
    const idx = selectedForMerge.findIndex((c) => c.id === card.id);
    if (idx !== -1) {
      selectedForMerge.splice(idx, 1);
    } else if (selectedForMerge.length < 2) {
      selectedForMerge.push(card);
    }
    renderMergeSelection();
    updateCollectionDisplay(unlockedCards); // ⚠️ оновити, щоб підсвітити
  };
});

document.getElementById("mergeSelectToggle").addEventListener("click", () => {
  isMergeMode = !isMergeMode;
  selectedForMerge = [];
  renderMergeSelection();
  updateCollectionDisplay(unlockedCards);

  const toggleBtn = document.getElementById("mergeSelectToggle");
  toggleBtn.textContent = isMergeMode
    ? "❌ Вийти з режиму злиття"
    : "Вибрати карти для злиття";
});

document.getElementById("mergeBtn").addEventListener("click", async () => {
  const ids = selectedForMerge.map((c) => c.id);
  try {
    const data = await CardsService.merge(ids); // data ← это уже JSON

    if (data.message) throw new Error(data.message || "Помилка злиття");

    alert("✅ Карти успішно злиті!");

    // 🧼 Очистити і оновити колекцію
    selectedForMerge = [];
    renderMergeSelection();
    unlockedCards = [
      ...unlockedCards.filter((c) => !ids.includes(c.id)),
      data.card,
    ];
    updateCollectionDisplay(unlockedCards);
    renderAllCardsTab();

    // 💰 Оновити кількість монет
    const user = await UserService.getUser();
    document.getElementById("user-coins").textContent = user.coins;
    document.getElementById("user-coins-2").textContent = user.coins;
  } catch (err) {
    alert(`❌ ${err.message}`);
  }
});

/*************** 8-bis.  ALL CARDS TAB (Unlocked + Locked) ************/
/*  • выводит ВСЕ карты из allCards
    • открытые — кликабельны, закрытые (locked:true) — блюр + замок
    • вызывается единоразово в DOMContentLoaded и при смене фильтров */
function renderAllCardsTab() {
  const wrap = document.getElementById("allTab");
  if (!wrap) return;

  wrap.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4";
  wrap.appendChild(grid);

  const openedNames = new Set(unlockedCards.map((c) => c.name));

  allCards.forEach((card) => {
    const isLocked = !openedNames.has(card.name);
    const rarityClass = `rarity-${card.type.toLowerCase()}`;

    const lockHTML = isLocked
      ? `<div class="absolute inset-0 bg-black/60 flex items-center justify-center">
           <i class="fas fa-lock text-2xl text-white/80"></i>
         </div>`
      : "";

    const el = document.createElement("div");
    el.className = `card ${rarityClass} rounded-lg overflow-hidden cursor-pointer`;
    el.innerHTML = `
      <div class="relative pt-[140%]">
        <img src="${escapeForHtmlAttr(card.image_url)}"
             class="absolute inset-0 w-full h-full object-cover ${
               isLocked ? "locked-image" : ""
             }">
        ${lockHTML}
      </div>
      <div class="p-2 text-center">
        <h3 class="font-medium text-white">${card.name}</h3>
        <p class="rarity-label ${getRarityTextColor(card.type)}">
          ${card.type[0].toUpperCase() + card.type.slice(1)}
        </p>
      </div>
    `;

    el.addEventListener("click", () => {
      showCardDetails({ ...card, isLocked: true }, { readonly: true });
    });

    grid.appendChild(el);
  });
}

function escapeForHtmlAttr(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

document.getElementById("upgradeBtn").addEventListener("click", async () => {
  const card = window.selectedCardForUpgrade;
  if (!card) return;

  if (card.attack >= 100 && card.defense >= 100) {
    alert("Ця карта вже прокачана до максимуму!");
    return;
  }

  const user = await UserService.getUser();

  if (user.coins < 50) {
    alert("Не вистачає монет 😢");
    return;
  }

  try {
    const upgraded = await CardsService.upgrade(card.id);

    // 🔁 Обновляем монеты
    const newUser = await UserService.getUser();
    document.getElementById("user-coins").textContent = newUser.coins;
    document.getElementById("user-coins-2").textContent = newUser.coins;

    // 🔁 Обновляем карточку в allCards
    const index = allCards.findIndex((c) => c.id === card.id);
    if (index !== -1) allCards[index] = upgraded;

    // 💾 Обновляем selected
    window.selectedCardForUpgrade = upgraded;

    // 🔁 Перерисовываем
    showCardDetails(upgraded);
    updateCollectionDisplay(unlockedCards);
  } catch (err) {
    alert("Помилка під час оновлення карти");
  }
});

window.closeCardDetails = closeCardDetails;

window.showCardDetails = showCardDetails;
window.updateCollectionDisplay = updateCollectionDisplay;
window.renderAllCardsTab = renderAllCardsTab;
