import { I18n } from "./i18n.js";
import { SupportForm } from "./support-form.js";
import { TurnstileWidget } from "./turnstile-widget.js";

const i18n = new I18n();
i18n.start();

const turnstile = new TurnstileWidget(document.querySelector("[data-turnstile]"));
turnstile.start();

new SupportForm(document.querySelector("[data-support-form]"), i18n, turnstile).start();