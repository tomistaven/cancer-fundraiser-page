/**
 * Shares the page with the device's share sheet where one exists, and
 * otherwise copies the page address, showing the result in the current
 * language.
 */
export class ShareButton {
  static #LABEL_KEY = "share.label";
  static #COPIED_KEY = "share.copied";
  static #FAILED_KEY = "share.failed";
  static #RESET_DELAY_MS = 2000;

  #button;
  #i18n;
  #resetTimer = null;

  /**
   * @param {HTMLButtonElement} button
   * @param {import("./i18n.js").I18n} i18n
   */
  constructor(button, i18n) {
    this.#button = button;
    this.#i18n = i18n;
  }

  /** Starts listening for clicks. */
  start() {
    this.#button.addEventListener("click", () => this.#share());
  }

  async #share() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
      } catch {
        // Closing the share sheet rejects too; there is nothing to report.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      this.#showFeedback(ShareButton.#COPIED_KEY);
    } catch {
      this.#showFeedback(ShareButton.#FAILED_KEY);
    }
  }

  #showFeedback(key) {
    clearTimeout(this.#resetTimer);
    this.#setTranslated(key);

    this.#resetTimer = setTimeout(
      () => this.#setTranslated(ShareButton.#LABEL_KEY),
      ShareButton.#RESET_DELAY_MS,
    );
  }

  // Storing the key in data-i18n lets I18n re-translate the label when the
  // language changes mid-feedback.
  #setTranslated(key) {
    this.#button.dataset.i18n = key;
    this.#button.textContent = this.#i18n.translate(key);
  }
}
