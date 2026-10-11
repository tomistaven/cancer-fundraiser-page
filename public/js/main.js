import { I18n } from "./i18n.js";
import { SupportForm } from "./support-form.js";

const i18n = new I18n();
i18n.start();

new SupportForm(document.querySelector("[data-support-form]"), i18n).start();
