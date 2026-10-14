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

The site offers two separate ways to help, each with its own bank account: an open donation with nothing in return, and a 30 € paid access to follow Tuomas's journey on his Instagram Close Friends list.

People who pay for access put their name and Instagram username in the bank payment message, in the format Tuomas asked for. The page builds that message for them. Tuomas reads it from his bank statement and adds the person by hand.

The site is fully static: HTML, CSS and vanilla JavaScript on Firebase Hosting, with no backend, no build step and nothing sent from the page.

---

## Feature Summary

| Feature | Description |
| --- | --- |
| Two support options | Donation and paid access as tabs, donation selected by default; separate accounts, clearly labelled |
| Payment message helper | Builds `<name>, vastikkeellinen keräys Tuomas Lappalaiselle, @<username>` from two inputs, with validation |
| Copy buttons | One-click copy for both account numbers, the recipient and the payment message |
| Story carousel | Diagnosis, treatment and current status as swipeable cards with tabs, plus arrows on desktop |
| Finnish / English | Finnish by default; the choice is remembered in the browser |
| Privacy | No forms, cookies, analytics or third-party requests. Fonts are self-hosted |
| Accessibility | Real buttons and ARIA tabs, keyboard support, visible focus, reduced motion respected, contrast ≥ 4.5:1 |

---

## Architecture

```text
Browser ──► Firebase Hosting (static files only)
            Nothing is sent from the page. localStorage holds the language choice only.
```

```text
public/
  index.html
  css/styles.css
  fonts/                       Fraunces and Figtree (woff2, latin subset) + OFL licences
  js/
    main.js                    entry point, wires the classes below
    content.js                 all page text, fi + en
    i18n.js                    I18n: renders text, language toggle
    payment-message-builder.js PaymentMessageBuilder: validates input, builds the message
    payment-message-field.js   PaymentMessageField: inputs, live message, errors
    clipboard-button.js        ClipboardButton: copy with translated feedback
    snap-carousel.js           SnapCarousel: story cards, tabs, arrows
    tab-switcher.js            TabSwitcher: accessible tabs for the support options
firebase.json                  Hosting config, security headers, cache rules
```

**One class per module.** `main.js` creates them; each class takes its root element and finds its parts through `data-*` attributes, so markup and behaviour stay loosely coupled.

**Content.** `content.js` holds every string under flat keys (`hero.title`, `access.step1`). Elements reference them with `data-i18n` (text) and `data-i18n-attr` (attributes). The only hardcoded text in the HTML is the bilingual `<noscript>` notice.

**Without JavaScript** the carousel navigation and tabs stay hidden, both support cards show, and the story cards can still be scrolled sideways.

---

## Dependencies

The page has no runtime dependencies.

**Development** (root `package.json`, never deployed)

| Package | Purpose |
| --- | --- |
| `eslint`, `@eslint/js`, `globals` | Linting with browser rules for `public/js/` |
| `prettier` | Formatting |

**Fonts:** Fraunces and Figtree, SIL Open Font License 1.1 (licence files in `public/fonts/`).

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
```

### Run

```bash
firebase emulators:start
```

The page is at `http://localhost:5000`. The copy buttons need a secure context, which `localhost` counts as.

### Lint and format

```bash
npx eslint .
npm run format
```

---

## Deployment

The project runs on the free Spark plan; Hosting needs no Blaze upgrade.

**Preview for review** (temporary URL, the live site is untouched):

```bash
firebase hosting:channel:deploy review --expires 7d
```

The CLI prints the preview URL. A channel can live up to 30 days and can be redeployed with the same command.

**Live site:**

```bash
firebase deploy --only hosting
```

`/`, all HTML and `/js/content.js` are served with `Cache-Control: no-cache`, so text changes show up on the next page load.

---

## Usage Guide

### Visitor

1. Read the story cards and choose an option under **Näin voit auttaa**.
2. **Donation:** transfer any amount to the donation account. Nothing else is needed.
3. **Paid access:** enter your name and Instagram username, copy the generated message, and pay 30 € to the access account with that message. If you forget the message or mistype your username, send Tuomas a direct message on Instagram from the account you want added.

### Tuomas

1. Check incoming payments on the access account. The message holds the payer's name and Instagram username.
2. Add the person to Close Friends.

### Updating content

- **Text, account details and "last updated" dates:** `public/js/content.js`. Edit both `fi` and `en`; they must keep the same keys.
- **Hero photo:** put the image in `public/images/`, then in `index.html` give the hero `<img>` a `src`, `width` and `height`, and remove `hidden` from its `<figure>`. The hero switches to two columns by itself.
- **Study link:** set the `href` of the link in the treatment card and remove its `hidden` attribute.
- **Instagram link in the footer:** set its `href` and remove `hidden` from the surrounding paragraph.

Then deploy again.

---

## Design Decisions and Challenges

### The bank statement is the record

An earlier version had a form, a Cloud Function, Firestore and email notifications. Tuomas's own instructions already put the payer's name and username in the payment message, so the statement holds everything he needs, and a separate form only added a way for payment and form to disagree. The backend was removed; it remains in the git history.

### Copying the message instead of a form

Building the message on the page keeps payment and username in one step without collecting any data. Validation is the same as Instagram's username rules, and the message is capped at the 140 characters a bank message allows.

### Self-hosted fonts

Loading Google Fonts from Google would send every visitor's IP address to Google and require loosening the Content Security Policy. The fonts are subset to Latin (including ä, ö, å, € and arrows) and served from the site, about 71 KB in total.

### Native scrolling for the carousel

The story cards use CSS scroll-snap, so swiping is the browser's own scrolling. `SnapCarousel` only adds tabs, arrows and the "current card" marker, and tracks position from the scroll offset because two cards can be mostly visible at once when the neighbours peek in.

### Kept apart on purpose

The donation and the paid access go to different accounts, have separate tabs and different card styling, and the donation text states that it gives nothing in return.
