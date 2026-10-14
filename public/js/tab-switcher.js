/**
 * Turns a row of buttons and their panels into accessible tabs, so only
 * one panel shows at a time.
 *
 * Expects a hidden `[data-tablist]` with buttons whose `data-tab` names a
 * panel id. Roles and states are added here, so without JavaScript the
 * page simply shows every panel.
 */
export class TabSwitcher {
  #tablist;
  #tabs;

  /** @param {HTMLElement} root */
  constructor(root) {
    this.#tablist = root.querySelector("[data-tablist]");
    this.#tabs = [...this.#tablist.querySelectorAll("[data-tab]")];
  }

  /** Shows the tabs and selects the first one. */
  start() {
    this.#tablist.setAttribute("role", "tablist");
    this.#tablist.hidden = false;

    for (const tab of this.#tabs) {
      const panel = this.#panelFor(tab);

      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panel.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);

      tab.addEventListener("click", () => this.#select(tab));
      tab.addEventListener("keydown", (event) => this.#onKeyDown(event, tab));
    }

    this.#select(this.#tabs[0]);
  }

  #select(selected) {
    for (const tab of this.#tabs) {
      const isSelected = tab === selected;

      tab.setAttribute("aria-selected", String(isSelected));
      // Roving tabindex: Tab moves past the tab row in one step, and the
      // arrow keys move between tabs, as the ARIA tabs pattern expects.
      tab.tabIndex = isSelected ? 0 : -1;
      this.#panelFor(tab).hidden = !isSelected;
    }
  }

  #onKeyDown(event, tab) {
    const index = this.#tabs.indexOf(tab);
    const last = this.#tabs.length - 1;
    const targets = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };

    if (!(event.key in targets)) {
      return;
    }

    event.preventDefault();
    const next = this.#tabs[targets[event.key]];
    this.#select(next);
    next.focus();
  }

  #panelFor(tab) {
    return document.getElementById(tab.dataset.tab);
  }
}
