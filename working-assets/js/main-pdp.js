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
        this.splide = null;
      }

      connectedCallback() {
        SplideUtil.splideHTML(this);
        this.splide = new Splide(this, {
          type: "loop",
          pagination: true,
          arrows: false,
          preloadPages: 1,
          perPage: 1,
          lazyLoad: "nearby"
        });

        this.splide.mount();
      }
    }

  );
}