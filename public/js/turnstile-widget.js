const PRODUCTION_SITE_KEY = "0x4AAAAAAFT2sJYOgnWGYBDU";
// Cloudflare's always-passing test key. The production key deliberately does not allow localhost.
const TEST_SITE_KEY = "1x00000000000000000000AA";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

/**
 * Renders the Cloudflare Turnstile widget and exposes its token.
 *
 * Requires `api.js?render=explicit` to have run before `start()`. If the script was
 * blocked, the widget is skipped and `token` stays empty, so the function rejects the
 * request with `turnstile_failed`.
 */
export class TurnstileWidget {
  #container;
  #widgetId = null;

  /**
   * @param {HTMLElement} container Element the widget is rendered into.
   */
  constructor(container) {
    this.#container = container;
  }

  /** Renders the widget with the production key, or the test key on localhost. */
  start() {
    if (!window.turnstile) {
      return;
    }

    this.#widgetId = window.turnstile.render(this.#container, { sitekey: this.#siteKey() });
  }

  /** @returns {string} The current token, or an empty string if there is none yet. */
  get token() {
    if (this.#widgetId === null) {
      return "";
    }

    return window.turnstile.getResponse(this.#widgetId) ?? "";
  }

  /** Clears the current token and runs a fresh challenge. */
  reset() {
    if (this.#widgetId !== null) {
      window.turnstile.reset(this.#widgetId);
    }
  }

  #siteKey() {
    return LOCAL_HOSTNAMES.has(window.location.hostname) ? TEST_SITE_KEY : PRODUCTION_SITE_KEY;
  }
}