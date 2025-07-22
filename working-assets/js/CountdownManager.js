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
      text = "Time's up!";
      clearInterval(this.interval);
      this.subscribers.forEach((el) => (el.parentElement.remove()));
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      let totalTime = ``;
      if (days > 0) totalTime += `${days}D&nbsp;&nbsp;`;
      if (hours > 0 || days > 0) totalTime += `${hours}H&nbsp;&nbsp;`;
      if (minutes > 0 || hours > 0 || days > 0) totalTime += `${minutes}M&nbsp;&nbsp;`;
      if (seconds > 0 || minutes > 0 || hours > 0 || days > 0) totalTime += `${seconds}S`;

      text = `${this.copy} <b> ${totalTime}</b>`;
      this.subscribers.forEach((el) => (el.innerHTML = text));
    }

  }

  register(el) {
    this.subscribers.add(el);
  }

  unregister(el) {
    this.subscribers.delete(el);
  }
}

export default new CountdownManager(); // Always return the same instance
