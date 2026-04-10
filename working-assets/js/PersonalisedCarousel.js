import RecentlyViewed from "./RecentlyViewed.js";

// ===================
// Personalised Product Recommendations
// ===================

export default class PersonalRecommendations extends HTMLElement {
  constructor() {
    super();
    this.initialized = false;
    this.observer = null;
  }

  connectedCallback() {
    this.noscript = this.querySelector("noscript");
    if (this.noscript) {
      this.fallbackHtml = this.noscript.textContent || this.noscript.innerText;
      this.noscript.remove();
    }
    
    this.gender = this.dataset.gender;
    this.loader = this.closest(".gender-wrapper")?.querySelector(".gender-loader");

    // Only proceed if active, otherwise wait for activation
    if (this.classList.contains("active")) {
      this._initCarousel();
    } else {
      this._setupActivationObserver();
    }
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();
  }

  /**
   * Watches for the 'active' class to be added by the GenderSelector
   */
  _setupActivationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          this.classList.contains("active") &&
          !this.initialized
        ) {
          this._initCarousel();
          this.observer.disconnect();
        }
      });
    });

    this.observer.observe(this, { attributes: true });
  }

  _initCarousel = async () => {
    if (this.initialized) return;
    this.initialized = true;

    const vRecents = new RecentlyViewed();
    const recentlyViewed = vRecents.getProductList();

    // Guard against missing gender bucket or empty arrays
    let product = null;
    if (
      recentlyViewed &&
      this.gender &&
      Object.prototype.hasOwnProperty.call(recentlyViewed, this.gender) &&
      Array.isArray(recentlyViewed[this.gender]) &&
      recentlyViewed[this.gender].length > 0
    ) {
      // Use the first item (most recent) for recommendations
      product = recentlyViewed[this.gender][0];
    }

    if (product) {
      const productID = product.productId;

      try {
        const response = await fetch(
          `${window.Shopify.routes.root}recommendations/products?sections=product-dynamic-cards&product_id=${productID}&limit=12&intent=related`
        );

        if (!response.ok) {
          this._fallback();
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const carousel = document.createElement("productcard-carousel");
        carousel.classList.add("gender-recommendations-carousel", "product-grid");
        
        const wrapper = document.createElement("div");
        wrapper.innerHTML = data["product-dynamic-cards"];
        const section = wrapper.querySelector("#shopify-section-product-dynamic-cards");
        
        if (section) {
          while (section.firstChild) {
            carousel.appendChild(section.firstChild);
          }
        }
        
        this.appendChild(carousel);
      } catch (error) {
        console.error("personal recs :: failed:", error);
        this._fallback();
      } finally {
        this._removeLoader();
      }
    } else {
      this._fallback();
      this._removeLoader();
    }
  };

  _fallback = () => {
    if (!this.fallbackHtml) return;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = this.fallbackHtml;
    // Append the actual carousel content from noscript
    if (tempDiv.childNodes.length > 0) {
      this.appendChild(tempDiv.querySelector('productcard-carousel') || tempDiv.childNodes[1]);
    }
  };

  _removeLoader = () => {
    if (this.loader && this.loader.parentNode) {
      this.loader.remove();
    }
  };
}
