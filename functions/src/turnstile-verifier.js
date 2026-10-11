import { SupportRequestError } from "./support-request-error.js";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export class TurnstileVerifier {
  #secretKey;

  constructor(secretKey) {
    this.#secretKey = secretKey;
  }

  async verify(token) {
    if (typeof token !== "string" || token.length === 0) {
      throw new SupportRequestError("turnstile_failed", 403);
    }

    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret: this.#secretKey, response: token }),
    });

    if (!response.ok) {
      throw new SupportRequestError("server_error", 500);
    }

    const result = await response.json();

    if (result.success !== true) {
      throw new SupportRequestError("turnstile_failed", 403);
    }
  }
}
