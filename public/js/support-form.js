const ENDPOINT = "/api/support-request";
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const HANDLE_PATTERN = /^[a-z0-9._]{1,30}$/;

/**
 * Validates and submits the access request form, and shows the result in the
 * current language.
 *
 * Expects the form to contain inputs named `name`, `instagram` and `website` (honeypot),
 * a submit button and a `[data-form-status]` element.
 */
export class SupportForm {
  #form;
  #i18n;
  #turnstile;
  #nameInput;
  #instagramInput;
  #submitButton;
  #status;

  /**
   * @param {HTMLFormElement} form The access request form.
   * @param {import("./i18n.js").I18n} i18n Translator for status and error messages.
   * @param {import("./turnstile-widget.js").TurnstileWidget} turnstile Source of the bot-check token.
   */
  constructor(form, i18n, turnstile) {
    this.#form = form;
    this.#i18n = i18n;
    this.#turnstile = turnstile;
    this.#nameInput = form.elements.namedItem("name");
    this.#instagramInput = form.elements.namedItem("instagram");
    this.#submitButton = form.querySelector('button[type="submit"]');
    this.#status = form.querySelector("[data-form-status]");
  }

  /** Takes over form submission from the browser. */
  start() {
    this.#form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.#submit();
    });
  }

  async #submit() {
    this.#clearStatus();

    const invalidInput = this.#findInvalidInput();

    if (invalidInput) {
      this.#showError(invalidInput === this.#nameInput ? "invalid_name" : "invalid_instagram");
      invalidInput.focus();
      return;
    }

    this.#setBusy(true);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.#collectPayload()),
      });

      if (response.ok) {
        this.#form.reset();
        this.#showStatus("success", "form.success");
      } else {
        this.#showError(await this.#readErrorCode(response));
      }
    } catch {
      this.#showError("network");
    } finally {
      this.#setBusy(false);
      // Each Turnstile token can only be verified once, so every attempt needs a fresh one.
      this.#turnstile.reset();
    }
  }

  #findInvalidInput() {
    const name = this.#nameInput.value.trim();
    const handle = this.#normalizeHandle(this.#instagramInput.value);
    const nameValid = name.length >= NAME_MIN_LENGTH && name.length <= NAME_MAX_LENGTH;
    const handleValid = HANDLE_PATTERN.test(handle);

    this.#nameInput.setAttribute("aria-invalid", String(!nameValid));
    this.#instagramInput.setAttribute("aria-invalid", String(!handleValid));

    if (!nameValid) {
      return this.#nameInput;
    }

    return handleValid ? null : this.#instagramInput;
  }

  #normalizeHandle(value) {
    return value.trim().replace(/^@/, "").toLowerCase();
  }

  #collectPayload() {
    const data = new FormData(this.#form);

    return {
      name: data.get("name"),
      instagram: data.get("instagram"),
      website: data.get("website"),
      turnstileToken: this.#turnstile.token,
    };
  }

  async #readErrorCode(response) {
    try {
      const body = await response.json();
      return typeof body?.error === "string" ? body.error : "server_error";
    } catch {
      return "server_error";
    }
  }

  #setBusy(busy) {
    this.#submitButton.disabled = busy;
    this.#setTranslated(this.#submitButton, busy ? "form.submitting" : "form.submit");
  }

  #showError(code) {
    const key = `error.${code}`;
    this.#showStatus("error", this.#i18n.translate(key) === key ? "error.server_error" : key);
  }

  #showStatus(state, key) {
    this.#status.dataset.state = state;
    this.#setTranslated(this.#status, key);
  }

  #clearStatus() {
    delete this.#status.dataset.state;
    delete this.#status.dataset.i18n;
    this.#status.textContent = "";
  }

  // Storing the key in data-i18n lets I18n re-translate the text when the language changes.
  #setTranslated(element, key) {
    element.dataset.i18n = key;
    element.textContent = this.#i18n.translate(key);
  }
}