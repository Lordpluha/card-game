import AuthService from "./Auth.service.js";

document
  .getElementById("registerForm")
  .addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
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


    AuthService.register(username, password)
      .then((res) => {
        if (res.ok) {
          document.getElementById("modal").classList.remove("hidden");
					window.location.href = "/pages/login.html";
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
