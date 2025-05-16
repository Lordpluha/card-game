import { API_URL } from "../config.js";

// Проверка авторизации
AuthService.refresh().then((res) => {
  if (!res.ok) {
    window.location.href = "/pages/login.html";
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  AuthService.logout().then(() => {
    document.cookie = "refresh=; Max-Age=0; path=/;";
    window.location.href = "/pages/login.html";
  });
});

console.log("⚡ main-menu loaded");
console.log("document.cookie:", document.cookie);
