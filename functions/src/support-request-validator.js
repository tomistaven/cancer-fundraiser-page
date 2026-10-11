import { SupportRequestError } from "./support-request-error.js";

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const HANDLE_PATTERN = /^[a-z0-9._]{1,30}$/;

export class SupportRequestValidator {
  validate(input) {
    return {
      donorName: this.#validateName(input?.name),
      instagramHandle: this.#validateHandle(input?.instagram),
    };
  }

  #validateName(value) {
    const name = typeof value === "string" ? value.trim() : "";

    if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
      throw new SupportRequestError("invalid_name", 400);
    }

    return name;
  }

  #validateHandle(value) {
    const handle =
      typeof value === "string"
        ? value.trim().replace(/^@/, "").toLowerCase()
        : "";

    if (!HANDLE_PATTERN.test(handle)) {
      throw new SupportRequestError("invalid_instagram", 400);
    }

    return handle;
  }
}
