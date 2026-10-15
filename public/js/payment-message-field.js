/**
 * Turns the visitor's name and Instagram username into Tuomas's payment
 * message as they type, and explains what to fix when an input is invalid.
 *
 * Expects the container to hold inputs named `name` and `instagram`, a
 * `[data-message-output]` element and a `[data-message-error]` element.
 * Nothing typed here leaves the browser.
 */
export class PaymentMessageField {
  static #PLACEHOLDER_KEY = "message.placeholder";

  #builder;
  #i18n;
  #nameInput;
  #handleInput;
  #output;
  #error;
  #touched = new Set();
  #message = null;
  #listeners = new Set();

  /**
   * @param {HTMLElement} container
   * @param {import("./payment-message-builder.js")
   *   .PaymentMessageBuilder} builder
   * @param {import("./i18n.js").I18n} i18n
   */
  constructor(container, builder, i18n) {
    this.#builder = builder;
    this.#i18n = i18n;
    this.#nameInput = container.querySelector('input[name="name"]');
    this.#handleInput = container.querySelector('input[name="instagram"]');
    this.#output = container.querySelector("[data-message-output]");
    this.#error = container.querySelector("[data-message-error]");
  }

  /** @returns {string | null} The finished message, or null while invalid. */
  get message() {
    return this.#message;
  }

  /** Starts listening to the inputs and shows the initial placeholder. */
  start() {
    for (const input of [this.#nameInput, this.#handleInput]) {
      input.addEventListener("input", () => this.#update());
      // Errors wait until the visitor leaves a field, so they don't flash
      // on the first keystroke.
      input.addEventListener("change", () => {
        this.#touched.add(input);
        this.#update();
      });
    }

    this.#update();
  }

  /**
   * @param {(message: string | null) => void} listener Called whenever the
   *   message becomes ready, changes or becomes invalid.
   */
  onChange(listener) {
    this.#listeners.add(listener);
  }

  #update() {
    const result = this.#builder.build(
      this.#nameInput.value,
      this.#handleInput.value,
    );

    if (result.ok) {
      this.#showMessage(result.message);
    } else {
      this.#showPlaceholder();
    }

    this.#showErrors(result.ok ? [] : result.errors);

    this.#setMessage(result.ok ? result.message : null);
  }

  #showMessage(message) {
    // The message is raw text in Finnish, so I18n must not overwrite it.
    delete this.#output.dataset.i18n;
    this.#output.lang = "fi";
    this.#output.textContent = message;
  }

  #showPlaceholder() {
    this.#output.removeAttribute("lang");
    this.#setTranslated(this.#output, PaymentMessageField.#PLACEHOLDER_KEY);
  }

  #showErrors(codes) {
    const fields = [
      [this.#nameInput, "invalid_name"],
      [this.#handleInput, "invalid_instagram"],
    ];
    let firstShown = null;

    for (const [input, code] of fields) {
      const shown = codes.includes(code) && this.#touched.has(input);

      if (shown) {
        input.setAttribute("aria-invalid", "true");
        firstShown ??= code;
      } else {
        input.removeAttribute("aria-invalid");
      }
    }

    if (firstShown) {
      this.#setTranslated(this.#error, `error.${firstShown}`);
    } else {
      delete this.#error.dataset.i18n;
      this.#error.textContent = "";
    }
  }

  #setMessage(message) {
    if (message === this.#message) {
      return;
    }

    this.#message = message;

    for (const listener of this.#listeners) {
      listener(message);
    }
  }

  // Storing the key in data-i18n lets I18n re-translate the text when the
  // language changes.
  #setTranslated(element, key) {
    element.dataset.i18n = key;
    element.textContent = this.#i18n.translate(key);
  }
}