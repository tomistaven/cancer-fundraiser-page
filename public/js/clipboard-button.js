/**
 * Copies the text of another element to the clipboard and briefly shows
 * whether it worked, in the current language.
 *
 * The button names its source with `data-copy-target="<element id>"`.
 */
export class ClipboardButton {
  static #LABEL_KEY = "copy.label";
  static #DONE_KEY = "copy.done";
  static #FAILED_KEY = "copy.failed";
  static #RESET_DELAY_MS = 2000;

  #button;
  #source;
  #i18n;
  #resetTimer = null;

  /**
   * @param {HTMLButtonElement} button
   * @param {import("./i18n.js").I18n} i18n
   */
  constructor(button, i18n) {
    this.#button = button;
    this.#source = document.getElementById(button.dataset.copyTarget);
    this.#i18n = i18n;
  }

  /** @param {boolean} enabled */
  set enabled(enabled) {
    this.#button.disabled = !enabled;
  }

  /** Starts listening for clicks. */
  start() {
    this.#button.addEventListener("click", () => this.#copy());
  }

  async #copy() {
    const text = this.#source.textContent.trim();

    try {
      // Only available in a secure context (HTTPS or localhost); a missing
      // API throws here and shows the manual-copy hint.
      await navigator.clipboard.writeText(text);
      this.#showFeedback(ClipboardButton.#DONE_KEY);
    } catch {
      this.#showFeedback(ClipboardButton.#FAILED_KEY);
    }
  }

  #showFeedback(key) {
    clearTimeout(this.#resetTimer);
    this.#setTranslated(key);

    this.#resetTimer = setTimeout(
      () => this.#setTranslated(ClipboardButton.#LABEL_KEY),
      ClipboardButton.#RESET_DELAY_MS,
    );
  }

  // Storing the key in data-i18n lets I18n re-translate the label when the
  // language changes mid-feedback.
  #setTranslated(key) {
    this.#button.dataset.i18n = key;
    this.#button.textContent = this.#i18n.translate(key);
  }
}
