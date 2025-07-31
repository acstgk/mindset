import { CountdownManager } from "./CountdownManager.js";

// Use the shared instance for all CountdownTimer components
const countdownManager = CountdownManager.getInstance('sharedSaleEnd');

// element requires a data-coundown attribute with JSON data
// e.g. <countdown-timer data-countdown='{"end": "2023-12-31T23:59:59Z", "copy": "Sale ends in"}
// The "end" property should be a valid date string, and "copy" is optional
// The component will display the countdown in the format: "Sale ends in 2D 3H 15M 30S"
// If the countdown reaches zero, it will display "Time's up!" or the provided inline text.

export default class CountdownTimer extends HTMLElement {
  connectedCallback() {
    const countdownData = JSON.parse(this.dataset.countdown || "{}");
    countdownManager.configure(countdownData.end, countdownData.copy);
    countdownManager.register(this);
  }

  disconnectedCallback() {
    countdownManager.unregister(this);
  }
}
