/* global setInterval, clearInterval*/
class CountdownManager {
  static instance;

  constructor() {
    if (CountdownManager.instance) return CountdownManager.instance;
    CountdownManager.instance = this;
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

  tick() {
    if (!this.endTime) return;
    const now = new Date();
    const diff = this.endTime - now;
    let text;

    if (diff <= 0) {
      text = this.copy || "Time's up!";
      clearInterval(this.interval);
      this.interval = null;
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      text = `${this.copy} <b style="color:var(--c-dark-grey);"> ${days}D&nbsp;&nbsp;${hours}H&nbsp;&nbsp;${minutes}M&nbsp;&nbsp;${seconds}S</b>`;
    }

    this.subscribers.forEach((el) => (el.innerHTML = text));
  }

  register(el) {
    this.subscribers.add(el);
  }

  unregister(el) {
    this.subscribers.delete(el);
  }
}

export default new CountdownManager(); // Always return the same instance
