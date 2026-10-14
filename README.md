# Tuomaksen syöpämatka

Bilingual (Finnish / English) single-page website that collects support for Tuomas Lappalainen's cancer treatment in Germany.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Feature Summary](#feature-summary)
- [Architecture](#architecture)
- [Dependencies](#dependencies)
- [Setup and Local Development](#setup-and-local-development)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Design Decisions and Challenges](#design-decisions-and-challenges)

---

## Project Overview

The site offers two separate ways to help: an open donation with nothing in return, and a 30 € paid access to follow Tuomas's journey on his Instagram Close Friends list. People who pay for access fill in a short form; the request is saved to Firestore and Tuomas gets an email, checks the payment on his bank statement and adds the person by hand.

The page is static HTML, CSS and vanilla JavaScript with no build step and no Firebase SDK in the browser. A single Cloud Function handles the form.

---

## Feature Summary

| Feature              | Description                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| Two support options  | Donation and paid access shown side by side with separate accounts; only paid access uses the form        |
| Access request form  | Name and Instagram username, validated in the browser and again in the function                           |
| Email notification   | Finnish plain-text email to Tuomas via Resend, with a direct Instagram link and a possible-duplicate flag |
| Bot protection       | Hidden honeypot field and Cloudflare Turnstile, verified server-side                                      |
| Finnish / English    | Finnish by default; the choice is remembered in the browser                                               |
| Automatic deletion   | Records carry an `expiresAt` date and are removed by a Firestore TTL policy                               |
| Locked-down database | Firestore rules deny all client access; only the function writes                                          |

---

## Architecture

```text
Browser (static page)
  │  POST /api/support-request   (same origin)
  ▼
Firebase Hosting ── rewrite ──► submitSupportRequest (Cloud Function, europe-west1)
                                  ├─ honeypot → validate → verify Turnstile
                                  ├─ save supportRequests/{id} (Admin SDK)
                                  └─ notify Tuomas via Resend
```

```text
public/
  index.html
  css/styles.css
  js/
    main.js              entry point
    content.js           all page text, fi + en
    i18n.js              I18n: renders text, language toggle
    turnstile-widget.js  TurnstileWidget: renders the widget, exposes the token
    support-form.js      SupportForm: validation, submission, status messages
functions/
  index.js               endpoint, settings, error-to-response mapping
  src/
    support-request-error.js       SupportRequestError
    support-request-validator.js   SupportRequestValidator
    turnstile-verifier.js          TurnstileVerifier
    support-request-repository.js  SupportRequestRepository
    email-notifier.js              EmailNotifier
    support-request-service.js     SupportRequestService
firestore.rules          deny all client reads and writes
```

**Frontend.** One class per module. `content.js` holds every string under flat keys (`hero.title`, `error.invalid_name`); HTML elements reference them with `data-i18n` and `data-i18n-attr`.

**Function.** One class per responsibility. `SupportRequestService` coordinates the others; `index.js` builds them per request, because secret values are only available at runtime.

**Error codes.** The function returns codes, not text, and the page translates them:

| Status | Code                                |
| ------ | ----------------------------------- |
| 400    | `invalid_name`, `invalid_instagram` |
| 403    | `turnstile_failed`                  |
| 405    | `method_not_allowed`                |
| 500    | `server_error`                      |

---

## Dependencies

**Function runtime** (`functions/package.json`)

| Package              | Purpose                                |
| -------------------- | -------------------------------------- |
| `firebase-functions` | HTTPS function, parameters and secrets |
| `firebase-admin`     | Firestore writes from the function     |
| `resend`             | Notification email                     |

**Development** (root `package.json`, never deployed)

| Package                           | Purpose                                                              |
| --------------------------------- | -------------------------------------------------------------------- |
| `eslint`, `@eslint/js`, `globals` | Linting: Node rules for `functions/`, browser rules for `public/js/` |
| `prettier`                        | Formatting                                                           |

The page itself has no dependencies. The only third-party script is Cloudflare Turnstile.

---

## Setup and Local Development

### Prerequisites

- Node.js 22
- Firebase CLI (`npm install -g firebase-tools`), logged in with `firebase login`

### Install

```bash
git clone https://github.com/tomistaven/cancer-fundraiser-page.git
cd cancer-fundraiser-page
npm install
npm install --prefix functions
```

### Local settings

Both files below are git-ignored. Write each line as `NAME=value`, starting at the beginning of the line, with no quotes.

`functions/.env.local`:

```text
NOTIFY_FROM=noreply@tuomaksensyopamatkassa.blog
NOTIFY_TO=<your own address for testing>
```

`functions/.secret.local`:

```text
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
RESEND_API_KEY=<a Resend key, only if you want test emails to be sent>
```

The Turnstile value is Cloudflare's always-passing test secret. On `localhost` the page uses the matching test site key automatically. Without a Resend key the request is still saved and the email failure is logged.

### Run

```bash
firebase emulators:start
```

The page is at `http://localhost:5000` and the Emulator UI shows saved records.

### Lint and format

```bash
npx eslint .
npm run format
```

Deploying the function runs lint automatically.

---

## Deployment

One-time setup:

1. Upgrade the project to the Blaze plan. Set a Cloud Functions spend cap and an all-services budget alert.
2. Set the secrets:
   ```bash
   firebase functions:secrets:set TURNSTILE_SECRET_KEY
   firebase functions:secrets:set RESEND_API_KEY
   ```
3. Set an Artifact Registry cleanup policy: `firebase functions:artifacts:setpolicy`.
4. Enable the TTL policy on `supportRequests.expiresAt` in the Firestore console.

Deploy:

```bash
firebase deploy
```

On the first deploy the CLI asks for `NOTIFY_FROM` and `NOTIFY_TO` and saves them to `functions/.env.<project-id>`, which is git-ignored.

Deploy the function before (or together with) Hosting: the `/api/support-request` rewrite points at it.

---

## Usage Guide

### Visitor

1. Read the page and choose an option under **Näin voit auttaa**.
2. Donation: transfer any amount to the donation account. No form.
3. Paid access: transfer 30 € with the stated message, then fill in name and Instagram username and send.

### Tuomas

1. A new request arrives by email with the name, handle and a link to the profile.
2. Check the payment on the bank statement.
3. Add the person to Close Friends and set the record's `status` to `added` in the Firestore console.

### Updating content

All text, account details and the "last updated" dates are in `public/js/content.js`. Edit both `fi` and `en`, then `firebase deploy --only hosting`. The file is served with `no-cache`, so changes appear immediately.

---

## Design Decisions and Challenges

### No Firebase SDK in the browser

The form posts to a same-origin endpoint instead of writing to Firestore from the page. Firestore rules can then deny everything, the page stays small, and the Content Security Policy only needs the site's own origin plus Turnstile.

### Function region vs. database location

Firestore is in the `eur3` multi-region. Cloud Functions can't run in a multi-region, so the function runs in `europe-west1`, one of `eur3`'s two read-write regions.

### Duplicates and email failures don't block a request

A repeated Instagram handle is still saved and flagged in the email, so a genuine second payment is never lost. A failed email is logged with the request ID only, because the record is already saved and visible in the console.

### Privacy by omission

Only name, handle, amount, status and timestamps are stored. The visitor's IP is not sent to Cloudflare or logged. Records are deleted automatically one month after the collection ends.

### Turnstile on localhost

The production site key doesn't allow `localhost`, and Cloudflare recommends keeping it that way. `TurnstileWidget` renders the widget explicitly and picks Cloudflare's test key on `localhost`, so no key has to be swapped by hand.
