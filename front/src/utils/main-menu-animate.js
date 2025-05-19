const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
menuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
});

// Floating cards draggable
const floatingCards = document.querySelectorAll("#floating-cards img");
floatingCards.forEach((card) => {
  let offsetX = 0,
    offsetY = 0,
    isDragging = false;

  card.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - card.getBoundingClientRect().left;
    offsetY = e.clientY - card.getBoundingClientRect().top;
    card.style.transition = "none";
    card.style.zIndex = 1000;
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      card.style.transition = "transform 0.3s ease";
      card.style.zIndex = "";
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    card.style.position = "fixed";
    card.style.left = x + "px";
    card.style.top = y + "px";
    card.style.transform = "rotate(0deg) scale(1.15)";
  });
});

// Particle background animation
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
let width, height;
let particles = [];

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(devicePixelRatio, devicePixelRatio);
}
window.addEventListener("resize", resize);
resize();

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = 1 + Math.random() * 2;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.alpha = 0.1 + Math.random() * 0.3;
    this.alphaChange = 0.002 + Math.random() * 0.003;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha += this.alphaChange;
    if (this.alpha <= 0.1 || this.alpha >= 0.4) this.alphaChange *= -1;
    if (this.x < 0) this.x = width;
    else if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    else if (this.y > height) this.y = 0;
  }
  draw() {
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.size * 6
    );
    gradient.addColorStop(0, `rgba(212, 175, 55, ${this.alpha})`);
    gradient.addColorStop(1, "rgba(212, 175, 55, 0)");
    ctx.fillStyle = gradient;
    ctx.arc(this.x, this.y, this.size * 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles(count) {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  particles.forEach((p) => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animate);
}

initParticles(60);
animate();

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const toggleParticles = document.getElementById("toggleParticles");

settingsBtn.addEventListener("click", () => {
  settingsModal.classList.remove("hidden");
  toggleParticles.checked = !canvas.classList.contains("hidden");
});

settingsCloseBtn.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

toggleParticles.addEventListener("change", (e) => {
  canvas.classList.toggle("hidden", !e.target.checked);
});
