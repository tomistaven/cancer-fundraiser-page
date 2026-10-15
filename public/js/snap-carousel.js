/**
 * Adds navigation to a horizontally scrolling row of cards: a button per
 * card, previous / next buttons, and a marker on the card in view.
 *
 * Expects `[data-carousel-track]` holding the cards and a hidden
 * `[data-carousel-nav]` containing buttons whose `data-carousel-tab` names
 * a card id, plus `[data-carousel-prev]` and `[data-carousel-next]`.
 * Swiping is the browser's own scroll-snap; without JavaScript the
 * navigation simply stays hidden.
 */
export class SnapCarousel {
  #nav;
  #tabs;
  #cards;
  #previous;
  #next;
  #track;
  #currentIndex = 0;
  #frameRequested = false;

  /** @param {HTMLElement} root */
  constructor(root) {
    this.#track = root.querySelector("[data-carousel-track]");
    this.#nav = root.querySelector("[data-carousel-nav]");
    this.#tabs = [...root.querySelectorAll("[data-carousel-tab]")];
    this.#cards = this.#tabs.map((tab) =>
      document.getElementById(tab.dataset.carouselTab),
    );
    this.#previous = root.querySelector("[data-carousel-prev]");
    this.#next = root.querySelector("[data-carousel-next]");
  }

  /** Shows the navigation and starts following which card is in view. */
  start() {
    this.#nav.hidden = false;

    this.#tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => this.#scrollTo(index));
    });
    // Only a peeking card moves the row; clicks inside the current card
    // (selecting text, following a link) must not scroll it away.
    this.#cards.forEach((card, index) => {
      card.addEventListener("click", () => {
        if (index !== this.#currentIndex) {
          this.#scrollTo(index);
        }
      });
    });
    this.#previous.addEventListener("click", () =>
      this.#scrollTo(this.#currentIndex - 1),
    );
    this.#next.addEventListener("click", () =>
      this.#scrollTo(this.#currentIndex + 1),
    );

    this.#track.addEventListener("scroll", () => this.#onScroll(), {
      passive: true,
    });

    this.#markCurrent(0);
  }

  #scrollTo(index) {
    const card = this.#cards[index];

    if (!card) {
      return;
    }

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scrolling the row itself, rather than scrollIntoView, keeps the page
    // from jumping vertically. The track is the cards' offset parent, and
    // the browser clamps the first and last cards to the row's edges.
    this.#track.scrollTo({
      left: this.#centre(card) - this.#track.clientWidth / 2,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  #centre(card) {
    return card.offsetLeft + card.offsetWidth / 2;
  }

  // Scroll events fire many times per frame; one update per frame is enough.
  #onScroll() {
    if (this.#frameRequested) {
      return;
    }

    this.#frameRequested = true;
    requestAnimationFrame(() => {
      this.#frameRequested = false;
      this.#markCurrent(this.#indexInView());
    });
  }

  #indexInView() {
    const track = this.#track;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;

    // The first and last cards can never reach the centre, so the row's
    // ends count as those cards.
    if (track.scrollLeft <= 2) {
      return 0;
    }

    if (atEnd) {
      return this.#cards.length - 1;
    }

    const viewCentre = track.scrollLeft + track.clientWidth / 2;
    const distances = this.#cards.map((card) =>
      Math.abs(this.#centre(card) - viewCentre),
    );

    return distances.indexOf(Math.min(...distances));
  }

  #markCurrent(index) {
    this.#currentIndex = index;

    this.#tabs.forEach((tab, tabIndex) => {
      if (tabIndex === index) {
        tab.setAttribute("aria-current", "true");
      } else {
        tab.removeAttribute("aria-current");
      }
    });

    this.#cards.forEach((card, cardIndex) => {
      card.toggleAttribute("data-current", cardIndex === index);
    });

    this.#previous.disabled = index === 0;
    this.#next.disabled = index === this.#cards.length - 1;
  }
}
