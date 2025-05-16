// front/src/config.js
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
export const API_URL = isLocalhost
  ? "http://localhost:8080/api"
  : "https://your-production-domain.com/api";
