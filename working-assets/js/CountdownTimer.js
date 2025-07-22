/* global clearInterval, setInterval  */

// element requires a data-coundown attribute with JSON data
// e.g. <countdown-timer data-countdown='{"end": "2023-12-31T23:59:59Z", "copy": "Sale ends in"}
// The "end" property should be a valid date string, and "copy" is optional
// The component will display the countdown in the format: "Sale ends in 2D 3H 15M 30S"
// If the countdown reaches zero, it will display "Time's up!" or the provided inline text.

export default class CountdownTimer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    console.log("Countdown Timer connected");
    const countdownData = JSON.parse(this.dataset.countdown) || {};
    this.endDate = countdownData.end;
    this.endTime = new Date(this.endDate);
    this.inlineText = countdownData.copy;

    this.startTimer();
  }

  startTimer() {
    console.log(this.endDate);

    this.timerInterval = setInterval(() => {
      const now = new Date();
      const diff = this.endTime - now;

      if (diff <= 0) {
        this.textContent = this.inlineText || "Time's up!";
        clearInterval(this.timerInterval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      this.innerHTML = `${this.inlineText} <b style="color:var(--c-dark-grey);"> ${days}D&nbsp;&nbsp;${hours}H&nbsp;&nbsp;${minutes}M&nbsp;&nbsp;${seconds}S</b>`;
    }, 1000);
  }

  disconnectedCallback() {
    clearInterval(this.timerInterval);
  }
}
