export class Base {
  observer: MutationObserver;

  constructor() {
    this.observer = this.makeMutationObserver();
    this.start();
  }

  start() {
    this.observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  makeMutationObserver() {
    return new MutationObserver(() => {
      this.processDOM();
    });
  }

  processDOM() {
    console.warn("-- processDom should be overwritten by platform class");
  }
}
