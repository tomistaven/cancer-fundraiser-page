import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { EmailNotifier } from "./src/email-notifier.js";
import { SupportRequestError } from "./src/support-request-error.js";
import { SupportRequestRepository } from "./src/support-request-repository.js";
import { SupportRequestService } from "./src/support-request-service.js";
import { SupportRequestValidator } from "./src/support-request-validator.js";
import { TurnstileVerifier } from "./src/turnstile-verifier.js";

initializeApp();

setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

const resendApiKey = defineSecret("RESEND_API_KEY");
const turnstileSecretKey = defineSecret("TURNSTILE_SECRET_KEY");
const notifyFrom = defineString("NOTIFY_FROM");
const notifyTo = defineString("NOTIFY_TO");

function createService() {
  return new SupportRequestService({
    validator: new SupportRequestValidator(),
    turnstileVerifier: new TurnstileVerifier(turnstileSecretKey.value()),
    repository: new SupportRequestRepository(getFirestore()),
    notifier: new EmailNotifier({
      apiKey: resendApiKey.value(),
      from: notifyFrom.value(),
      to: notifyTo.value(),
    }),
  });
}

export const submitSupportRequest = onRequest(
  { secrets: [resendApiKey, turnstileSecretKey] },
  async (request, response) => {
    if (request.method !== "POST") {
      response.set("Allow", "POST");
      response.status(405).json({ error: "method_not_allowed" });
      return;
    }

    try {
      await createService().submit(request.body);
      response.status(200).json({ ok: true });
    } catch (error) {
      if (error instanceof SupportRequestError) {
        response.status(error.httpStatus).json({ error: error.code });
        return;
      }

      logger.error("Support request failed", { message: error.message });
      response.status(500).json({ error: "server_error" });
    }
  },
);
