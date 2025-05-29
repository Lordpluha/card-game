// Particle background animation
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
let width, height;
let particles = [];
let animationId = null;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
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
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = Math.random() * 2 - 1;
    this.color = `hsl(${Math.random() * 60 + 180}, 70%, 60%)`;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > width) this.speedX *= -1;
    if (this.y < 0 || this.y > height) this.speedY *= -1;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
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
  
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();
    
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        ctx.strokeStyle = `rgba(99, 102, 241, ${1 - distance / 100})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
  
  animationId = requestAnimationFrame(animate);
}

function startAnimation() {
  if (!animationId) {
    initParticles(40);
    animate();
  }
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Settings modal functionality
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const bgAnimationToggle = document.getElementById("bgAnimationToggle");

// Toggle settings modal
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.remove("hidden");
  bgAnimationToggle.checked = !canvas.classList.contains("hidden");
});

closeSettings.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

// Toggle animation when switch is changed
bgAnimationToggle.addEventListener("change", (e) => {
  const isEnabled = e.target.checked;
  localStorage.setItem('bgAnimationEnabled', isEnabled);
  
  if (isEnabled) {
    canvas.classList.remove("hidden");
    startAnimation();
  } else {
    stopAnimation();
    canvas.classList.add("hidden");
  }
});

// Close modal when clicking outside
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.add("hidden");
  }
});

// Load saved preference
const bgAnimationEnabled = localStorage.getItem('bgAnimationEnabled') !== 'false';
bgAnimationToggle.checked = bgAnimationEnabled;

// Apply initial state
if (bgAnimationEnabled) {
  startAnimation();
} else {
  canvas.classList.add("hidden");
}
