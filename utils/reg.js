import AuthService from "../api/Auth.service.js";
import { DEMO } from "../demo/mode.js";
import UserService from "../api/User.service.js";

// Выполняем запрос только если токены есть
// In the static demo the session always resolves, which would bounce this page
// straight to the main menu and hide it. Keep the screen visible instead; the
// demo badge links on to the menu.
if (!DEMO) {
UserService.getUser()
  .then((user) => {
		window.location.href = "./main-menu.html";
  })
  .catch((err) => {
    AuthService.refresh().then(() => {
			window.location.reload()
		})
  });
}

// 🧾 Обработка формы регистрации
document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const passwordAgain = document.getElementById("passwordAgain").value;
  const errorMessage = document.getElementById("errorMessage");

  errorMessage.classList.add("hidden");
  errorMessage.textContent = "";

  if (!username || username.length < 3) {
    errorMessage.textContent = "Username must be at least 3 characters long.";
    errorMessage.classList.remove("hidden");
    return;
  }

  if (!email || !email.includes("@")) {
    errorMessage.textContent = "Please enter a valid email.";
    errorMessage.classList.remove("hidden");
    return;
  }

  if (password.length < 6) {
    errorMessage.textContent = "Password must be at least 6 characters long.";
    errorMessage.classList.remove("hidden");
    return;
  }

  if (password !== passwordAgain) {
    errorMessage.textContent = "Passwords do not match.";
    errorMessage.classList.remove("hidden");
    return;
  }

  AuthService.register(username, password, email)
    .then((res) => {
      if (res.ok) {
        document.getElementById("modal").classList.remove("hidden");
        window.location.href = "./login.html";
      } else {
        return res.json().then((data) => {
          errorMessage.textContent = data.message || "Registration failed.";
          errorMessage.classList.remove("hidden");
        });
      }
    })
    .catch((e) => {
      errorMessage.textContent = JSON.stringify(e);
      errorMessage.classList.remove("hidden");
    });
});

// 👁️‍🗨️ Показ/скрытие пароля
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

// ❌ Закрытие модалки
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});
