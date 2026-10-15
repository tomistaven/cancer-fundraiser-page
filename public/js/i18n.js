import { content } from "./content.js";

const STORAGE_KEY = "language";
const DEFAULT_LANGUAGE = "fi";

/**
 * Fills the page with text from `content.js` and switches between languages.
 *
 * Reads these attributes from the page:
 * - `data-i18n="key"` sets the element's text.
 * - `data-i18n-attr="attr:key;attr:key"` sets attributes such as `alt` or
 *   `aria-label`.
 * - `data-language-toggle` marks a button that switches language.
 */
export class I18n {
  #language;
  #listeners = new Set();

  constructor() {
    this.#language = this.#readStoredLanguage();
  }

  /** @returns {string} Current language code, e.g. `fi`. */
  get language() {
    return this.#language;
  }

  /** Wires the toggle buttons and renders the page in the current language. */
  start() {
    for (const button of document.querySelectorAll("[data-language-toggle]")) {
      button.addEventListener("click", () => this.toggle());
    }

    this.#render();
  }

  /**
   * @param {string} key Content key, e.g. `form.submit`.
   * @returns {string} The text in the current language, or the key itself if
   *   it is missing.
   */
  translate(key) {
    // Showing the key makes a missing translation visible instead of rendering
    // blank.
    return content[this.#language][key] ?? key;
  }

  /**
   * Switches to the other language, remembers the choice and re-renders the
   * page.
   */
  toggle() {
    this.#language = this.#otherLanguage();
    this.#storeLanguage(this.#language);
    this.#render();

    for (const listener of this.#listeners) {
      listener(this.#language);
    }
  }

  /**
   * @param {(language: string) => void} listener Called after every language
   *   switch.
   */
  onChange(listener) {
    this.#listeners.add(listener);
  }

  #render() {
    document.documentElement.lang = this.#language;

    for (const element of document.querySelectorAll("[data-i18n]")) {
      element.textContent = this.translate(element.dataset.i18n);
    }

    for (const element of document.querySelectorAll("[data-i18n-attr]")) {
      this.#renderAttributes(element);
    }

    for (const button of document.querySelectorAll("[data-language-toggle]")) {
      // The button label is in the other language, so screen readers need to
      // pronounce it that way.
      button.lang = this.#otherLanguage();
    }
  }

  #renderAttributes(element) {
    for (const pair of element.dataset.i18nAttr.split(";")) {
      const [attribute, key] = pair.split(":").map((part) => part.trim());

      if (attribute && key) {
        element.setAttribute(attribute, this.translate(key));
      }
    }
  }

  #otherLanguage() {
    return Object.keys(content).find((language) => language !== this.#language);
  }

  #readStoredLanguage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored in content ? stored : DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  }

  #storeLanguage(language) {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Blocked storage only means the next visit starts in Finnish.
    }
  }
}