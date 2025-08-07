import Splide from "./splide.min.js";
import { SplideUtil } from "./SplideUtil.js";

// ===================
// Product Type Carousel
// ===================
if (!customElements.get("product-types")) {
  customElements.define(
    "product-types",
    class TypesCarousel extends HTMLElement {
      connectedCallback() {
        SplideUtil.splideHTML(this);
        this.splide = new Splide(this, {
          rewind: true,
          gap: 24,
          start: 1,
          pagination: false,
          autoWidth: true,
          focus: "center",
        });

        this.splide.on("overflow", (isOverflow) => {
          !isOverflow ? this.splide.destroy() : "";
          this.classList.toggle("no-carousel", !isOverflow);
        });

        this.splide.mount();
      }
    },
  );
}
