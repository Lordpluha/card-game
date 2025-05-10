function togglePassword(id) {
  const passwordInput = document.getElementById(id);
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
}

document.getElementById("loginForm").addEventListener("submit", function (e) {
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

  // комент для Владоса
  // если модулка не нужна то закоментируй её
  document.getElementById("modal").classList.remove("hidden");

  this.reset();
});

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});
