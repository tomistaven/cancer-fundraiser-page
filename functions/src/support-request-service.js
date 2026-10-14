import { logger } from "firebase-functions/logger";

export class SupportRequestService {
  #validator;
  #turnstileVerifier;
  #repository;
  #notifier;

  /**
   * @param {{
   *   validator: import("./support-request-validator.js").SupportRequestValidator,
   *   turnstileVerifier: import("./turnstile-verifier.js").TurnstileVerifier,
   *   repository: import("./support-request-repository.js").SupportRequestRepository,
   *   notifier: import("./email-notifier.js").EmailNotifier,
   * }} dependencies
   */
  constructor({ validator, turnstileVerifier, repository, notifier }) {
    this.#validator = validator;
    this.#turnstileVerifier = turnstileVerifier;
    this.#repository = repository;
    this.#notifier = notifier;
  }

  /**
   * Handles one access request: validate, verify Turnstile, save, then notify.
   *
   * Resolves without saving when the honeypot field `website` is filled, so bots see
   * the same result as people. A failed email is logged, not thrown, because the
   * request is already saved.
   *
   * @param {unknown} body Parsed request body with `name`, `instagram`, `website` and
   *   `turnstileToken`.
   * @throws {SupportRequestError} When validation or Turnstile verification fails.
   */
  async submit(body) {
    if (this.#isHoneypotFilled(body)) {
      return;
    }

    const fields = this.#validator.validate(body);

    await this.#turnstileVerifier.verify(body?.turnstileToken);

    const { id, possibleDuplicate } = await this.#repository.save(fields);

    await this.#notifyWithoutFailing(id, { ...fields, possibleDuplicate });
  }

  #isHoneypotFilled(body) {
    return typeof body?.website === "string" && body.website.length > 0;
  }

  async #notifyWithoutFailing(requestId, details) {
    try {
      await this.#notifier.notifyNewRequest(details);
    } catch (error) {
      // Only the request ID is logged; names and handles stay out of the logs.
      logger.error("Notification email failed", {
        requestId,
        reason: error.message,
      });
    }
  }
}
