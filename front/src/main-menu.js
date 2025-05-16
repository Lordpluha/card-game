import { API_URL } from "./config.js";

// Проверка авторизации
fetch(`${API_URL}/refresh`, {
  method: "GET",
  credentials: "include",
}).then((res) => {
  if (!res.ok) {
    window.location.href = "/pages/login.html";
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  fetch(`${API_URL}/logout`, {
    method: "POST",
    credentials: "include",
  }).then(() => {
    document.cookie = "refresh=; Max-Age=0; path=/;";
    window.location.href = "/pages/login.html";
  });
});

console.log("⚡ main-menu loaded");
console.log("document.cookie:", document.cookie);
