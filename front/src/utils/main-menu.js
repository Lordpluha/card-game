import AuthService from "../api/Auth.service.js";
import UserService from "../api/User.service.js";

// ===== Завантаження даних користувача =====
UserService.getUser()
  .then((user) => {
    console.log("✅ Дані користувача:", user);

    const username = user?.username;
    const nicknameEl = document.getElementById("nickname");
    const avatarBtn = document.getElementById("avatar-btn");
    const avatarImg = avatarBtn?.querySelector('img');

    // аватар в avatar btn
    if (avatarImg && user.avatar_url) {
      avatarImg.src = user.avatar_url;
      avatarImg.alt = username || 'Аватар';
      avatarImg.className = 'w-full h-full rounded-full object-cover';
    }

    // нікнейм
    if (nicknameEl && username) {
      nicknameEl.textContent = username;
      nicknameEl.className = 'px-3 py-1 border-2 border-[var(--color-accent)] rounded-md text-sm hover:bg-[var(--color-accent)] hover:bg-opacity-20 transition-colors cursor-pointer';
    }
  })
  .catch((err) => {
    console.log("❌ Помилка завантаження даних користувача:", err.message);
    if (window.location.pathname !== '/pages/login.html') {
      window.location.href = "/pages/login.html";
    }
  });

// ===== Logout =====
if (document.getElementById("logoutBtn")) {
  document.getElementById("logoutBtn").addEventListener("click", () => {
    AuthService.logout().then(() => {
      window.location.href = "/pages/login.html";
    });
  });
}
// ===== Helper: получить куку =====
function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

console.log("⚡ main-menu loaded");
console.log("document.cookie:", document.cookie);

// ===== Avatar button click handler =====
const avatarBtn = document.getElementById("avatar-btn");

if (avatarBtn) {
  avatarBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/pages/profile.html";
  });
  
  // Add cursor pointer style to indicate it's clickable
  avatarBtn.style.cursor = 'pointer';
}

// ===== Avatar modal toggle =====
// const avatarBtn = document.getElementById("avatar-btn");
// const avatarModal = document.getElementById("avatar-modal");
// const avatarImages = avatarModal.querySelectorAll("img");

// avatarBtn.addEventListener("click", () => {
//   avatarModal.classList.toggle("hidden");
// });

// document.addEventListener("click", (e) => {
//   if (!avatarModal.contains(e.target) && !avatarBtn.contains(e.target)) {
//     avatarModal.classList.add("hidden");
//   }
// });

// avatarImages.forEach((img) => {
//   img.addEventListener("click", () => {
//     const newUrl = img.getAttribute("data-avatar-url");
//     const avatarImg = avatarBtn.querySelector("img");
//     avatarImg.src = newUrl;

//     const username =
//       document.getElementById("nickname")?.textContent || "default";
//     document.cookie = `avatar_${username}=${encodeURIComponent(
//       newUrl
//     )}; path=/; max-age=31536000`;
//     avatarModal.classList.add("hidden");
//   });
// });
