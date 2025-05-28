// (() => {
//   const readyBtn = document.getElementById("readyBtn");
//   const deckCards = document.querySelectorAll(".deck-card");
//   const radios = document.querySelectorAll('input[name="deck"]');
//   const playerStatusEl = document.querySelector(
//     ".player-card:nth-child(2) .player-status"
//   );

//   // Обновление UI по колодам
//   function updateDeckSelectionUI() {
//     const selected = Array.from(radios).some((r) => r.checked);
//     readyBtn.disabled = !selected;
//     readyBtn.classList.toggle("active", selected);

//     deckCards.forEach((card) => {
//       const input = card.querySelector('input[type="radio"]');
//       card.classList.toggle("selected", input.checked);
//     });
//   }

//   radios.forEach((radio) => {
//     radio.addEventListener("change", updateDeckSelectionUI);
//   });

//   deckCards.forEach((card) => {
//     card.addEventListener("click", () => {
//       const radio = card.querySelector('input[type="radio"]');
//       radio.checked = true;
//       radio.dispatchEvent(new Event("change"));
//     });
//   });

//   readyBtn.addEventListener("click", () => {
//     const selectedDeck = document.querySelector('input[name="deck"]:checked');
//     if (selectedDeck && !isUserReady) {
//       isUserReady = true;

//       readyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Готово!';
//       readyBtn.style.background = "#10b981";
//       readyBtn.disabled = true;

//       if (playerStatusEl) {
//         playerStatusEl.classList.remove("status-waiting");
//         playerStatusEl.classList.add("status-ready");
//         playerStatusEl.innerHTML =
//           '<i class="fas fa-check-circle"></i><span>ГОТОВИЙ</span>';
//       }

//       startBtn.classList.remove("hidden");
//     }
//   });

//   updateDeckSelectionUI(); // вызов сразу
// })();
