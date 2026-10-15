import { ClipboardButton } from "./clipboard-button.js";
import { I18n } from "./i18n.js";
import { PaymentMessageBuilder } from "./payment-message-builder.js";
import { PaymentMessageField } from "./payment-message-field.js";
import { ShareMenu } from "./share-menu.js";
import { SnapCarousel } from "./snap-carousel.js";
import { TabSwitcher } from "./tab-switcher.js";

const i18n = new I18n();
i18n.start();

new SnapCarousel(document.querySelector("[data-snap-carousel]")).start();
new TabSwitcher(document.querySelector("[data-tab-switcher]")).start();

const copyButtons = new Map();

for (const button of document.querySelectorAll("[data-copy-target]")) {
  const copyButton = new ClipboardButton(button, i18n);
  copyButton.start();
  copyButtons.set(button.dataset.copyTarget, copyButton);
}

const messageField = new PaymentMessageField(
  document.querySelector("[data-payment-message]"),
  new PaymentMessageBuilder(),
  i18n,
);

// The output shows a placeholder until the message is valid, and that
// placeholder must never end up in someone's payment.
messageField.onChange((message) => {
  copyButtons.get("message-output").enabled = message !== null;
});

messageField.start();

new ShareMenu(document.querySelector("[data-share-menu]"), i18n).start();