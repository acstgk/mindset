import RecentlyViewed from "./RecentlyViewed.js";

// ===================
// Personalised Product Recommendations
// ===================

export default class PersonalRecommendations extends HTMLElement {
  connectedCallback() {
    this.noscript = this.querySelector("noscript");
    this.fallbackHtml = this.noscript.textContent || this.noscript.innerText;
    this.gender = this.dataset.gender;
    this._initCarousel();
  }

  _initCarousel = async () => {
    const recentlyViewed = new RecentlyViewed();
    let product = recentlyViewed.getProductList()[this.gender][0];

    if (product) {
      const productID = product.productId;

      try {
        const response = await fetch(
          `${window.Shopify.routes.root}recommendations/products?sections=product-dynamic-cards&product_id=${productID}&limit=12&intent=related`
        );

        if (!response.ok) {
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
      }
    } else {
      this._fallback();
    }
  };

  _fallback = () => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = this.fallbackHtml;
    this.insertBefore(tempDiv.childNodes[1], this.noscript);
    this.removeChild(this.noscript);
  };
}
