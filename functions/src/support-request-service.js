import { logger } from "firebase-functions/logger";

export class SupportRequestService {
  #validator;
  #turnstileVerifier;
  #repository;
  #notifier;

  constructor({ validator, turnstileVerifier, repository, notifier }) {
    this.#validator = validator;
    this.#turnstileVerifier = turnstileVerifier;
    this.#repository = repository;
    this.#notifier = notifier;
  }

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
      logger.error("Notification email failed", {
        requestId,
        message: error.message,
      });
    }
  }
}
