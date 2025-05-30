import { gsap } from "https://cdn.skypack.dev/gsap";
import CardsService from "../api/Cards.service.js";
// Мапа кількості карт у паку
const packSizes = {
  common: 3,
  rare: 5,
  epic: 5,
  legendary: 7,
};
window.openPack = async function () {
  const modal = document.getElementById("packModal");
  const packCards = document.getElementById("packCards");

  packCards.innerHTML = "";
  modal.classList.remove("hidden");

  try {
    const cards = await CardsService.openPack(); // ⬅️ заменили fetch на сервис

    if (!Array.isArray(cards) || cards.length === 0)
      throw new Error("Pack opening failed");

    const newCard = cards[0]; // отображаем первую, можешь заменить на все
    unlockedCards.push(newCard);
    updateCollectionDisplay(unlockedCards);
    renderAllCardsTab();

    const cardEl = document.createElement("div");
    cardEl.className =
      "rounded-lg overflow-hidden transform scale-50 opacity-0 transition duration-700 ease-out bg-gray-900 p-3 shadow-xl";
    cardEl.innerHTML = `
      <div class="relative pt-[140%] mb-2">
        <img src="${newCard.image_url}" 
             class="absolute inset-0 w-full h-full object-cover rounded-lg shadow-lg" />
      </div>
      <h3 class="text-white text-center font-bold text-lg">${newCard.name}</h3>
      <p class="text-center ${getRarityTextColor(newCard.type)} text-sm">${
      newCard.type
    }</p>
    `;
    packCards.appendChild(cardEl);

    setTimeout(() => {
      cardEl.classList.add("scale-100", "opacity-100");
    }, 50);
  } catch (err) {
    console.error(err);
    alert("❌ Помилка при відкритті пака");
  }
};

window.closePack = function (e) {
  const modal = document.getElementById("packModal");
  modal.classList.add("hidden");
  setTimeout(() => {
    location.reload(); // 🔄 обновляем страницу
  }, 1000);
};
