function togglePassword(id) {
  const passwordInput = document.getElementById(id);
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
}

document
  .getElementById("registerForm")
  .addEventListener("submit", function (e) {
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

    document.getElementById("modal").classList.remove("hidden");

    this.reset();
  });

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});
