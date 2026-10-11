import { content } from "./content.js";

const STORAGE_KEY = "language";
const DEFAULT_LANGUAGE = "fi";

export class I18n {
  #language;
  #listeners = new Set();

  constructor() {
    this.#language = this.#readStoredLanguage();
  }

  get language() {
    return this.#language;
  }

  start() {
    for (const button of document.querySelectorAll("[data-language-toggle]")) {
      button.addEventListener("click", () => this.toggle());
    }

    this.#render();
  }

  translate(key) {
    // Showing the key makes a missing translation visible instead of rendering blank.
    return content[this.#language][key] ?? key;
  }

  toggle() {
    this.#language = this.#otherLanguage();
    this.#storeLanguage(this.#language);
    this.#render();

    for (const listener of this.#listeners) {
      listener(this.#language);
    }
  }

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
      // The button label is in the other language, so screen readers need to pronounce it that way.
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