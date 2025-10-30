/* global iWish navigator */

// ===================
// Product Cards
// ===================
export default class ProductCard extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this._init();

    // Listen for countdown ended event
    this._countdownHandler = () => {
      const decal = this.querySelector(".product_card-decal");
      if (decal) decal.remove();
    };
    window.addEventListener("countdown:ended", this._countdownHandler);
  }

  _init() {
    window.gkUtils.bindQATBButtons(this);

    // add click listeners to the open mobile qatb button
    const openmqatbBtn = this.querySelector(".mqatb-show");
    if (!openmqatbBtn) return;
    openmqatbBtn.addEventListener("click", (event) => this._openMobileQB(event));

    // add click listeners to the Iwish buttons
    const el = this.querySelector(".iWishColl");
    if (el) {
      if (typeof iWish !== "undefined" && iWish.iwishAddClick) {
        iWish.iwishAddClick(el);
      }
    }

    // add click listeners to the modal close button
    const close = this.querySelector(".mqatb-close");
    if (close) close.addEventListener("click", (event) => this._closeMobileQB(event));
  }

  _openMobileQB(event) {
    const isOverlay = document.body.classList.contains("no-scroll");
    const trigger = event.currentTarget || event.target;
    const modalID = trigger.dataset.target;
    let modalEl = document.getElementById(modalID);

    if (!modalEl) {
      modalEl = this._buildMobileQB(trigger);
      document.body.appendChild(modalEl);
      window.gkUtils.bindQATBButtons(modalEl);
    }

    setTimeout(() => {
      modalEl.classList.add("active");
      isOverlay ? modalEl.classList.add("keep-overlay") : "";
      modalEl.setAttribute("aria-hidden", "false");
      document.querySelector("page-overlay").openThis();

      // Touch swipe-to-close support for mobile devices
      if ("ontouchstart" in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)) {
        // Remove any previous listeners if present
        if (this._touchStartListener) {
          modalEl.removeEventListener("touchstart", this._touchStartListener);
          this._touchStartListener = null;
        }
        if (this._touchEndListener) {
          modalEl.removeEventListener("touchend", this._touchEndListener);
          this._touchEndListener = null;
        }
        // Handler for touchstart: record startY
        this._touchStartListener = (touchEvent) => {
          if (touchEvent.touches && touchEvent.touches.length > 0) {
            this._touchStartY = touchEvent.touches[0].clientY;
          }
        };
        // Handler for touchend: check swipe down
        this._touchEndListener = (touchEvent) => {
          if (typeof this._touchStartY !== "number") return;
          if (touchEvent.changedTouches && touchEvent.changedTouches.length > 0) {
            const endY = touchEvent.changedTouches[0].clientY;
            const deltaY = endY - this._touchStartY;
            if (deltaY > 50) {
              // Swipe down detected; close modal
              // Synthetic event with target as modalEl
              this._closeMobileQB({ target: modalEl });
            }
          }
          this._touchStartY = null;
        };
        modalEl.addEventListener("touchstart", this._touchStartListener);
        modalEl.addEventListener("touchend", this._touchEndListener);
      }
    }, 200);
  }

  _buildMobileQB(trigger) {
    const imgURLs = trigger.dataset.images.split(",");
    const modalID = trigger.dataset.target;
    const productTitle = trigger.dataset.productTitle;

    //create the modal
    const modal = document.createElement("div");
    modal.className = "fade-in mqatb-modal modal";
    modal.id = modalID;
    modal.setAttribute("aria-hidden", "true");

    // create the image container and render the images
    const images = document.createElement("div");
    images.className = "mqatb-images";
    const loopEnd = imgURLs.length < 8 ? imgURLs.length : 8;
    for (let i = 0, len = loopEnd; i < len; i++) {
      const img = document.createElement("img");
      img.src = imgURLs[i];
      img.draggable = false;
      img.alt = `${productTitle} - image ${i + 1}`;
      images.appendChild(img);
    }

    // Copy the product details
    const productInfo = this.querySelector(".product_card-info").innerHTML;
    const info = document.createElement("div");
    info.className = "mqatb-info";
    info.innerHTML = productInfo;

    // Copy add to bag buttons
    const buttonsData = this.querySelector(".datb").innerHTML;
    const buttons = document.createElement("div");
    buttons.className = "mqatb-btns";
    buttons.innerHTML = `Quick Add: ${buttonsData}`


    // add content to the modal
    const modalContent = document.createElement("div");
    modal.appendChild(images);
    modalContent.appendChild(info);
    modalContent.appendChild(buttons);
    modal.appendChild(modalContent);

    //create the close button and add close functionality
    const close = document.createElement("div");
    close.className = "round-btn mqatb-close";
    const closeIcon = `
     <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="rotate45 icon icon-plus"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" />
    </svg>`;
    close.innerHTML = closeIcon;
    modal.appendChild(close);
    close.addEventListener("click", (event) => this._closeMobileQB(event));

    //return the modal for rendering to dom
    return modal;
  }

  _closeMobileQB(event) {
    const modal = event.target.closest(".mqatb-modal");
    const keepOverlay = modal.classList.contains("keep-overlay");
    // Remove touch listeners if present
    if (this._touchStartListener) {
      modal.removeEventListener("touchstart", this._touchStartListener);
      this._touchStartListener = null;
    }
    if (this._touchEndListener) {
      modal.removeEventListener("touchend", this._touchEndListener);
      this._touchEndListener = null;
    }
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    !keepOverlay ? document.querySelector("page-overlay").closeThis() : "";
    modal.classList.remove("keep-overlay");
  }

  disconnectedCallback() {
    if (this._countdownHandler) {
      window.removeEventListener("countdown:ended", this._countdownHandler);
    }
  }
}
