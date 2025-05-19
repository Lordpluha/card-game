import AuthService from "../api/Auth.service.js";

// 🔒 Проверка: если уже залогинен — редирект на main-menu
AuthService.refresh()
  .then(() => {
    console.log("✅ Уже авторизован — редирект на меню");
    window.location.replace("/pages/main-menu.html"); // ⬅ замена href
  })
  .catch(() => {
    console.log("🔓 Не авторизован — остался на логине");
  });

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
          window.location.replace("/pages/main-menu.html"); // 👈 replace
        }, 500);
      } else {
        return res.json().then((data) => {
          errorMessage.textContent = data.message || "Login failed.";
          errorMessage.classList.remove("hidden");
        });
      }
    })
    .catch((e) => {
      errorMessage.textContent = JSON.stringify(e);
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

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});
