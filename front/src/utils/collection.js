// надо будет в отдельный модуль вынести

/*************** 1. DATA ************************************************/
// Master list of all cards (keep aspect 300×420 for base images)
const allCards = [
  {
    id: 1,
    name: "Warrior",
    rarity: "common",
    health: 50,
    attack: 45,
    defense: 60,
    image:
      "https://plus.unsplash.com/premium_photo-1698168385751-4873a712d2f0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8V2FycmlvcnxlbnwwfDF8MHx8fDA%3D",
  },
  {
    id: 2,
    name: "Archer",
    rarity: "uncommon",
    health: 40,
    attack: 65,
    defense: 35,
    image:
      "https://img.freepik.com/premium-photo/professional-male-archer-action-precision-skill-full-tactical-gear-with-intense-focus_1110513-16217.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740",
  },
  {
    id: 3,
    name: "Wizard",
    rarity: "rare",
    health: 35,
    attack: 80,
    defense: 25,
    image:
      "https://img.freepik.com/free-photo/portrait-male-scribe-medieval-times_23-2150932226.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740",
  },
  {
    id: 4,
    name: "Paladin",
    rarity: "epic",
    health: 70,
    attack: 55,
    defense: 80,
    image:
      "https://img.freepik.com/free-photo/neoclassical-medieval-portrait-knight-illustration_23-2151891945.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740",
  },
  {
    id: 5,
    name: "Ancient Dragon",
    rarity: "legendary",
    health: 120,
    attack: 90,
    defense: 75,
    image:
      "https://img.freepik.com/free-photo/cool-scene-with-futuristic-dragon-beast_23-2151201689.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740",
  },
  {
    id: 6,
    name: "Battle Healer",
    rarity: "rare",
    health: 60,
    attack: 40,
    defense: 50,
    image:
      "https://i.pinimg.com/736x/1d/4c/2e/1d4c2e4d7ee9341a211e6a5c3836a8ae.jpg",
  },
  {
    id: 7,
    name: "Phoenix",
    rarity: "legendary",
    health: 90,
    attack: 70,
    defense: 60,
    image:
      "https://img.freepik.com/free-photo/fantasy-bird-illustration_23-2151496127.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740",
  },
  {
    id: 8,
    name: "Celestial Titan",
    rarity: "mythic",
    health: 150,
    attack: 120,
    defense: 110,
    image:
      "https://i.pinimg.com/736x/14/03/77/140377c21b3f03c9e7e0293030871b48.jpg",
  },
  {
    id: 9,
    name: "Shadow Assassin",
    rarity: "epic",
    health: 55,
    attack: 95,
    defense: 30,
    locked: true, // ← карта закрыта
    image:
      "https://img.freepik.com/free-photo/dark-style-ninja-naruto_23-2151278544.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740",
  },
  {
    id: 10,
    name: "Forest Spirit",
    rarity: "mythic",
    health: 130,
    attack: 70,
    defense: 120,
    locked: true, // ← карта закрыта
    image:
      "https://i.pinimg.com/736x/87/b5/96/87b596929e5804d5cbcd637c7a18ff71.jpg",
  },
];
// Build quick lookup
const cardMap = Object.fromEntries(allCards.map((c) => [c.id, c]));
const getCard = (id) => cardMap[id] || null;
const getCardImage = (id, fallback = "Card") =>
  getCard(id)?.image ??
  `https://via.placeholder.com/300x420/333333/ffffff?text=${fallback}`;

/*************** 2. STATE **********************************************/
let currentDeck = [];
let savedDecks = {
  deck1: {
    name: "Battle Mages",
    cards: [
      { id: 3, name: "Mage" },
      { id: 4, name: "Paladin" },
      { id: 5, name: "Ancient Dragon" },
      { id: 7, name: "Phoenix" },
      { id: 3, name: "Mage" },
      { id: 6, name: "Battle Healer" },
      { id: 4, name: "Paladin" },
      { id: 5, name: "Ancient Dragon" },
    ],
  },
  deck2: {
    name: "Fast Attack",
    cards: [
      { id: 1, name: "Warrior" },
      { id: 2, name: "Archer" },
      { id: 2, name: "Archer" },
      { id: 6, name: "Battle Healer" },
      { id: 1, name: "Warrior" },
      { id: 2, name: "Archer" },
    ],
  },
};

/*************** 3. UI HELPERS *****************************************/
function getRarityTextColor(rarity) {
  switch (rarity) {
    case "common":
      return "text-gray-400";
    case "uncommon":
      return "text-green-400";
    case "rare":
      return "text-blue-400";
    case "epic":
      return "text-purple-400";
    case "legendary":
      return "text-yellow-400";
    case "mythic":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

function getCardStats(id) {
  const c = getCard(id);
  return c
    ? { health: c.health, attack: c.attack, defense: c.defense }
    : { health: 50, attack: 50, defense: 50 };
}

/*************** 4. TABS ***********************************************/
function switchTab(tabName) {
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
  document.getElementById(`${tabName}Tab`).classList.remove("hidden");
}

/*************** 5. CARD DETAILS MODAL *********************************/
function showCardDetails(
  name,
  rarity,
  description,
  health,
  attack,
  defense,
  id,
  isLocked = false
) {
  const m = document.getElementById("cardDetailsModal");
  const img = document.getElementById("detailCardImage");
  const nm = document.getElementById("detailCardName");
  const rt = document.getElementById("detailCardRarity");
  const ds = document.getElementById("detailCardDescription");
  const hp = document.getElementById("detailCardHealth");
  const at = document.getElementById("detailCardAttack");
  const df = document.getElementById("detailCardDefense");
  const hb = document.getElementById("detailCardHealthBar");
  const ab = document.getElementById("detailCardAttackBar");
  const db = document.getElementById("detailCardDefenseBar");
  const cb = document.getElementById("craftButtonContainer");

  nm.textContent = name;
  rt.textContent = rarity.charAt(0).toUpperCase() + rarity.slice(1);
  rt.className = `text-sm mb-2 ${getRarityTextColor(rarity)}`;
  ds.textContent = description;
  hp.textContent = health;
  at.textContent = attack;
  df.textContent = defense;

  const MH = 150,
    MA = 120,
    MD = 110;
  hb.style.width = `${(health / MH) * 100}%`;
  ab.style.width = `${(attack / MA) * 100}%`;
  db.style.width = `${(defense / MD) * 100}%`;

  img.innerHTML = `<img src="${getCardImage(
    id,
    name
  )}" class="w-full h-full object-cover ${isLocked ? "locked-image" : ""}">`;
  cb.classList.toggle("hidden", !isLocked);
  m.classList.remove("hidden");
}
function closeCardDetails() {
  document.getElementById("cardDetailsModal").classList.add("hidden");
}

/*************** 6. DECK BUILDING **************************************/
function addCardToDeck(el) {
  if (currentDeck.length >= 8) {
    alert("Deck is full (8 cards max)");
    return;
  }
  const id = +el.dataset.cardId,
    nm = el.dataset.cardName;
  if (currentDeck.some((c) => c.id === id)) {
    alert(`${nm} already in deck`);
    return;
  }
  currentDeck.push({ id, name: nm });
  updateDeckDisplay();
}
function removeCardFromDeck(i) {
  currentDeck.splice(i, 1);
  updateDeckDisplay();
}

function updateDeckDisplay() {
  const dc = document.getElementById("currentDeckCards");
  document.getElementById("currentDeckSize").textContent = currentDeck.length;
  dc.innerHTML = "";
  if (!currentDeck.length) {
    dc.innerHTML = `<div class="flex items-center justify-center h-[100px] text-gray-500 col-span-full">Select cards to build your deck</div>`;
    return;
  }
  currentDeck.forEach((c, i) => {
    const d = document.createElement("div");
    d.className =
      "card rarity-common rounded-lg overflow-hidden cursor-pointer relative";
    d.innerHTML = `<div class="relative pt-[140%]"><img src="${getCardImage(
      c.id,
      c.name
    )}" class="absolute inset-0 w-full h-full card-image"><button class="absolute top-1 right-1 bg-red-500/80 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs" onclick="removeCardFromDeck(${i})">×</button></div><div class="p-1"><h3 class="text-xs font-medium text-center text-white">${
      c.name
    }</h3></div>`;
    dc.appendChild(d);
  });
}

/*************** 7. SAVE/CANCEL DECK **********************************/
function saveCurrentDeck() {
  const name = document.getElementById("deckNameInput").value.trim();
  if (!name) {
    alert("Enter a deck name");
    return;
  }
  if (currentDeck.length < 3) {
    alert("Deck needs at least 3 cards");
    return;
  }
  let existing = Object.entries(savedDecks).find(
    ([, d]) => d.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    if (!confirm(`Deck '${name}' exists. Overwrite?`)) return;
    savedDecks[existing[0]].cards = [...currentDeck];
  } else {
    savedDecks[`deck_${Date.now()}`] = { name, cards: [...currentDeck] };
  }
  currentDeck = [];
  updateDeckDisplay();
  document.getElementById("deckNameInput").value = "";
  displaySavedDecks();
}
function cancelDeckEditing() {
  currentDeck = [];
  updateDeckDisplay();
  document.getElementById("deckNameInput").value = "";
  alert("Deck editing canceled");
}

/*************** 8. COLLECTION GRID ************************************/
function updateCollectionDisplay(cards) {
  const ct = document.getElementById("unlockedTab");
  ct.innerHTML = "";
  if (!cards.length) {
    ct.innerHTML = `<div class="flex items-center justify-center h-[100px] text-gray-500 col-span-full">No cards match filters</div>`;
    return;
  }
  const g = document.createElement("div");
  g.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4";
  ct.appendChild(g);
  cards.forEach((c) => {
    const rc = `rarity-${c.rarity}`;
    const e = document.createElement("div");
    e.className = `card ${rc} rounded-lg overflow-hidden cursor-pointer`;
    e.setAttribute(
      "onclick",
      `showCardDetails('${c.name}','${c.rarity}','A ${
        c.rarity
      } ${c.name.toLowerCase()} card.',${c.health},${c.attack},${c.defense},${
        c.id
      })`
    );
    e.innerHTML = `<div class="relative pt-[140%]"><img src="${getCardImage(
      c.id,
      c.name
    )}" class="absolute inset-0 w-full h-full object-cover card-image"></div><div class="p-2 text-center"><h3 class="font-medium text-white">${
      c.name
    }</h3><p class="rarity-label ${getRarityTextColor(c.rarity)}">${
      c.rarity.charAt(0).toUpperCase() + c.rarity.slice(1)
    }</p></div>`;
    g.appendChild(e);
  });
}

/*************** 9. SAVED DECKS ****************************************/
function displaySavedDecks() {
  const ct = document.getElementById("savedDecks");
  ct.innerHTML = "";
  if (!Object.keys(savedDecks).length) {
    ct.innerHTML = `<div class="bg-gray-900/50 rounded-lg p-4 col-span-full"><p class="text-gray-400 text-center">You don't have any saved decks yet</p></div>`;
    return;
  }
  Object.entries(savedDecks).forEach(([id, d]) => {
    const b = document.createElement("div");
    b.className = "bg-gray-900/50 rounded-lg p-4 border border-indigo-900/50";
    let h = `<div class="flex justify-between items-center mb-2"><h4 class="text-lg font-medium text-teal-300">${d.name}</h4><div class="flex space-x-2"><button class="text-xs px-2 py-1 bg-indigo-900/50 text-indigo-200 rounded" onclick="loadDeck('${id}')">Edit</button><button class="text-xs px-2 py-1 bg-indigo-900/50 text-indigo-200 rounded" onclick="deleteDeck('${id}')">Delete</button></div></div><p class="text-sm text-gray-400 mb-2">${d.cards.length} cards</p>`;
    let p = `<div class="grid grid-cols-4 md:grid-cols-8 gap-1">`;
    d.cards.forEach((c) => {
      p += `<div class="card rarity-${
        getCard(c.id).rarity || "common"
      } rounded-lg overflow-hidden transform scale-90"><div class="relative pt-[140%]"><img src="${getCardImage(
        c.id,
        c.name
      )}" class="absolute inset-0 w-full h-full object-cover"></div></div>`;
    });
    p += "</div>";
    b.innerHTML = h + p;
    ct.appendChild(b);
  });
}

/*************** 10. LOAD/DELETE DECKS *********************************/
function loadDeck(id) {
  const d = savedDecks[id];
  if (!d) return;
  currentDeck = [...d.cards];
  document.getElementById("deckNameInput").value = d.name;
  updateDeckDisplay();
  switchTab("decks");
}
function deleteDeck(id) {
  if (confirm(`Delete deck '${savedDecks[id].name}'?`)) {
    delete savedDecks[id];
    displaySavedDecks();
  }
}

/*************** 11. INITIAL LOAD *************************************/
document.addEventListener("DOMContentLoaded", () => {
  switchTab("unlocked"); // как было
  displaySavedDecks(); // как было
  updateCollectionDisplay(allCards);
  renderAvailableCards(); // ➜ начальный рендер доступных карт
});

/*************** 12. FILTER MODAL ************************************/
function openFilterModal() {
  const m = document.getElementById("filterModal");
  m.classList.remove("hidden");
  m.style.display = "flex";
}
function closeFilter() {
  const m = document.getElementById("filterModal");
  m.classList.add("hidden");
  m.style.display = "none";
}
function applyFilters() {
  const sel = Array.from(
    document.querySelectorAll(".filter-rarity:checked")
  ).map((c) => c.dataset.rarity);
  updateCollectionDisplay(allCards.filter((c) => sel.includes(c.rarity)));
  closeFilter();
}
function resetFilters() {
  document
    .querySelectorAll(".filter-rarity")
    .forEach((c) => (c.checked = true));
  updateCollectionDisplay(allCards.filter((c) => !c.locked));
}

/**********************************************************************/

/*************** 8-bis.  ALL CARDS TAB (Unlocked + Locked) ************/
/*  • выводит ВСЕ карты из allCards
    • открытые — кликабельны, закрытые (locked:true) — блюр + замок
    • вызывается единоразово в DOMContentLoaded и при смене фильтров */
function renderAllCardsTab() {
  const wrap = document.getElementById("allTab");
  if (!wrap) return;

  // контейнер-решётка (чистим предыдущий вывод)
  wrap.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4";
  wrap.appendChild(grid);

  allCards.forEach((c) => {
    const rarityClass = `rarity-${c.rarity}`;
    const locked = !!c.locked; // Boolean приведения
    const lockHTML = locked
      ? `<div class="absolute inset-0 bg-black/60 flex items-center justify-center">
           <i class="fas fa-lock text-2xl text-white/80"></i>
         </div>`
      : ""; // у открытых — пусто

    grid.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card ${rarityClass} rounded-lg overflow-hidden
                  ${locked ? "cursor-default" : "cursor-pointer"}"
           ${
             locked
               ? ""
               : `
             onclick="showCardDetails('${c.name}','${c.rarity}',
                      'A ${c.rarity} ${c.name.toLowerCase()} card.',
                      ${c.health},${c.attack},${c.defense},${c.id},false)"`
           }>
        <div class="relative pt-[140%]">
          <img src="${getCardImage(c.id, c.name)}"
               class="absolute inset-0 w-full h-full object-cover
                      ${locked ? "locked-image" : ""}">
          ${lockHTML}
        </div>
        <div class="p-2 text-center">
          <h3 class="font-medium text-white">${c.name}</h3>
          <p class="rarity-label ${getRarityTextColor(c.rarity)}">
             ${c.rarity[0].toUpperCase() + c.rarity.slice(1)}
          </p>
        </div>
      </div>`
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  switchTab("unlocked");
  displaySavedDecks();
  updateCollectionDisplay(allCards.filter((c) => !c.locked));
  renderAllCardsTab(); // вкладка All  ← новая строка
});

function renderAvailableCards() {
  const grid = document.getElementById("availableCards");
  if (!grid) return; // контейнер не найден

  grid.innerHTML = ""; // очистили

  // id-шники карт, которые уже в колоде
  const deckIds = currentDeck.map((c) => c.id);

  // пробегаем по всем картам → берём только открытые и не в колоде
  allCards
    .filter((c) => !c.locked && !deckIds.includes(c.id))
    .forEach((card) => {
      const el = document.createElement("div");
      el.className = `card rarity-${card.rarity} rounded-lg overflow-hidden cursor-pointer`;
      el.dataset.cardId = card.id;
      el.dataset.cardName = card.name;
      el.onclick = () => addCardToDeck(el); // вызов уже готовой функции

      el.innerHTML = `
        <div class="relative pt-[140%]">
          <img src="${card.image}"
               class="absolute inset-0 w-full h-full object-cover card-image">
        </div>
        <div class="p-1 text-center">
          <h3 class="text-xs font-medium text-white">${card.name}</h3>
        </div>`;

      grid.appendChild(el);
    });
}
