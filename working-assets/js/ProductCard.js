/* global iWish */
import { Cart } from "./main.js";

// ===================
// Product Cards
// ===================
export default class ProductCard extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this._init();
    this._moveMobileQB();

    // Listen for countdown ended event
    this._countdownHandler = () => {
      const decal = this.querySelector(".product_card-decal");
      if (decal) decal.remove();
    };
    window.addEventListener("countdown:ended", this._countdownHandler);
  }

  _init() {
    // add click listeners to all the desktop quick add to basket buttons
    const qatbButtons = this.querySelectorAll(".qatb-btn:not([data-click-added])") || [];

    qatbButtons.forEach((btn) => {
      btn.setAttribute("data-click-added", "true");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const targetButton = e.currentTarget;
        const targetSize = targetButton.innerText;

        // remove any existing cart errors
        const errors = targetButton.closest(".qatb-btns").parentElement.querySelectorAll(".cart-error");
        errors.forEach((error) => {
          error.remove();
        });

        targetButton.innerHTML = `<div class="loader"></div>`; // add the loading animation

        //add the product/s
        Cart.addItems(targetButton.dataset.vId)
          .then(() => {
            //if success
            targetButton.innerHTML = targetSize;
            //close the modal so cart can open
            const modal = document.getElementById(`mqatb-${this.dataset.prodId}`);
            modal ? modal.classList.remove("active") : "";
          })
          .catch((error) => {
            // if error
            targetButton.innerHTML = targetSize;

            // display an error message next to the qatb buttons
            const errorBox = document.createElement("div");
            errorBox.className = "cart-error warning";
            errorBox.textContent = error.description || "Sorry, something went wrong.";
            targetButton.closest(".qatb-btns").before(errorBox);
          });
      });
    });

    // add click listeners to the open mobile qatb button
    const openmqatbBtn = this.querySelector(".mqatb-show:not([data-click-added])");
    if (!openmqatbBtn) return;
    openmqatbBtn.setAttribute("data-click-added", "true");
    openmqatbBtn.addEventListener("click", (event) => this._openMobileQB(event));

    // add click listeners to the Iwish buttons
    const el = this.querySelector(".iWishColl:not([data-click-added])");
    el.setAttribute("data-click-added", "true");
    if (typeof iWish !== "undefined" && iWish.iwishAddClick) {
      iWish.iwishAddClick(el);
    }

    // add click listeners to the modal close button
    const close = this.querySelector(".mqatb-close");
    close.addEventListener("click", (event) => this._closeMobileQB(event));
  }

  _openMobileQB(event) {
    const modalID = event.target.dataset.target;
    const modalEl = document.getElementById(modalID);
    modalEl.classList.add("active");
    modalEl.setAttribute("aria-hidden", "false");
    document.querySelector("page-overlay").openThis();
  }

  _closeMobileQB(event) {
    const modal = event.target.closest(".mqatb-modal");
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.querySelector("page-overlay").closeThis();
  }

  _moveMobileQB() {
    const modal = this.querySelector(".mqatb-modal");
    if (!modal) return;
    const body = document.body;
    body.appendChild(modal);
  }

  disconnectedCallback() {
    if (this._countdownHandler) {
      window.removeEventListener("countdown:ended", this._countdownHandler);
    }
  }
}
