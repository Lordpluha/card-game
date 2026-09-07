/**
 * Demo-mode switch for the static build.
 *
 * The real services in `src/api/*.service.js` are untouched and still exported
 * as classes; each file just picks which instance to export as its default.
 *
 * Set `window.CARD_GAME_LIVE_API = true` before the module scripts run (for
 * example from a <script> in the page head) to go back to the real backend on
 * http://localhost:8080.
 */
export const DEMO = globalThis.CARD_GAME_LIVE_API !== true

/** Small artificial latency so loading states are actually exercised. */
export const tick = (ms = 140) => new Promise((resolve) => setTimeout(resolve, ms))
