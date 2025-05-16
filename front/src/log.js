import { API_URL } from "../config.js";
import AuthService from "./Auth.service.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("errorMessage");

  errorMessage.classList.add("hidden");
  errorMessage.textContent = "";

  if (!username) {
    errorMessage.textContent = "Username is required.";
    errorMessage.classList.remove("hidden");
    return;
  }

  if (!password || password.length < 6) {
    errorMessage.textContent = "Password must be at least 6 characters long.";
    errorMessage.classList.remove("hidden");
    return;
  }

  await AuthService.login(username, password)
    .then((res) => {
      if (res.ok) {
        document.getElementById("modal").classList.remove("hidden");
        this.reset();
        setTimeout(() => {
          window.location.href = "/pages/main-menu.html";
        }, 1000);
      } else {
        return res.json().then((data) => {
          errorMessage.textContent = data.message || "Login failed.";
          errorMessage.classList.remove("hidden");
        });
      }
    })
    .catch(() => {
      errorMessage.textContent = "Network error.";
      errorMessage.classList.remove("hidden");
    });
});

// 👁 Подключение клик-событий на иконки
document.querySelectorAll("[data-toggle-password]").forEach((el) => {
  el.addEventListener("click", () => {
    const id = el.getAttribute("data-toggle-password");
    const input = document.getElementById(id);
    if (input) {
      const type =
        input.getAttribute("type") === "password" ? "text" : "password";
      input.setAttribute("type", type);
    }
  });
});

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});
