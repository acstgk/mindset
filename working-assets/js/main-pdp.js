import Splide from "./splide.min.js";
import { SplideUtil } from "./SplideUtil.js";

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
          (window.innerHeight * 0.95) -
          30 - // replace this for AtB button element when created
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
        this.zoomEl = document.createElement("div");
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
        const targetImg = this.querySelector(".is-active > img");
        const imgUrl = targetImg.src;
        this.zoomEl.className = "pdp-zoom-wrapper";
        let zoomImg = document.createElement("img");
        zoomImg.className = "pdp-zoom-img";
        zoomImg.src = imgUrl;

        let zoomClose = document.createElement("button");
        zoomClose.className = "pdp-zoom-close-btn round-btn";
        zoomClose.innerHTML = `  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="Icon Icon--plus rotate45"
                                  >
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" />
                                  </svg>`;
        zoomClose.addEventListener("click", () => this._unzoom());

        this.zoomEl.appendChild(zoomImg);
        this.zoomEl.appendChild(zoomClose);
        document.body.appendChild(this.zoomEl);
        //animate the element into view
        requestAnimationFrame(() => {
          this.zoomEl.classList.add("visible");
        });
      };

      _unzoom = () => {
        if (!this.zoomEl) return;
        this.zoomEl.classList.remove("visible");

        // Wait for the transition to complete before removing
        this.zoomEl.addEventListener(
          "transitionend",
          () => {
            this.zoomEl.remove();
          },
          { once: true },
        );
      };
    },
  );
}
