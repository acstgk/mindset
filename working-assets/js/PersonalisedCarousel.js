/* global  */

import RecentlyViewed from "./RecentlyViewed.js";

// ===================
// Personalised Product Recommendations
// ===================

export default class PersonalRecommendations extends HTMLElement {
  constructor() {
    super();
    this.initialized = false;
    this.observer = null;
    this.preferredGender = localStorage.getItem("GK::gender--content") || "womens";
    this.otherGender = this.preferredGender === "womens" ? "mens" : "womens";
  }

  connectedCallback() {
    this.vRecents = new RecentlyViewed();
    this.recentlyViewed = this.vRecents.getProductList();
    this.init();
    // this._fallback(this.preferredGender);
    // this._fallback(this.otherGender);
  }

  async init() {
    try {
      await this._initRecommendations(this.preferredGender);
      await this._initRecommendations(this.otherGender);
    } catch (error) {
      console.error("personal recs :: failed:", error);
      this._fallback(this.preferredGender);
      this._fallback(this.otherGender);
    }
  }

  _initRecommendations = async (gender) => {
    let product = null;
    const carousel = this.querySelector(`#${gender}-recommendations`);
    if (
      this.recentlyViewed &&
      gender &&
      Object.prototype.hasOwnProperty.call(this.recentlyViewed, gender) &&
      Array.isArray(this.recentlyViewed[gender]) &&
      this.recentlyViewed[gender].length > 0
    ) {

      // Use the first item (most recent) for recommendations
      product = this.recentlyViewed[gender][0];
    }

    if (product) {
      const productID = product.productId;
      try {
        const response = await fetch(
          `${window.Shopify.routes.root}recommendations/products?sections=product-dynamic-cards&product_id=${productID}&limit=10&intent=related`
        );

        if (!response.ok) {
          this._fallback(gender);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        window.data = data
        const parser = new DOMParser();
        const doc = parser.parseFromString(data['product-dynamic-cards'], "text/html");
        const html = doc.querySelectorAll('.splide__slide');

        carousel.splide.remove('.loader-skeleton');
        html.forEach(slide => {
          carousel.splide.add(slide);
        });


      } catch (error) {
        console.error("personal recs :: failed:", error);
        this._fallback(gender);
      }
    } else {
      this._fallback(gender);
    }

  }




  _fallback = (gender) => {
    const content = this.querySelector(`noscript[data-gender="${gender}"]`);
    const carousel = this.querySelector(`#${gender}-recommendations`);
    if (!content || !carousel) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(content.innerHTML, "text/html");

    carousel.splide.remove('.loader-skeleton');

    doc.querySelectorAll('.splide__slide').forEach(slide => {
      carousel.splide.add(slide);
    });
  };

}
