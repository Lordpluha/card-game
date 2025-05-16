import AuthService from "../api/Auth.service.js";

// Проверка авторизации
AuthService.refresh().then((res) => {
  if (!res.ok) {
    window.location.href = "/pages/login.html";
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  AuthService.logout()
		.then(() => {
			window.location.href = "/pages/login.html";
		});
});

console.log("⚡ main-menu loaded");
console.log("document.cookie:", document.cookie);
