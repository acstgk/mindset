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
    try {
      this.preferredGender = localStorage.getItem("GK::gender--content") || "womens";
    } catch {
      this.preferredGender = "womens";
    }
    this.otherGender = this.preferredGender === "womens" ? "mens" : "womens";
  }

  connectedCallback() {
    try {
      this.vRecents = new RecentlyViewed();
      this.recentlyViewed = this.vRecents.getProductList();
    } catch {
      this.recentlyViewed = null;
    }
    this.init();
    // this._fallback(this.preferredGender);
    // this._fallback(this.otherGender);
  }

  async init() {
    await Promise.allSettled([this._initRecommendations(this.preferredGender || "womens"), this._initRecommendations(this.otherGender || "mens")]);
  }

  _initRecommendations = async (gender) => {
    let product = null;
    const carousel = this.querySelector(`#${gender}-recommendations`);
    if (!carousel) return;
    if (this.recentlyViewed && gender && Object.prototype.hasOwnProperty.call(this.recentlyViewed, gender) && Array.isArray(this.recentlyViewed[gender]) && this.recentlyViewed[gender].length > 0) {
      // Use the first item (most recent) for recommendations
      product = this.recentlyViewed[gender][0];
    }

    if (product) {
      const productID = product.productId;
      try {
        const root = window.Shopify?.routes?.root ?? "/";
        const response = await fetch(`${root}recommendations/products?sections=product-dynamic-cards&product_id=${productID}&limit=10&intent=related`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data["product-dynamic-cards"], "text/html");

        if (carousel.splide != null) {
          carousel.splide.remove(".loader-skeleton");
          const splideList = carousel.splide.root.querySelector(".splide__list");
          if (!splideList) {
            this._fallback(gender);
            return;
          }
          splideList.insertAdjacentHTML(
            "beforeend",
            doc
              .querySelector("#shopify-section-product-dynamic-cards")
              .innerHTML.replace(/>[\s]+</g, "><")
              .trim(),
          );
          carousel.splide.refresh();

          // html.forEach(slide => {
          //   carousel.splide.add(slide);
          // });
        } else {
          carousel.innerHTML = doc.querySelector("body").innerHTML;
        }
      } catch (error) {
        console.error("personal recs :: failed:", error);
        this._fallback(gender);
      }
    } else {
      this._fallback(gender);
    }
  };

  _fallback = (gender) => {
    const content = document.querySelector(`noscript[data-gender="${gender}"]`);
    const carousel = this.querySelector(`#${gender}-recommendations`);
    if (!content || !carousel) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(content.textContent, "text/html");

    if (carousel.splide != null) {
      carousel.splide.remove(".loader-skeleton");

      const splideList = carousel.splide.root.querySelector(".splide__list");
      if (!splideList) return;
      splideList.insertAdjacentHTML("beforeend", doc.body.innerHTML.replace(/>[\s]+</g, "><").trim());
      carousel.splide.refresh();

      // doc.querySelectorAll('.splide__slide').forEach(slide => {
      //   carousel.splide.add(slide);
      // });
    } else {
      carousel.innerHTML = doc.querySelector("body").innerHTML;
    }
  };
}
