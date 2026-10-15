/**
 * Shares the page with the device's share sheet where one exists, and
 * otherwise copies the page address. The result is shown in the sibling
 * `[data-share-status]` live region, never in the button itself.
 */
export class ShareButton {
  static #COPIED_KEY = "share.copied";
  static #FAILED_KEY = "share.failed";
  static #CLEAR_DELAY_MS = 2500;

  #button;
  #status;
  #i18n;
  #clearTimer = null;

  /**
   * @param {HTMLButtonElement} button
   * @param {import("./i18n.js").I18n} i18n
   */
  constructor(button, i18n) {
    this.#button = button;
    this.#status = button.parentElement.querySelector("[data-share-status]");
    this.#i18n = i18n;
  }

  /** Starts listening for clicks, or hides the button if it can't work. */
  start() {
    if (!navigator.share && !navigator.clipboard) {
      this.#button.hidden = true;
      return;
    }
    this.#button.addEventListener("click", () => this.#share());
  }

  async #share() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (error) {
        // Closing the share sheet rejects with AbortError; any other
        // rejection means the sheet couldn't open, so copying still helps.
        if (error.name === "AbortError") return;
      }
    }

    await this.#copy(url);
  }

  async #copy(url) {
    try {
      await navigator.clipboard.writeText(url);
      this.#announce(ShareButton.#COPIED_KEY);
    } catch {
      this.#announce(ShareButton.#FAILED_KEY);
    }
  }

  // The key goes in data-i18n so I18n re-translates the message if the
  // language changes while it is shown.
  #announce(key) {
    clearTimeout(this.#clearTimer);
    this.#status.dataset.i18n = key;
    this.#status.textContent = this.#i18n.translate(key);
    this.#clearTimer = setTimeout(
      () => this.#clear(),
      ShareButton.#CLEAR_DELAY_MS,
    );
  }

  #clear() {
    delete this.#status.dataset.i18n;
    this.#status.textContent = "";
  }
}