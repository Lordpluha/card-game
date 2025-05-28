import AuthService from "../api/Auth.service.js";
import UserService from "../api/User.service.js";

// ===== Авторизация и аватар =====
UserService.getUser()
  .then((user) => {
    console.log("✅ Auth response:", user);

    const username = user?.username;
    const nicknameEl = document.getElementById("nickname");
    const avatarImg = document.getElementById("avatar-img");

    if (nicknameEl && username) {
      nicknameEl.textContent = username;
    }

    if (avatarImg && user?.avatar_url && user?.avatar_url !== "null") {
      avatarImg.src = user?.avatar_url
    }
  })
  .catch((err) => {
    AuthService.refresh()
			.then(() => {
				window.location.reload()
			}).catch((e) => {
				window.location.href = "/pages/login.html";
			})
  })
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
