/* global MutationObserver  */

// ===================
// Product Page Recommendations
// ===================

export default class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
    this.carouselInstance = null;
    this.viewportObserver = null;
    this.carouselObserver = null;
  }

  connectedCallback() {
    this.productID = this.dataset.productId;
    this.productStyle = this.dataset.style;
    this._getRecommendations();

    if (!customElements.get("product-carousel")) {
      import("./ProductCarousel.js").then((module) => {
        customElements.define("product-carousel", module.default);
      });
    }
  }

  disconnectedCallback() {
    this._cleanupCarousel();
  }

  _trackCarouselInstance(carousel) {
    this.carouselInstance = carousel?.splide || null;

    if (this.carouselInstance) return;

    if (this.carouselObserver) {
      this.carouselObserver.disconnect();
      this.carouselObserver = null;
    }

    this.carouselObserver = new MutationObserver(() => {
      if (carousel?.splide) {
        this.carouselInstance = carousel.splide;
        this.carouselObserver.disconnect();
        this.carouselObserver = null;
      }
    });

    this.carouselObserver.observe(carousel, { childList: true, subtree: true, attributes: true });
  }

  _cleanupCarousel() {
    if (this.viewportObserver) {
      this.viewportObserver.disconnect();
      this.viewportObserver = null;
    }

    if (this.carouselObserver) {
      this.carouselObserver.disconnect();
      this.carouselObserver = null;
    }

    if (this.carouselInstance && typeof this.carouselInstance.destroy === "function") {
      this.carouselInstance.destroy();
    }

    this.carouselInstance = null;
  }

  _getRecommendations = () => {
    //create the header element and add to the dom
    const heading = document.createElement("h2");
    heading.classList.add("h1");
    heading.textContent = "You might also like";
    this.parentNode.insertBefore(heading, this);
    const loader = document.createElement("div");
    loader.classList.add("loader");
    this.appendChild(loader);

    (async () => {
      try {
        const response = await fetch(
          `${window.Shopify.routes.root}recommendations/products?sections=product-dynamic-cards&product_id=${this.productID}&limit=12&intent=related`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const html = data["product-dynamic-cards"];

        if (html && html.length > 0) {
          // if there is some data then ->
          const carousel = document.createElement("productcard-carousel"); // find the carousel
          this._trackCarouselInstance(carousel);
          this.innerHTML = "";
          this.appendChild(carousel);

          const addElements = (target) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = html;
            target.innerHTML = wrapper.querySelector("#shopify-section-product-dynamic-cards").innerHTML;
            const carouselEl = this.querySelector("productcard-carousel");
            if (carouselEl?.splide) {
              this.carouselInstance = carouselEl.splide;
              this.carouselInstance.refresh();
            }
          };

          let listEl = this.querySelector(".splide__list");
          if (listEl) {
            addElements(listEl);
          } else {
            const observer = new MutationObserver((mutations, obs) => {
              const foundList = this.querySelector(".splide__list");
              if (foundList) {
                addElements(foundList);
                obs.disconnect();
              }
            });

            observer.observe(this, { childList: true, subtree: true });
          }
        }
      } catch (error) {
        console.error("Failed to fetch product recommendations:", error);
      }
    })();
  };
}
