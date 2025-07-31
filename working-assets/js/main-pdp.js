/* global IntersectionObserver */

import Splide from "./splide.min.js";
import { Cart } from "./main.js";
import { SplideUtil } from "./SplideUtil.js";
import Panzoom from "./panzoom.js";
import { CountdownManager } from "./CountdownManager.js";

// ===================
// PDP Main Carousel
// ===================
if (!customElements.get("pdp-carousel")) {
  customElements.define(
    "pdp-carousel",
    class PDPCarousel extends HTMLElement {
      constructor() {
        super();
        this.availableHeight =
          window.innerHeight * 0.95 -
          document.querySelector(".atc_form-button").getBoundingClientRect().height - // atb button
          document.getElementById("shopify-section-header-main").getBoundingClientRect().height - // header
          document.getElementById("shopify-section-header-announcement").getBoundingClientRect().height - //annoucement bar
          document.getElementById("product-summary").getBoundingClientRect().height; // product summary information
        this.splide = null;
        this.zoomBtn = document.createElement("button");
        this.zoomBtn.className = "pdp-zoom-btn round-btn";
        this.zoomBtn.innerHTML = `  <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      class="Icon Icon--plus"
                                    >
                                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" />
                                    </svg>`;
        this.zoomBtn.addEventListener("click", () => this._zoom());
        this.style.maxHeight = `${this.availableHeight}px`;
      }

      connectedCallback() {
        this._splideMainInit();
        this.appendChild(this.zoomBtn);
      }

      // initialise the Main splide slider for the product images
      _splideMainInit = () => {
        SplideUtil.splideHTML(this);
        this.splide = new Splide(this, {
          type: "loop",
          pagination: true,
          arrows: false,
          preloadPages: 1,
          perPage: 1,
          lazyLoad: "nearby",
        });

        this.splide.on(
          "move",
          () => {
            this.style.maxHeight = "max-content";
          },
          { once: true },
        );

        this.splide.mount();
      };

      // create and display the panzoom zoom overlay element
      _zoom = () => {
        document.body.style.overflowY = "hidden";

        const targetImg = this.querySelector(".is-active > img");
        if (!targetImg) return;

        const imgUrl = targetImg.src;

        const zoomEl = document.createElement("div");
        zoomEl.className = "pdp-zoom-wrapper";

        const zoomImg = document.createElement("img");
        zoomImg.className = "pdp-zoom-img";
        zoomImg.src = imgUrl;

        const zoomClose = document.createElement("button");
        zoomClose.className = "pdp-zoom-close-btn round-btn";
        zoomClose.innerHTML = `
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="Icon Icon--plus rotate45"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 5l0 14" />
            <path d="M5 12l14 0" />
          </svg>`;
        zoomClose.addEventListener("click", this._unzoom);

        const zoomRange = document.createElement("input");
        zoomRange.type = "range";
        zoomRange.min = "0.5";
        zoomRange.max = "2";
        zoomRange.step = "0.1";
        zoomRange.value = "1"; // default zoom level
        zoomRange.setAttribute("orient", "vertical");
        zoomRange.className = "pdp-zoom-range";

        // Append elements
        zoomEl.appendChild(zoomImg);
        zoomEl.appendChild(zoomClose);
        zoomEl.appendChild(zoomRange);
        document.body.appendChild(zoomEl);

        //calculate the initial pan position

        // Initialize Panzoom
        setTimeout(() => {
          const panzoom = Panzoom(zoomImg, {
            // canvas: true,
            maxScale: 2,
            minScale: 0.5,
            startScale: 0.5,
          });

          zoomEl.addEventListener("wheel", panzoom.zoomWithWheel);
          zoomRange.addEventListener("input", (event) => {
            panzoom.zoom(event.target.valueAsNumber);
          });
          zoomImg.addEventListener("panzoomzoom", (e) => {
            zoomRange.value = e.detail.scale.toFixed(1);
          });
        }, 300);

        // Animate into view
        requestAnimationFrame(() => {
          zoomEl.classList.add("visible");
        });
      };

      // destroy the panzoom element when close button is clicked
      _unzoom = () => {
        const zoomEl = document.querySelector(".pdp-zoom-wrapper");
        if (!zoomEl) return;
        document.body.style.overflowY = "auto";
        zoomEl.classList.remove("visible");

        setTimeout(() => {
          zoomEl.remove();
        }, 500);
      };
    },
  );
}

// ===================
// Add to Cart Form
// ===================
if (!customElements.get("enhanced-atc")) {
  customElements.define(
    "enhanced-atc",
    class EnhancedATC extends HTMLElement {
      constructor() {
        super();
        this.isButtonVisible = true;
      }

      connectedCallback() {
        this.atcButtonPosition = this.querySelector(".atc_form-button-spacer");
        this.actualForm = this.closest("form");
        this.atcButton = this.querySelector(".atc_form-button");
        this.allGroups = this.querySelectorAll(".atc_form-sizes");
        this.allGroups.length > 1 ? (this.atcButton.innerText = "Select Sizes") : (this.atcButton.innerText = "Select Size");
        this._currentSubmitHandler = this._scrollToSizes;
        this.actualForm.addEventListener("submit", this._submitDispatcher);
        this.actualForm.addEventListener("change", this._watchSizeSelection);
        this._handleStickyButton();
        this._setObserver();
      }

      // overrides the default submit event and calls the correct function based on size selection
      _submitDispatcher = (event) => {
        event.preventDefault();
        this._currentSubmitHandler(event);
      };

      // if no size/s are selected scroll the user to select size on form submission attempt
      _scrollToSizes = (event) => {
        event.preventDefault();
        document.getElementById("product-details").scrollIntoView({ behavior: "smooth", block: "start" });
      };

      // watch the size selection block/s and update the submission function if all blocks/products have a size selected.
      _watchSizeSelection = (event) => {
        if (event.target.type === "radio" && event.target.name.startsWith("id")) {
          const selectedSizes = Array.from(this.allGroups).map((group) => {
            const checked = group.querySelector('input[type="radio"]:checked');
            return checked ? checked.dataset.size || checked.getAttribute("data-size") || checked.value : null;
          });

          const allSelected = selectedSizes.every(Boolean);
          const selectedSizesStr = selectedSizes.filter(Boolean).join(", ");

          if (allSelected) {
            this.atcButton.innerHTML = `<b>Add to Bag</b> <span>| size: ${selectedSizesStr}</span>`;
            this._currentSubmitHandler = this._addToCart;
          }
        }
      };

      // the add to cart submission method for when all products have selected sizes
      _addToCart = () => {
        const atcButtonContent = this.atcButton.innerHTML;
        this.atcButton.innerHTML = `<div class="loader" style="--height:1em;z-index:1;"></div>`;
        const selectedRadios = this.querySelectorAll('.atc_form-sizes input[type="radio"]:checked');
        const items = Array.from(selectedRadios).map((radio) => ({
          id: radio.value,
          quantity: 1,
        }));
        if (items.length > 0) {
          Cart.addItems(items);
        }
        window.addEventListener("cart:itemsAdded", () => {
          setTimeout(() => {
            this.atcButton.innerHTML = atcButtonContent;
          }, 300);
        });
      };

      // set the intersection observer to allow the dynamic add to cart button.
      _setObserver = () => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              this.isButtonVisible = entry.isIntersecting;
              this._handleStickyButton();
            });
          },
          {
            root: null, // viewport
            rootMargin: "-50px 0px 0px 0px",
            threshold: 0,
          },
        );

        observer.observe(this.atcButtonPosition);
      };

      // the method called by an intersection event on the add to cart original position
      _handleStickyButton = () => {
        if (!this.isButtonVisible && window.innerWidth < 768) {
          this.atcButton.classList.add("is_sticky", "to_sticky");
        } else {
          this.atcButton.classList.remove("is_sticky", "to_sticky");
        }
      };
    },
  );
}

// ===================
// Manage the delivery status
// ===================

if (!customElements.get("freedelivery-info")) {
  customElements.define(
    "freedelivery-info",
    class DeliveryInfo extends HTMLElement {
      connectedCallback() {
        document.addEventListener("delivery:statusUpdated", this.updateInfo);
      }

      updateInfo = (event) => {
        const details = event.detail;
        const copyEl = this.querySelector(".free-delivery_text");
        let msg = "";

        if (details.thresholdReached && (!details.threshold2Reached || !details.threshold2Show)) {
          msg = `<strong>You've unlocked ${details.thresholdName}.</strong>`;
        } else if (!details.threshold2Reached || !details.threshold2Show) {
          msg = `FREE ${details.thresholdName} over ${Cart.formatMoney(details.thresholdValue)}.`;
        }

        if (details.threshold2Show) {
          msg != "" ? (msg += `<br>`) : "";
          if (details.threshold2Reached) {
            msg += `<strong>You've unlocked ${details.threshold2Name}.</strong>`;
          } else {
            msg += `FREE ${details.threshold2Name} over ${Cart.formatMoney(details.threshold2Value)}.`;
          }
        }

        copyEl.innerHTML = msg;
      };
    },
  );
}

// ===================
// Dispatch Timer Countdown
// ===================

if (!customElements.get("dispatch-timer")) {
  customElements.define(
    "dispatch-timer",
    class DispatchTimer extends HTMLElement {
      constructor() {
        super();
        this.timer = null;
      }

      connectedCallback() {
        this.endpoint = this.querySelector(".countdown-endpoint");
        this.timerInit();
      }

      getNextDispatchTime() {
        const now = new Date();
        const dispatchTime = new Date(now);
        dispatchTime.setHours(19, 0, 0, 0); // Set to 7 PM

        // If it's past 7 PM, set for next day
        if (now > dispatchTime) {
          dispatchTime.setDate(dispatchTime.getDate() + 1);
        }

        return dispatchTime;
      }

      timerInit() {
        const nextDispatch = this.getNextDispatchTime();

        // Create a separate instance for dispatch timers
        const dispatchTimer = CountdownManager.getInstance('dispatch');
        dispatchTimer.configure(nextDispatch, 'within');
        dispatchTimer.register(this.endpoint);
      }

      disconnectedCallback() {
        if (this.endpoint) {
          const dispatchTimer = CountdownManager.getInstance('dispatch');
          dispatchTimer.unregister(this.endpoint);
        }
      }
    },
  );
}
