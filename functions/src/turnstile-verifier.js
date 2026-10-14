import { SupportRequestError } from "./support-request-error.js";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export class TurnstileVerifier {
  #secretKey;

  /**
   * @param {string} secretKey Turnstile secret key for this site.
   */
  constructor(secretKey) {
    this.#secretKey = secretKey;
  }

  /**
   * Verifies a Turnstile token with Cloudflare. Resolves only if the token is valid;
   * a token can be verified once, so a second call with the same token fails.
   *
   * @param {unknown} token Token from the widget's `cf-turnstile-response` field.
   * @throws {SupportRequestError} `turnstile_failed` (HTTP 403) for a missing or rejected
   *   token, `server_error` (HTTP 500) if Cloudflare cannot be reached.
   */
  async verify(token) {
    if (typeof token !== "string" || token.length === 0) {
      throw new SupportRequestError("turnstile_failed", 403);
    }

    // The visitor's IP is deliberately not sent; the site does not collect IP addresses.
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
