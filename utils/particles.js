// Создание частиц
function createParticles(amount = 40) {
  const wrap = document.querySelector(".cyberpunk-bg");

  for (let i = 0; i < amount; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");

    const size = Math.random() * 6 + 4;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    particle.style.left = `${Math.random() * 100}%`;
    particle.style.bottom = `-${Math.random() * 50}px`;

    particle.style.animationDuration = `${10 + Math.random() * 20}s`;
    particle.style.animationDelay = `${Math.random() * 5}s`;

    wrap.appendChild(particle);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  createParticles(60); // можешь увеличить до 100 если хочешь эпика
});
