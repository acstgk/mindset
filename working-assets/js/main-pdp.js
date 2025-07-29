/* global IntersectionObserver */

import Splide from "./splide.min.js";
import { SplideUtil } from "./SplideUtil.js";
import Panzoom from "./panzoom.js";

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
          document.querySelector(".atc_form-button").getBoundingClientRect().height - // replace this for AtB button element when created
          document.getElementById("shopify-section-header-main").getBoundingClientRect().height -
          document.getElementById("shopify-section-header-announcement").getBoundingClientRect().height -
          document.getElementById("product-summary").getBoundingClientRect().height;
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
        this._splideInit();
        this.appendChild(this.zoomBtn);
      }

      _splideInit = () => {
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
        this.atcButton.innerText = "Select Size";

        this._currentSubmitHandler = this._scrollToSizes;
        this._submitDispatcher = (event) => {
          event.preventDefault();
          this._currentSubmitHandler(event);
        };
        this.actualForm.addEventListener("submit", this._submitDispatcher);
        this.actualForm.addEventListener("change", this._watchSizeSelection);
        this._handleStickyButton();
        this._setObserver();
      }

      _scrollToSizes = (event) => {
        event.preventDefault();
        document.getElementById("product-details").scrollIntoView({ behavior: "smooth", block: "start" });
      };

      _watchSizeSelection = (event) => {
        if (event.target.type === "radio" && event.target.name.startsWith("id")) {
          const allGroups = this.querySelectorAll(".atc_form-sizes");
          const allSelected = Array.from(allGroups).every((group) => {
            return group.querySelector('input[type="radio"]:checked');
          });

          if (allSelected) {
            this.atcButton.innerText = "Add to Bag";
            this._currentSubmitHandler = this._addToCart;
          }
        }
      };

      _addToCart = (event) => {
        console.log(event);
      };

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
