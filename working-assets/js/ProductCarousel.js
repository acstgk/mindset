import Splide from "./splide.min.js";
import { SplideUtil } from "./SplideUtil.js";

// ===================
// PRODUCT CAROUSEL
// ===================

export default class ProductCarousel extends HTMLElement {
  constructor() {
    super();
    this.splide = null;
  }

  connectedCallback() {
    SplideUtil.splideHTML(this);
    this.splide = new Splide(this, {
      type: "loop",
      start: 1,
      gap: 12,
      pagination: false,
      trimSpace: false,
      focus: "center",
      width: "min(90vw, 1270px)",
      fixedWidth: "25%",
      breakpoints: {
        1270: {
          fixedWidth: "25%",
        },
        1100: {
          fixedWidth: "calc(33% - 12px)",
        },
        800: {
          fixedWidth: "50%",
        },
        500: {
          fixedWidth: "75%",
        },
        400: {
          fixedWidth: "100%",
        },
      },
    });

    this.splide.on("overflow", (isOverflow) => {
      this.splide.options = {
        ...this.splide.options,
        arrows: isOverflow,
        drag: isOverflow,
      };
    });

    this.splide.mount();
  }
}

