/* global IntersectionObserver Cart*/

import Splide from "./splide.min.js";
import { SplideUtil } from "./SplideUtil.js";
import { CountdownManager } from "./CountdownManager.js";
import Panzoom from "./panzoom.js";
import RecentlyViewed from "./RecentlyViewed.js";

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

        window.innerWidth < 768 ? (this.style.maxHeight = `${this.availableHeight}px`) : "";
      }

      connectedCallback() {
        this._splideMainInit();
        this.appendChild(this.zoomBtn);
      }

      // initialise the Main splide slider for the product images
      _splideMainInit = () => {
        const shouldUseThumbs = window.innerWidth > 1200;
        const thumbCarouselEl = document.querySelector("thumbnail-carousel");
        let thumbSplide = null;

        // If thumbnails should be used and exist AND have an initialized Splide
        if (shouldUseThumbs && thumbCarouselEl && thumbCarouselEl.splide) {
          thumbSplide = thumbCarouselEl.splide;
        }

        SplideUtil.splideHTML(this);
        this.splide = new Splide(this, {
          type: "loop",
          pagination: true,
          arrows: false,
          preloadPages: 1,
          perPage: 1,
          lazyLoad: "nearby",
        });

        if (thumbSplide) {
          this.splide.sync(thumbSplide);
        }

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
// Update the product localstorage object
// ===================

const recentlyViewed = new RecentlyViewed();
recentlyViewed.addProductToList();

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
        this.totalRadio = this.querySelectorAll('input[type="radio"]').length;
        this.allGroups = this.querySelectorAll(".atc_form-sizes");
        this.quantityWarningEl = this.querySelector(".quantity-warning");
        this.allGroups.length > 1 ? (this.atcButton.innerText = "Select Sizes") : (this.atcButton.innerText = "Select Size");
        this._currentSubmitHandler = this._scrollToSizes;
        this.actualForm.addEventListener("submit", this._submitDispatcher);
        this.actualForm.addEventListener("change", this._watchSizeSelection);
        this._handleStickyButton();
        this._setObserver();
        this._watchSizeSelection();
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
      _watchSizeSelection = () => {
        const selectedSizes = Array.from(this.allGroups).map((group) => {
          const checked = group.querySelector('input[type="radio"]:checked');
          return checked ? checked.dataset.size || checked.getAttribute("data-size") || checked.value : null;
        });

        const allSelected = selectedSizes.every(Boolean);
        const selectedSizesStr = selectedSizes.filter(Boolean).join(", ");

        if (allSelected) {
          const sizeCopy = this.totalRadio > 1 ? `<span>| size: ${selectedSizesStr}</span>` : "";
          this.atcButton.innerHTML = `<b>Add to Bag</b> ${sizeCopy}`;
          this._currentSubmitHandler = this._addToCart;
        }

        if (this.allGroups.length == 1) {
          const availableQty = this.querySelector('input[type="radio"]:checked')?.dataset.availableQty;
          if (availableQty < 20 && availableQty > 0) {
            availableQty == 1 ? (this.quantityWarningEl.textContent = `Hurry! this is the last one.`) : (this.quantityWarningEl.textContent = `Popular - only ${availableQty} left!`);
            this.quantityWarningEl.classList.add("warning-active");
          } else {
            this.quantityWarningEl.classList.remove("warning-active");
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
        this.hoursDiff = 0;
        this.cutoffHours = 19; // 7 PM
        this.cutoffFriHours = 13; // 1 PM
        this.cutoffMins = 30;
        this.settings = {};
        this.useSaturdayDelivery = false;
      }

      connectedCallback() {
        this.endpoint = this.querySelector(".countdown-endpoint");
        this.etaEndpoint = this.querySelector(".eta-endpoint");
        this.serviceEndpoint = this.querySelector(".service-endpoint");
        this.settings = JSON.parse(this.dataset.settings);
        this.initialContent = this.innerHTML;
        this.timerInit();
        this.updateDeliveryInfo();
      }

      getNextDispatchTime() {
        const now = new Date();
        const dispatchTime = new Date(now);
        dispatchTime.setHours(this.cutoffHours, this.cutoffMins, 0, 0);

        // If current time is past cutoff, set for next business day
        if (now > dispatchTime) {
          dispatchTime.setDate(dispatchTime.getDate() + 1);
          this.adjustForWeekend(dispatchTime);
        }

        if (this.settings.isSaturday) {
          // Calculate the next Saturday
          const nextSaturday = new Date(now);
          const dayOfWeek = nextSaturday.getDay();
          const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
          nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
          nextSaturday.setHours(this.cutoffFriHours, 0, 0, 0);

          // Calculate ETA for Saturday delivery
          const saturdayETA = new Date(nextSaturday);
          // Saturday delivery arrives on Saturday itself
          // Compare with normal ETA
          const normalETA = this.calculateETA(dispatchTime);

          if (saturdayETA < normalETA) {
            // Saturday delivery is quicker
            this.useSaturdayDelivery = true;
            // Set dispatchTime to be Friday at cutoffFriHours
            const fridayBeforeSaturday = new Date(nextSaturday);
            fridayBeforeSaturday.setDate(nextSaturday.getDate() - 1); // Friday before Saturday
            fridayBeforeSaturday.setHours(this.cutoffFriHours, 0, 0, 0);
            dispatchTime.setTime(fridayBeforeSaturday.getTime());
          }
        }

        // If it's Friday, use earlier cutoff time
        if (dispatchTime.getDay() === 5 && dispatchTime.getHours < this.cutoffFriHours) {
          dispatchTime.setHours(this.cutoffFriHours, 0, 0, 0);
        }

        const diff = dispatchTime - now;

        this.hoursDiff = Math.floor(diff / (1000 * 60 * 60));

        return dispatchTime;
      }

      adjustForWeekend(date) {
        const day = date.getDay();
        if (day === 6) {
          // Saturday
          if (this.settings.isSaturday) {
            return date;
          }
          date.setDate(date.getDate() + 2); // Move to Mondayz
        } else if (day === 0) {
          // Sunday
          date.setDate(date.getDate() + 1); // Move to Monday
        }
        return date;
      }

      calculateETA(dispatchDate) {
        let deliveryDate = new Date(dispatchDate);
        const transitDays = this.settings.transitTime || 2;

        // Add transit days
        deliveryDate.setDate(deliveryDate.getDate() + transitDays);

        // Adjust for weekends if needed
        if (!this.settings.isWeekend) {
          const day = deliveryDate.getDay();
          if (day === 0) {
            // Sunday
            deliveryDate.setDate(deliveryDate.getDate() + 1);
          } else if (day === 6 && !this.settings.isSaturday) {
            // Saturday
            deliveryDate.setDate(deliveryDate.getDate() + 2);
          }
        }

        return deliveryDate;
      }

      formatDate(date) {
        return new Intl.DateTimeFormat("en-GB", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
          .format(date)
          .replace(/(\w+)(\s)/, "$1,$2");
      }

      updateDeliveryInfo() {
        const dispatchDate = this.getNextDispatchTime();
        let etaDate;

        if (this.useSaturdayDelivery) {
          // If using Saturday delivery, find the next Saturday from dispatch
          etaDate = new Date(dispatchDate);
          while (etaDate.getDay() !== 6) {
            etaDate.setDate(etaDate.getDate() + 1);
          }
        } else {
          etaDate = this.calculateETA(dispatchDate);
        }

        if (this.etaEndpoint) {
          const prefix = new Date().getDay() == 5 ? "tomorrow," : "on";
          const deliveryText = this.useSaturdayDelivery ? `${prefix} <span class="date">${this.formatDate(etaDate)}<span>` : `by <span class="date">${this.formatDate(etaDate)}</span>`;
          this.etaEndpoint.innerHTML = deliveryText;
        }

        if (this.serviceEndpoint) {
          const serviceName = this.useSaturdayDelivery ? "UK Saturday Delivery" : this.settings.fastestService;
          this.serviceEndpoint.textContent = serviceName;
        }
      }

      timerInit() {
        const nextDispatch = this.getNextDispatchTime();

        if (this.hoursDiff < 16 && this.hoursDiff > 0) {
          // Create a separate instance for dispatch timers
          const dispatchTimer = CountdownManager.getInstance("dispatch");
          dispatchTimer.configure(nextDispatch, "within");
          dispatchTimer.register(this.endpoint);
        }
      }

      disconnectedCallback() {
        if (this.endpoint) {
          const dispatchTimer = CountdownManager.getInstance("dispatch");
          dispatchTimer.unregister(this.endpoint);
        }
      }
    },
  );
}

// ===================
// PDP thumbs Carousel
// ===================
if (!customElements.get("thumbnail-carousel")) {
  customElements.define(
    "thumbnail-carousel",
    class ThumbnailsCarousel extends HTMLElement {
      constructor() {
        super();
        this.splide = null;
        this._onResize = this._onResize.bind(this);
      }

      connectedCallback() {
        this._maybeInitSplide();
        window.addEventListener("resize", this._onResize);
      }

      disconnectedCallback() {
        this._destroySplide();
        window.removeEventListener("resize", this._onResize);
      }

      _onResize() {
        this._maybeInitSplide();
      }

      _maybeInitSplide() {
        if (window.innerWidth > 1200) {
          if (!this.splide) {
            this._initSplide();
          }
        } else {
          this._destroySplide();
        }
      }

      _calculateHeight = () => {
        let estHeight = document.querySelector("pdp-carousel").getBoundingClientRect().height;
        return estHeight + "px";
      };

      _updateHeight = () => {
        requestAnimationFrame(() => {
          const track = this.querySelector(".splide__track");

          if (track) {
            track.style.height = this._calculateHeight();
          }
        });
      };

      _initSplide = () => {
        if (!this.classList.contains("is-initialized")) {
          SplideUtil.splideHTML(this);
        } else {
          this.classList.add("splide");
        }

        this.splide = new Splide(this, {
          type: "slide",
          direction: "ttb",
          height: this._calculateHeight(),
          fixedHeight: 200,
          fixedWidth: 150,
          lazyLoad: "sequential",
          gap: "10px",
          pagination: false,
          arrows: false,
          wheel: true,
          drag: true,
          isNavigation: true,
          wheelSleep: 300,
        });

        this.splide.mount();

        if (document.querySelector("pdp-carousel")?.splide) {
          // If main carousel is already mounted and we’re adding thumbs later, sync dynamically
          document.querySelector("pdp-carousel").splide.sync(this.splide);
        }
        window.addEventListener("resize", this._updateHeight);
      };

      _destroySplide() {
        if (this.splide) {
          window.removeEventListener("resize", this._updateHeight);
          this.splide.destroy();
          this.splide = null;
          this.classList.remove("splide");
        }
      }
    },
  );
}
