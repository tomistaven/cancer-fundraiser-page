import { I18n } from "./i18n.js";
import { PaymentMessageBuilder } from "./payment-message-builder.js";
import { PaymentMessageField } from "./payment-message-field.js";

const i18n = new I18n();
i18n.start();

new PaymentMessageField(
  document.querySelector("[data-payment-message]"),
  new PaymentMessageBuilder(),
  i18n,
).start();