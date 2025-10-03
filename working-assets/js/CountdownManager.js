/* global setInterval, clearInterval */
class CountdownManager {
  static instances = new Map();

  static getInstance(name = 'default') {
    if (!this.instances.has(name)) {
      this.instances.set(name, new CountdownManager());
    }
    return this.instances.get(name);
  }

  constructor() {
    this.endTime = null;
    this.copy = "Time's up!";
    this.subscribers = new Set();
    this.interval = null;
  }

  configure(endDate, copy = "Ends in") {
    this.endTime = new Date(endDate);
    this.copy = copy;
    if (!this.interval) this.start();
  }

  start() {
    this.interval = setInterval(() => this.tick(), 1000);
  }

  endCountdown() {
    clearInterval(this.interval);
    window.dispatchEvent(new CustomEvent("countdown:ended"));
    this.subscribers.forEach((el) => {
      const parent = el.parentElement;
      if (parent.classList.contains("splide__slide")) {
        el.closest(".splide").splide.remove(`#${parent.id}`); // Remove from Splide if applicable
      } else {
        parent.remove();
      }
    });
  }

  tick() {
    if (!this.endTime) return;
    const now = new Date();
    const diff = this.endTime - now;
    let text;

    if (diff <= 0) {
      this.endCountdown();
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      let totalTime = ``;
      if (days > 0) totalTime += `${days}D&nbsp;`;
      if (hours > 0 || days > 0) totalTime += `${hours}H&nbsp;`;
      if (minutes > 0 || hours > 0 || days > 0) totalTime += `${minutes}M&nbsp;`;
      totalTime += `${seconds}S`;

      text = `${this.copy} <b> ${totalTime}</b>`;
      this.subscribers.forEach((el) => (el.innerHTML = text));
      return diff;
    }
  }

  register(el) {
    this.subscribers.add(el);
  }

  unregister(el) {
    this.subscribers.delete(el);
  }
}

// Export both the class and a default instance
export { CountdownManager };
export default CountdownManager.getInstance('default'); // Default shared instance
