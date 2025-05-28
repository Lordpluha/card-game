import AuthService from "../api/Auth.service.js";

// 🔒 Проверка: сначала accessToken, потом refresh
const accessToken = getCookie("accessToken");

if (accessToken) {
  console.log("✅ Access token найден — редирект на main-menu");
  window.location.replace("/pages/main-menu.html");
} else {
  AuthService.refresh()
    .then(() => {
      console.log("🔄 Refresh прошёл — редирект на main-menu");
      window.location.replace("/pages/main-menu.html");
    })
    .catch(() => {
      console.log("🔓 Не авторизован — остался на логине");
    });
}

// 🧾 Обработка отправки формы логина
document.getElementById("loginForm").addEventListener("submit", (e) => {
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

  AuthService.login(username, password)
    .then((res) => {
      if (res.ok) {
        document.getElementById("modal").classList.remove("hidden");
        setTimeout(() => {
          window.location.replace("/pages/main-menu.html");
        }, 500);
      } else {
        return res.json().then((data) => {
          errorMessage.textContent = data.message || "Login failed.";
          errorMessage.classList.remove("hidden");
        });
      }
    })
    .catch((e) => {
      errorMessage.textContent = "Network error or server not responding.";
      errorMessage.classList.remove("hidden");
    });
});

// 👁 Показ/скрытие пароля
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

// 🍪 Вспомогательная функция
function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}
