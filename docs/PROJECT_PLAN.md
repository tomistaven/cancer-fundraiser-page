# Tuomas' Fight — Project Plan

Single-page, bilingual (Finnish / English) website supporting Tuomas Lappalainen's immunological cancer treatment in Germany. It offers two separate ways to help: an open donation with nothing in return, and a 30 € paid access to follow his journey on Instagram Close Friends. Access buyers submit a short form; Tuomas receives each request by email and adds the person manually.

Status: planning agreed, no code committed yet.

---

## 1. Decisions

| Topic | Decision |
| --- | --- |
| Subject | Tuomas Lappalainen. The site is about him, not the developer |
| Repo | `tomistaven/cancer-fundraiser-page` (private) |
| Domain | `tuomaksensyopamatkassa.blog`, registered on Porkbun. Cost excluded from this plan |
| Frontend | HTML5, CSS3, vanilla JavaScript (ES modules). No framework, no build step |
| Backend | One Firebase Cloud Function, JavaScript on Node.js 22, ES modules |
| Hosting | Firebase Hosting, custom domain |
| Database | Firestore, Standard edition, `eur3` (multi-region, EU) |
| Function region | `europe-west1`, set once with `setGlobalOptions` |
| Notification | Email to Tuomas via Resend, sent from his domain. Recipient address is a function setting, not stored in the repo |
| Admin interface | None. Status is changed in the Firestore console |
| Firebase plan | Blaze, required for Cloud Functions. Protected by a Cloud Functions spend cap and a budget alert |
| Languages | Finnish (default) and English, toggled on the page |
| Tooling | ESLint (linter), Prettier (formatter). Dev-only, never shipped |
| Instagram | Close Friends is managed by hand. No automation (ban risk) |
| Bot protection | Honeypot field + Cloudflare Turnstile (Managed mode, site key `0x4AAAAAAFT2sJYOgnWGYBDU`), verified in the function. Local development uses Cloudflare's test keys |

## 2. Payment model

Confirmed by Tuomas. Collection period **12.10.2026 – 11.1.2027**.

There are **two collections, each with its own bank account**, and both appear on the site:

| | Donation | Paid access |
| --- | --- | --- |
| Type | Open donation (*lahjoitus*), nothing in return | *Vastikkeellinen keräys*: payment for access |
| Amount | Any, no minimum or maximum | **30 €** |
| Gives Instagram access | **No** | Yes |
| Uses the form | No | Yes |
| Account | Donation account | Access account |

- Account numbers live only in the public site content (`content.js`), never in Firestore, emails or this plan.
- The site must keep the two clearly apart. A donation must not be presented as earning anything; only the 30 € payment gives access.
- Payment message for access: own name, "vastikkeellinen keräys Tuomas Lappalaiselle", and Instagram username.
- **Payment methods**: bank transfer **and** MobilePay, both confirmed. MobilePay details (which account(s), number or link) are pending from Tuomas; the site shows a placeholder until then.
- The form has **no amount field**: access is always 30 €, so the function records `amount: 30` itself.

## 3. Architecture

```text
Browser (static page)
  │  fetch POST /api/support-request   (same origin, no Firebase SDK on the page)
  ▼
Firebase Hosting ── rewrite ──► Cloud Function: submitSupportRequest (europe-west1)
                                  ├─ verifies Turnstile token, checks honeypot, validates input
                                  ├─ writes supportRequests/{id} with the Admin SDK
                                  └─ sends notification email via Resend ──► Tuomas's inbox
Firestore rules: deny ALL client reads and writes. Only the function writes.
```

Why this shape:

- No client SDK keeps the page small and lets the Content Security Policy allow only the site's own origin.
- Rules that deny everything are the simplest correct boundary. Every check rules can't express lives in the function.
- Same-origin `/api/...` means no CORS configuration.

## 4. The form

Only people who want Instagram access fill it in. Anyone else's payment is already in Tuomas's bank records.

| Field | Required | Validation (enforced in the function, mirrored in the browser) |
| --- | --- | --- |
| Name | Yes | 2–100 characters, trimmed |
| Instagram username | Yes | Leading `@` optional; letters, digits, `.` and `_`; max 30 characters; stored lowercase |
| Honeypot | Hidden | Must be empty. Bots that fill every field are silently dropped |
| Turnstile token | Automatic | Issued by the Cloudflare widget; verified once, server-side, via Siteverify. Missing or invalid → rejected |

The form states clearly that submitting it does not confirm payment. Tuomas checks it against his bank statement before adding anyone.

The function returns error **codes**, not text. The page maps each code to Finnish or English, so the backend has no language logic.

## 5. Data model

`supportRequests/{autoId}`:

| Field | Type | Purpose |
| --- | --- | --- |
| `donorName` | string | Match against the bank statement |
| `amount` | number | Always 30. Set by the function, not the visitor |
| `instagramHandle` | string | Who to add to Close Friends |
| `submittedAt` | timestamp (server) | Ordering, record |
| `status` | `pending` / `added` | What still needs doing. Changed by hand in the console |
| `expiresAt` | timestamp | 11.2.2027 (one month after the collection ends). Firestore TTL deletes the record after this date |

Nothing else is stored: no phone number, email, IP address or payment data.

**Duplicates:** before writing, the function checks for an existing record with the same handle. The new record is still stored, and the email is marked "possible duplicate" so Tuomas can ignore it.

## 6. Notification email

- To: Tuomas's email (pending). From: an address on his domain, DNS-verified in Resend.
- Language: Finnish.
- Contents: name, amount, Instagram handle, a direct link to `https://instagram.com/<handle>`, the duplicate flag if set, and a reminder to check the bank statement first.
- Resend keeps sent-email data in its dashboard for 30 days (free plan). Mentioned in the site's privacy text.
- Resend free plan: 100 emails/day, 3,000/month. If the launch day ever exceeds 100 requests, the record is still saved and the email failure is logged; Tuomas can see everything in the console.

## 7. Bilingual content

- All page text lives in one module, `public/js/content.js`, with `fi` and `en` entries side by side. One source, so the two languages can't drift structurally.
- HTML elements carry `data-i18n` keys. A small renderer fills them in and updates `<html lang>`.
- Finnish by default. The visitor's choice is remembered in `localStorage` (wrapped in try/catch, so a blocked storage just means Finnish next time).
- `content.js` is served `no-cache` so status updates appear immediately.
- Without JavaScript the page shows a short `<noscript>` notice; the form needs JavaScript anyway.

## 8. Page sections

| # | Section | Content source |
| --- | --- | --- |
| A | Hero | Photo of Tuomas (with permission), title, intro, button to the payment section |
| B | Diagnosis | Cholangiocarcinoma in plain language, his situation. **Placeholders until verified** |
| C | The German treatment | Name, institution, what it involves, costs breakdown, target. **Placeholders until verified** |
| D | Current status | Short update plus a visible "last updated" date |
| E | Support and follow | Price, bank transfer details, MobilePay placeholder, steps, the form |
| F | Footer | Organizer info, contact, Instagram link, privacy text, last updated |

No progress bar unless Tuomas supplies verified totals to enter by hand. Nothing is presented as live data.

## 9. Cost controls (target: €0)

- Blaze plan with a **Cloud Functions spend cap** (pauses the function at 100% of budget) plus an all-services budget alert.
- The function is the only writer, so capping it also caps Firestore writes.
- `maxInstances` kept low on the function.
- Artifact Registry cleanup policy (`firebase functions:artifacts:setpolicy`) so build images don't accumulate.
- Images on the page compressed and sized for mobile. Hosting transfer is free up to 360 MB/day.

## 10. Retention and privacy

- Records kept until **11.2.2027**: the collection ends 11.1.2027, plus one month to reconcile late payments. Within Tuomas's 6-month maximum.
- `expiresAt` + a Firestore TTL policy deletes records automatically.
- At campaign end Tuomas deletes the notification emails himself; the form is switched off and the site archived or taken down.
- No analytics, no external fonts. The only third-party script is Cloudflare Turnstile, named in the privacy text.
- Privacy text on the site: what is collected, why, who sees it (Tuomas), where it goes (Firestore, Resend, his inbox), and when it is deleted.

## 11. Repository structure

```text
cancer-fundraiser-page/
  .firebaserc
  .gitignore
  firebase.json
  firestore.rules
  README.md
  docs/PROJECT_PLAN.md
  public/
    index.html
    css/styles.css
    js/content.js        page text, fi + en
    js/i18n.js           language toggle and rendering
    js/support-form.js   form validation and submission
    images/
  functions/
    package.json
    eslint.config.js
    index.js             function entry point
    src/                 validation, repository, email notifier
```

## 12. Build order

Files are delivered one at a time. Commits are made by Tomi in VS Code.

| Step | Files | Commit |
| --- | --- | --- |
| 1 | `firebase.json`, `.gitignore`, `.firebaserc` | `chore(firebase): add project configuration` |
| 2 | `firestore.rules` | `feat(firestore): deny all client access` |
| 3 | `functions/package.json`, `functions/eslint.config.js` | `chore(functions): set up runtime and linting` |
| 4 | `functions/src/*`, `functions/index.js` | `feat(functions): add support request endpoint` |
| 5 | `public/js/content.js`, `public/js/i18n.js` | `feat(i18n): add bilingual content` |
| 6 | `public/index.html`, `public/css/styles.css` | `feat(page): add landing page` |
| 7 | `public/js/support-form.js` | `feat(form): add support request form` |
| 8 | `README.md` | `docs: add README` |

## 13. Setup steps (Tomi)

1. Create a new Firebase project (no Analytics). Send the project ID.
2. Create Firestore: Standard edition, `europe-west1`.
3. Before deploying the function: upgrade to Blaze, set the Functions spend cap and a budget alert.
4. In Cloudflare: create a free Turnstile widget for the domain (plus `localhost` for testing). Site key goes in the page, secret key in `firebase functions:secrets:set`.
5. In Resend: add Tuomas's domain, add the DNS records on Porkbun, create an API key and store it with `firebase functions:secrets:set`.
6. Connect the custom domain in Firebase Hosting.
7. Enable the TTL policy on `supportRequests.expiresAt`.

## 14. Needed from Tuomas

- [x] Notification email address (stored as a function setting)
- [ ] MobilePay details: which account(s) it attaches to
- [ ] Photos (with permission)
- [ ] Verified diagnosis and treatment details, German institution and treatment name, cost breakdown, target
- [ ] Current status text
- [ ] Organizer details and any collection details that must be shown next to the donation account
- [ ] Instagram profile link
- [x] Collection period 12.10.2026 – 11.1.2027. `expiresAt` = 11.2.2027 (end + one month to reconcile), within the 6-month maximum

## 15. Testing before launch

- Turnstile: submission without a valid token is rejected.
- Emulators: form submits, record appears, invalid input is rejected with the right code, honeypot drops silently.
- Rules: a client read or write against Firestore is denied.
- Email arrives with correct fields and a working Instagram link; duplicate flag appears on a repeat handle.
- Language toggle switches every string and survives a reload.
- Mobile and desktop layout, keyboard navigation, reduced motion respected.
- Custom domain and HTTPS work. Spend cap and budget alert are in place.
- Test records deleted before launch. No test data shown as real figures.
