/**
 * Adds quick-jump buttons to a horizontally scrolling row of cards and
 * marks the button of the card currently in view.
 *
 * Expects `[data-carousel-track]` holding the cards and a hidden
 * `[data-carousel-tabs]` with buttons whose `data-carousel-tab` names a
 * card id. Swiping is the browser's own scroll-snap; without JavaScript
 * the buttons simply stay hidden.
 */
export class SnapCarousel {
  // A card counts as current once most of it is visible.
  static #VISIBLE_RATIO = 0.6;

  #track;
  #tabs;
  #buttons;
  #observer = null;

  /** @param {HTMLElement} root */
  constructor(root) {
    this.#track = root.querySelector("[data-carousel-track]");
    this.#tabs = root.querySelector("[data-carousel-tabs]");
    this.#buttons = [...root.querySelectorAll("[data-carousel-tab]")];
  }

  /** Shows the buttons and starts following which card is in view. */
  start() {
    this.#tabs.hidden = false;

    for (const button of this.#buttons) {
      button.addEventListener("click", () => this.#scrollTo(button));
    }

    this.#observer = new IntersectionObserver(
      (entries) => this.#onVisibilityChange(entries),
      { root: this.#track, threshold: SnapCarousel.#VISIBLE_RATIO },
    );

    for (const button of this.#buttons) {
      this.#observer.observe(this.#cardFor(button));
    }

    this.#markCurrent(this.#buttons[0]);
  }

  #scrollTo(button) {
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // "nearest" keeps the page itself from jumping vertically; only the
    // row scrolls sideways.
    this.#cardFor(button).scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });
  }

  #onVisibilityChange(entries) {
    const visible = entries.find((entry) => entry.isIntersecting);

    if (visible) {
      this.#markCurrent(
        this.#buttons.find(
          (button) => button.dataset.carouselTab === visible.target.id,
        ),
      );
    }
  }

  #markCurrent(current) {
    for (const button of this.#buttons) {
      if (button === current) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    }
  }

  #cardFor(button) {
    return document.getElementById(button.dataset.carouselTab);
  }
}