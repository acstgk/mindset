/* global IntersectionObserver Cart MutationObserver URL history URLSearchParams */
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
          (document.querySelector(".atc_form-button")?.getBoundingClientRect().height || 0) - // atb button
          (document.getElementById("shopify-section-header-main")?.getBoundingClientRect().height || 0) - // header
          (document.getElementById("shopify-section-header-announcement")?.getBoundingClientRect().height || 0) - //annoucement bar
          (document.getElementById("product-summary")?.getBoundingClientRect().height || 0); // product summary information
        this.splide = null;
        this.zoomBtn = document.createElement("button");
        this.zoomBtn.className = "pdp-zoom-btn round-btn";
        this.zoomBtn.ariaLabel = "Open Zoom Modal";
        this.zoomBtn.innerHTML = `  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class=""><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M7 10l6 0" /><path d="M10 7l0 6" /><path d="M21 21l-6 -6" /></svg>`;
        this.zoomBtn.addEventListener("click", () => this._zoom());
        this.zoomEl = document.querySelector(".pdp-zoom-wrapper");
        window.innerWidth < 769 ? (this.style.maxHeight = `${this.availableHeight}px`) : "";
      }

      connectedCallback() {
        this._splideMainInit();
        this._addEventListeners();
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
        this.splide = new window.Splide(this, {
          type: "loop",
          pagination: true,
          arrows: false,
          preloadPages: 3,
          perPage: 1,
          lazyLoad: "nearby",
          drag: true,
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

        this.splide.on("mounted", () => {
          // Remove all spinners after Splide creates them
          this.querySelectorAll(".splide__spinner").forEach((spinner) => spinner.remove());
        });

        this.splide.mount();
      };

      _addEventListeners = () => {
        const zoomClose = document.querySelector(".pdp-zoom-close-btn");
        const zoomNext = document.querySelector(".pdp-zoom-next-btn");
        const zoomPrev = document.querySelector(".pdp-zoom-prev-btn");
        zoomClose.addEventListener("click", this._unzoom);
        zoomNext.addEventListener("click", () => this._next("next"));
        zoomPrev.addEventListener("click", () => this._next("prev"));
      };

      // ====================================
      // writing the code that controls the transition between images in zoom carousel.- need to remember that pdp carousel needs to change too!
      // ====================================
      _next = (direction) => {
        // declare the image containers
        const outgoingImage = this.zoomEl.querySelector(`.${direction === "next" ? "prev" : "next"}`);
        const currentImage = this.zoomEl.querySelector(".active");
        const incomingImage = this.zoomEl.querySelector(`.${direction}`);
        if (!incomingImage) return; // if no next image exists, do nothing.

        // rearrange the image positions
        outgoingImage.classList = "pdp-zoom-panzoom " + (direction === "next" ? "next" : "prev");
        currentImage.classList = "pdp-zoom-panzoom " + (direction === "next" ? "prev" : "next");
        incomingImage.classList = "pdp-zoom-panzoom active";

        // update the index number on the previous image container to allow it to become the next image in series
        const newIndex = parseInt(incomingImage.dataset.index) + (direction === "next" ? 1 : -1);
        outgoingImage.dataset.index = newIndex;
        // remove the old image reeady for the new one to be added
        const oldImg = outgoingImage.querySelector("img");
        if (oldImg) outgoingImage.removeChild(oldImg);

        // find the incoming image url
        const newImg = this.querySelector(`[data-image-index="${newIndex}"]`);

        if (newImg) {
          const imgSrc = newImg.src || newImg.dataset.splideLazy;
          const zoomImg = document.createElement("img");
          zoomImg.className = "pdp-zoom-img";
          zoomImg.src = imgSrc;
          outgoingImage.prepend(zoomImg);

          zoomImg.addEventListener("load", () => {
            const imageHeight = zoomImg.naturalHeight;
            const containerHeight = outgoingImage.clientHeight;
            const scale = containerHeight / imageHeight;
            zoomImg.dataset.scale = scale;

            const panzoom = Panzoom(zoomImg, {
              canvas: true,
              maxScale: 2,
              minScale: 0.25,
              startScale: scale,
            });
            outgoingImage.addEventListener("wheel", panzoom.zoomWithWheel);
          });
        }
      };

      // add the product images to the three zoom containers
      _addScrollImages = (img, direction, index) => {
        const panzoomEl = document.createElement("div");
        panzoomEl.classList.add("pdp-zoom-panzoom", direction);
        panzoomEl.dataset.index = index ? index : 0;

        if (img) {
          const imgSrc = img.src;
          const zoomImg = document.createElement("img");
          zoomImg.className = "pdp-zoom-img";
          zoomImg.src = imgSrc;
          panzoomEl.prepend(zoomImg);

          zoomImg.addEventListener("load", () => {
            const imageHeight = zoomImg.naturalHeight;
            const containerHeight = panzoomEl.clientHeight;
            const scale = containerHeight / imageHeight;
            zoomImg.dataset.scale = scale;

            const panzoom = Panzoom(zoomImg, {
              canvas: true,
              maxScale: 2,
              minScale: 0.25,
              startScale: scale,
              focal: { x: 50, y: 50 },
            });
            panzoomEl.addEventListener("wheel", panzoom.zoomWithWheel);
          });
        }
        this.zoomEl.prepend(panzoomEl);
      };

      // create and display the panzoom zoom overlay element
      _zoom = () => {
        // prevent scrolling
        document.body.style.overflowY = "hidden";

        // find the target image element
        const targetImg = this.querySelector(".is-active > img");
        if (!targetImg) return;

        // if there is a target image element then grab the image url and current index
        const index = parseInt(targetImg.dataset.imageIndex);

        // use the index to grab the images before and after
        let prevImage = this.querySelector(`[data-image-index="${index - 1}"]`);
        let nextImage = this.querySelector(`[data-image-index="${index + 1}"]`);

        // create and add the images to dom
        this._addScrollImages(targetImg, "active", index);
        this._addScrollImages(nextImage, "next", index + 1);
        this._addScrollImages(prevImage, "prev", index - 1);

        // add event listeners to controls:
        const zoomClose = document.querySelector(".pdp-zoom-close-btn");
        zoomClose.addEventListener("click", this._unzoom);

        // Animate into view
        requestAnimationFrame(() => {
          this.zoomEl.classList.add("visible");
        });
      };

      // destroy the panzoom element when close button is clicked
      _unzoom = () => {
        document.body.style.overflowY = "auto";
        this.zoomEl.classList.remove("visible");

        this.zoomEl.querySelectorAll(".pdp-zoom-panzoom").forEach((img) => {
          img.remove();
        });
      };
    },

    //   // create and display the panzoom zoom overlay element
    //   _zoom = () => {
    //     document.body.style.overflowY = "hidden";

    //     const targetImg = this.querySelector(".is-active > img");
    //     if (!targetImg) return;

    //     const imgUrl = targetImg.src;
    //     const index = targetImg.dataset.index;
    //     index;

    //     const zoomEl = document.createElement("div");
    //     zoomEl.className = "pdp-zoom-wrapper";

    //     const zoomImg = document.createElement("img");
    //     zoomImg.className = "pdp-zoom-img";
    //     zoomImg.src = imgUrl;

    //     const zoomClose = document.createElement("button");
    //     zoomClose.className = "pdp-zoom-close-btn round-btn";
    //     zoomClose.innerHTML = `
    //       <svg
    //         xmlns="http://www.w3.org/2000/svg"
    //         viewBox="0 0 24 24"
    //         fill="none"
    //         stroke="currentColor"
    //         stroke-width="2"
    //         stroke-linecap="round"
    //         stroke-linejoin="round"
    //         class="Icon Icon--plus rotate45"
    //       >
    //         <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    //         <path d="M12 5l0 14" />
    //         <path d="M5 12l14 0" />
    //       </svg>`;
    //     zoomClose.addEventListener("click", this._unzoom);

    //     const zoomReset = document.createElement("button");
    //     zoomReset.className = "pdp-zoom-reset-btn round-btn";
    //     zoomReset.innerHTML = `
    //        <svg
    //           xmlns="http://www.w3.org/2000/svg"
    //           viewBox="0 0 24 24"
    //           fill="none"
    //           stroke="currentColor"
    //           stroke-width="2"
    //           stroke-linecap="round"
    //           stroke-linejoin="round"
    //           class="{{ icon_class }}"
    //         >
    //           <path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 14l-4 -4l4 -4" /><path d="M5 10h11a4 4 0 1 1 0 8h-1" />
    //         </svg>
    //         `;

    //     const zoomRange = document.createElement("input");
    //     zoomRange.type = "range";
    //     zoomRange.min = "0.5";
    //     zoomRange.max = "2";
    //     zoomRange.step = "0.1";
    //     zoomRange.value = "1"; // default zoom level
    //     zoomRange.setAttribute("orient", "vertical");
    //     zoomRange.className = "pdp-zoom-range";

    //     // Append elements
    //     zoomEl.appendChild(zoomImg);
    //     zoomEl.appendChild(zoomClose);
    //     zoomEl.appendChild(zoomReset);
    //     zoomEl.appendChild(zoomRange);
    //     document.body.appendChild(zoomEl);

    //     //calculate the initial pan position

    //     // Initialize Panzoom
    //     setTimeout(() => {
    //       const panzoom = Panzoom(zoomImg, {
    //         canvas: true,
    //         excludeClass: "pdp-zoom-range",
    //         maxScale: 2,
    //         minScale: 0.5,
    //         startScale: 0.7,
    //       });

    //       zoomReset.addEventListener("click", () => {
    //         panzoom.reset({ startScale: 0.7 });
    //         zoomRange.value = 0.7;
    //       });

    //       zoomEl.addEventListener("wheel", panzoom.zoomWithWheel);
    //       zoomRange.addEventListener("input", (event) => {
    //         panzoom.zoom(event.target.valueAsNumber);
    //       });
    //       zoomImg.addEventListener("panzoomzoom", (e) => {
    //         zoomRange.value = e.detail.scale.toFixed(1);
    //       });
    //     }, 300);

    //     // Animate into view
    //     requestAnimationFrame(() => {
    //       zoomEl.classList.add("visible");
    //     });
    //   };

    //   // destroy the panzoom element when close button is clicked
    //   _unzoom = () => {
    //     const zoomEl = document.querySelector(".pdp-zoom-wrapper");
    //     if (!zoomEl) return;
    //     document.body.style.overflowY = "auto";
    //     zoomEl.classList.remove("visible");

    //     setTimeout(() => {
    //       zoomEl.remove();
    //     }, 500);
    //   };
    // },
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
        if (!this.atcButton) return;
        this.totalRadio = this.querySelectorAll('input[type="radio"]').length;
        this.allGroups = this.querySelectorAll(".atc_form-sizes");
        this.quantityWarningEl = this.querySelector(".quantity-warning");
        this.allGroups.length > 1 ? (this.atcButton.innerText = "Select Sizes") : (this.atcButton.innerText = "Select Size");
        this._currentSubmitHandler = this._scrollToSizes;
        this.actualForm.addEventListener("submit", this._submitDispatcher);
        this.actualForm.addEventListener("change", this._watchSizeSelection);
        this.storedSizesItem = "GK::sizes";
        this._autoSelectOption();
        this._handleStickyButton();
        this._setObserver();
        this._watchSizeSelection();
      }

      _autoSelectOption = () => {
        this.allGroups.forEach((optionGroup) => {
          if (optionGroup.childElementCount > 1) {
            if (window.location.search.includes("variant")) {
              const variantId = new URLSearchParams(window.location.search).get('variant');
              console.log("variant found :: ", variantId);
              const target = optionGroup.querySelector(`#variant-${variantId}`);
              if (target) target.checked = true;
            } else {
              this._getStorage();
            }
          } else {
            optionGroup.children[0].querySelector("input").checked = true;
          }
        });

      };

      // save any selected size to this product type for auto selection going forwards.
      _setStorage = (gender, key, value) => {
        if (gender == "Accessories") return;
        let storedSizes = JSON.parse(localStorage.getItem(this.storedSizesItem)) || {
          Mens: {},
          Womens: {},
          Boys: {},
          Girls: {},
        };
        key = key.replace(/\s+/g, "-").toLowerCase();
        storedSizes[gender][key] = value;
        localStorage.setItem(this.storedSizesItem, JSON.stringify(storedSizes));
      };

      _getStorage = () => {
        if (localStorage.getItem(this.storedSizesItem)) {
          const gender = window.myCurrentProduct.vendor;
          if (gender == "Accessories") return;
          let type = window.myCurrentProduct.type.replace(/\s+/g, "-").toLowerCase();

          const storedSizes = JSON.parse(localStorage.getItem(this.storedSizesItem));
          const size = storedSizes[gender][type];

          if (size) {
            const target = document.querySelector(`[data-id="${type}-${size}"]`);
            if (target) {
              target.checked = true;
            }
          }
        } else {
          return;
        }
      };

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

      // watch the size selection block/s call to update the local storage and update the submission function if all blocks/products have a size selected.
      _watchSizeSelection = () => {
        const selectedSizes = Array.from(this.allGroups).map((group) => {
          const checked = group.querySelector('input[type="radio"]:checked');
          const size = checked?.dataset?.size;
          if (size) {
            this._setStorage(window.myCurrentProduct.vendor, window.myCurrentProduct.type, size);
          }
          return checked ? checked.dataset.size || checked.getAttribute("data-size") || checked.value : null;
        });

        const allSelected = selectedSizes.every(Boolean);
        const selectedSizesStr = selectedSizes.filter(Boolean).join(", ");

        if (allSelected) {
          const sizeCopy = this.totalRadio > 1 ? `<span>${selectedSizesStr}</span>` : "";
          this.atcButton.innerHTML = `<b>Add to Bag</b> ${sizeCopy}`;
          this._currentSubmitHandler = this._addToCart;
        }


        // if this isn't a group (tracksuit) product page than update urgency flag, variant url and price.
        if (this.allGroups.length == 1) {
          //chech the availability and update the urgency flag, displaying if required.
          const availableQty = this.querySelector('input[type="radio"]:checked')?.dataset.availableQty;
          if (availableQty < 10 && availableQty > 0) {
            let warningLevel;
            availableQty == 1 ? (this.quantityWarningEl.textContent = `Hurry! this is the last one.`) : (this.quantityWarningEl.textContent = `Popular - only ${availableQty} left!`);
            availableQty == 1 ? (warningLevel = "error") : (warningLevel = "warning");
            this.quantityWarningEl.classList.remove("warning", "error");
            this.quantityWarningEl.classList.add("warning-active", warningLevel);
          } else {
            this.quantityWarningEl.classList.remove("warning-active", "warning", "error");
          }

          // update the current url to include the variant for this selected size allowing better history traversal.
          const url = new URL(window.location.href);
          const variantId = this.allGroups[0].querySelector('input[type="radio"]:checked').value;
          url.searchParams.set('variant', variantId);
          history.replaceState({}, '', url);

          //now we have an updated url we can update the price.
          const fetchURL = window.location.href + '&section_id=product-price';
          fetch(fetchURL)
            .then((response) => response.text())
            .then((html) => {
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              const livePrice = document.querySelector('#product-summary .Price--wrapper');
              const incomingPrice = doc.querySelector('.Price--wrapper');
              if (livePrice && incomingPrice) livePrice.innerHTML = incomingPrice.innerHTML;
            });

        }
      };

      // the add to cart submission method for when all products have selected sizes
      _addToCart = () => {
        const atcButtonContent = this.atcButton.innerHTML;
        this.atcButton.innerHTML = `<div class="loader" style="--height:1em;z-index:1;backdrop-filter: invert(1)"></div>`;
        const selectedRadios = this.querySelectorAll('.atc_form-sizes input[type="radio"]:checked');
        const items = Array.from(selectedRadios).map((radio) => ({
          id: radio.value,
          quantity: 1,
          selling_plan: radio.dataset.subscriptionId || "",
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

        // if saturday delivery is available check if it is before 1.30pm on friday

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
        if (this.useSaturdayDelivery && dispatchTime.getDay() === 5 && dispatchTime.getHours < this.cutoffFriHours) {
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

        this.splide = new window.Splide(this, {
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

// ===================
// Complete The Look functionality
// ===================
class CompleteTheLook {
  static init() {
    if (!document.getElementById("completethelook--mobile")) return;

    const forms = document.querySelectorAll(".ctl-atc-form");
    if (forms.length === 0) return;

    forms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        const variantId = form.querySelector('select[name="id"]').value;

        if (!variantId) {
          return;
        }

        submitBtn.innerHTML = '<div class="loader" style="--height:1em;z-index:1;backdrop-filter: invert(1)"></div>';
        submitBtn.setAttribute("disabled", "disabled");

        Cart.addItems([{ id: variantId, quantity: 1 }])
          .then(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.removeAttribute("disabled");
          })
          .catch((err) => {
            submitBtn.innerHTML = originalText;
            submitBtn.removeAttribute("disabled");
            console.error("ATC Error:", err);
          });
      });
    });
  }
}
CompleteTheLook.init();

// ===================
// Scroll to reviews on click
// ===================
class ReviewsScroller {
  static descClicked = false;

  static init() {
    const observer = new MutationObserver((mutations, obs) => {
      const reviewLink = document.querySelector(".yotpo-sr-bottom-line-right-panel");
      const productDesc = document.querySelector(".button_productdetails");

      if (reviewLink) {
        ReviewsScroller.addReviewScrollListener();
      }

      if (productDesc && !ReviewsScroller.descClicked) {
        ReviewsScroller.descClicked = true;
        productDesc.click();
      }

      if (productDesc && reviewLink) {
        obs.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  static addReviewScrollListener() {
    const reviewLink = document.querySelector(".yotpo-sr-bottom-line-right-panel");

    // Guard against binding multiple times if the observer fires often
    if (reviewLink && !reviewLink.dataset.rsBound) {
      reviewLink.addEventListener(
        "click",
        function () {
          const reviewsSection = document.querySelector(".yotpo-reviews-main-widget");
          if (reviewsSection) {
            reviewsSection.style.scrollMarginTop = "30px";
            reviewsSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        },
        { passive: true },
      );
      reviewLink.dataset.rsBound = "true";
    }
  }
}
ReviewsScroller.init();
