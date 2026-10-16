import { ShareTargets } from "./share-targets.js";

/**
 * A disclosure menu of share options: copy link, service links, and the
 * device's own share sheet where the browser has one.
 */
export class ShareMenu {
  static #COPIED_KEY = "share.copied";
  static #FAILED_KEY = "share.failed";

  #root;
  #toggle;
  #panel;
  #status;
  #i18n;

  /**
   * @param {HTMLElement} root Element with `[data-share-menu]`.
   * @param {import("./i18n.js").I18n} i18n
   */
  constructor(root, i18n) {
    this.#root = root;
    this.#toggle = root.querySelector("[data-share-toggle]");
    this.#panel = root.querySelector("[data-share-panel]");
    this.#status = root.querySelector("[data-share-status]");
    this.#i18n = i18n;
  }

  /** Wires up the menu. */
  start() {
    const native = this.#root.querySelector("[data-share-native]");
    native.hidden = !navigator.share;

    this.#toggle.addEventListener("click", () => this.#setOpen(!this.#isOpen));
    this.#panel.addEventListener("click", (event) => this.#onChoose(event));
    this.#root.addEventListener("keydown", (event) => this.#onKey(event));
    // No focusout handler: Safari doesn't focus buttons on click, so the
    // menu would close before the click on an item lands.
    document.addEventListener("click", (event) => {
      if (!this.#root.contains(event.target)) this.#setOpen(false);
    });
  }

  get #isOpen() {
    return this.#toggle.getAttribute("aria-expanded") === "true";
  }

  #setOpen(open) {
    if (open) this.#refreshLinks();
    else this.#clearStatus();
    this.#toggle.setAttribute("aria-expanded", String(open));
    this.#panel.hidden = !open;
  }

  // Rebuilt on every open so the links carry the title in the language
  // shown at that moment.
  #refreshLinks() {
    const targets = new ShareTargets(window.location.href, document.title);
    for (const link of this.#panel.querySelectorAll("[data-share-target]")) {
      link.href = targets.hrefFor(link.dataset.shareTarget);
    }
  }

  #onChoose(event) {
    const item = event.target.closest(
      "[data-share-action], [data-share-target]",
    );
    if (!item) return;

    switch (item.dataset.shareAction) {
      case "copy":
        this.#copy();
        return;
      case "native":
        this.#close();
        this.#shareNatively();
        return;
      default:
        this.#close();
    }
  }

  async #copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.#announce(ShareMenu.#COPIED_KEY);
    } catch {
      this.#announce(ShareMenu.#FAILED_KEY);
    }
  }

  async #shareNatively() {
    try {
      await navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } catch {
      // Closing the share sheet rejects too; there is nothing to report.
    }
  }

  #onKey(event) {
    if (event.key !== "Escape" || !this.#isOpen) return;
    this.#close();
  }

  #close() {
    this.#setOpen(false);
    this.#toggle.focus();
  }

  // The key goes in data-i18n so I18n re-translates the message if the
  // language changes while it is shown.
  #announce(key) {
    this.#status.dataset.i18n = key;
    this.#status.textContent = this.#i18n.translate(key);
  }

  #clearStatus() {
    delete this.#status.dataset.i18n;
    this.#status.textContent = "";
  }
}