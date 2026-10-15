/**
 * Builds the share links for each service from a page address and title.
 * Plain links only: nothing is sent anywhere until a visitor follows one.
 */
export class ShareTargets {
  #url;
  #title;

  /**
   * @param {string} url
   * @param {string} title
   */
  constructor(url, title) {
    this.#url = url;
    this.#title = title;
  }

  /**
   * @param {string} name One of whatsapp, facebook, x, email.
   * @returns {string}
   */
  hrefFor(name) {
    switch (name) {
      case "whatsapp":
        return this.#build("https://wa.me/", {
          text: `${this.#title} ${this.#url}`,
        });
      case "facebook":
        return this.#build("https://www.facebook.com/sharer/sharer.php", {
          u: this.#url,
        });
      case "x":
        return this.#build("https://x.com/intent/tweet", {
          text: this.#title,
          url: this.#url,
        });
      case "email":
        return this.#mailto();
      default:
        throw new Error(`Unknown share target: ${name}`);
    }
  }

  #build(base, params) {
    const target = new URL(base);
    for (const [key, value] of Object.entries(params)) {
      target.searchParams.set(key, value);
    }
    return target.href;
  }

  // URLSearchParams encodes spaces as "+", which mail clients show
  // literally, so mailto needs percent-encoding instead.
  #mailto() {
    const subject = encodeURIComponent(this.#title);
    const body = encodeURIComponent(this.#url);
    return `mailto:?subject=${subject}&body=${body}`;
  }
}