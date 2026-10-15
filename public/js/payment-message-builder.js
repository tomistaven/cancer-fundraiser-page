/**
 * Builds the bank payment message Tuomas asked access buyers to use:
 * own name, the collection purpose and own Instagram username.
 */
export class PaymentMessageBuilder {
  // Tuomas's own wording; kept in Finnish whatever the page language.
  static #PURPOSE = "vastikkeellinen keräys Tuomas Lappalaiselle";

  // Bank messages allow 140 characters. The fixed part and a 30-character
  // handle take 78 of them, so a 60-character name keeps a small margin.
  static #NAME_MIN = 2;
  static #NAME_MAX = 60;

  static #HANDLE_PATTERN = /^[a-z0-9._]{1,30}$/;

  /**
   * @param {string} name
   * @param {string} handle With or without a leading `@`.
   * @returns {{ ok: true, message: string }
   *   | { ok: false, errors: Array<"invalid_name" | "invalid_instagram"> }}
   *   Every failing input is reported, so each can be marked on its own.
   */
  build(name, handle) {
    const cleanName = this.#normaliseName(name);
    const cleanHandle = this.#normaliseHandle(handle);
    const purpose = PaymentMessageBuilder.#PURPOSE;
    const errors = [];

    if (!this.#isValidName(cleanName)) {
      errors.push("invalid_name");
    }

    if (!PaymentMessageBuilder.#HANDLE_PATTERN.test(cleanHandle)) {
      errors.push("invalid_instagram");
    }

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    return {
      ok: true,
      message: `${cleanName}, ${purpose}, @${cleanHandle}`,
    };
  }

  #normaliseName(name) {
    return String(name ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  #isValidName(name) {
    return (
      name.length >= PaymentMessageBuilder.#NAME_MIN &&
      name.length <= PaymentMessageBuilder.#NAME_MAX
    );
  }

  // Instagram usernames are case-insensitive; lowercase keeps the statement
  // consistent for Tuomas when he searches for the account.
  #normaliseHandle(handle) {
    return String(handle ?? "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();
  }
}