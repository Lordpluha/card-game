import { gsap } from "https://cdn.skypack.dev/gsap";

// Карти-заглушки
const dummyImages = [
  "https://plus.unsplash.com/premium_photo-1698168385751-4873a712d2f0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8V2FycmlvcnxlbnwwfDF8MHx8fDA%3D", // Warrior
  "https://img.freepik.com/premium-photo/professional-male-archer-action-precision-skill-full-tactical-gear-with-intense-focus_1110513-16217.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740", // Archer
  "https://img.freepik.com/free-photo/portrait-male-scribe-medieval-times_23-2150932226.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740", // Wizard
  "https://img.freepik.com/free-photo/neoclassical-medieval-portrait-knight-illustration_23-2151891945.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740", // Paladin
  "https://img.freepik.com/free-photo/cool-scene-with-futuristic-dragon-beast_23-2151201689.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740", // Ancient Dragon
  "https://i.pinimg.com/736x/1d/4c/2e/1d4c2e4d7ee9341a211e6a5c3836a8ae.jpg", // Battle Healer
  "https://img.freepik.com/free-photo/fantasy-bird-illustration_23-2151496127.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740", // Phoenix
  "https://i.pinimg.com/736x/14/03/77/140377c21b3f03c9e7e0293030871b48.jpg", // Celestial Titan
  "https://img.freepik.com/free-photo/dark-style-ninja-naruto_23-2151278544.jpg?ga=GA1.1.417894905.1739286241&semt=ais_hybrid&w=740", // Shadow Assassin
  "https://i.pinimg.com/736x/87/b5/96/87b596929e5804d5cbcd637c7a18ff71.jpg", // Forest Spirit
];

// Мапа кількості карт у паку
const packSizes = {
  common: 3,
  rare: 5,
  epic: 5,
  legendary: 7,
};

// Основна функція
window.openPack = function (type = "common") {
  const modal = document.getElementById("packModal");
  const title = document.getElementById("packTitle");
  const container = document.getElementById("packCards");

  title.textContent = `Opening ${
    type.charAt(0).toUpperCase() + type.slice(1)
  } Pack`;
  container.innerHTML = "";

  const count = packSizes[type] || 3;
  const selected = dummyImages.sort(() => 0.5 - Math.random()).slice(0, count);

  selected.forEach((imgUrl, i) => {
    const card = document.createElement("div");
    card.className = "pack-card opacity-0 scale-75";
    card.innerHTML = `<img src="${imgUrl}" class="rounded shadow-md border border-[var(--color-accent-dark)]" />`;
    container.appendChild(card);
  });

  modal.classList.remove("hidden");

  // Анімація
  gsap.to(".pack-card", {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    stagger: 0.15,
    ease: "back.out(1.7)",
  });
};

window.closePack = function () {
  const modal = document.getElementById("packModal");
  modal.classList.add("hidden");
};
