/* global MutationObserver */

// ===================
// Product Page Recommendations
// ===================

export default class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    this.productID = this.dataset.productId;
    this.productStyle = this.dataset.style;
    this._getRecommendations();
  }

  _getRecommendations = () => {
    fetch(window.Shopify.routes.root + `recommendations/products?sections=product-dynamic-cards&product_id=${this.productID}&limit=12&intent=related`)
      .then((response) => response.json()) // Use .json()
      .then((data) => {
        const html = data["product-dynamic-cards"];

        if (html && html.length > 0) {
          const heading = document.createElement("h2");
          heading.classList.add("h1");
          heading.textContent = "You might also like";
          this.parentNode.insertBefore(heading, this);

          const carousel = this.querySelector("productcard-carousel");
          this.innerHTML = "";
          this.appendChild(carousel);

          const addElements = (target) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = html;
            target.innerHTML = wrapper.querySelector("#shopify-section-product-dynamic-cards").innerHTML;
            this.querySelector("productcard-carousel").splide.refresh();
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
      });
  };
}
