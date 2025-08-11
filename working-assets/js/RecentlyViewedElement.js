/* global Shopify */
import RecentlyViewed from "./RecentlyViewed.js";
import { Cart } from "./main.js";

// ===================
// Recently Viewed List
// ===================

export default class RecentlyViewedElement extends HTMLElement {
  constructor() {
    super();
    const recentlyViewed = new RecentlyViewed();
    this.allData = recentlyViewed.getProductList();
    this.flattenedData = this._flattenAndSort(this.allData);
    this.list = document.createElement("ul");
    this.list.classList.add("cart_items-list");
    this.rcButton = document.getElementById("side_menu-recents");
    this.cartButton = document.getElementById("side_menu-cart");
    this.cartContent = document.getElementById("side-cart");
  }

  connectedCallback() {
    this.hasRendered = false;
    this.innerHTML = `<div class="loader"></div>`;
    this.loader = this.querySelector(".loader");
    this.insertBefore(this.list, this.loader);
    this._handleClicks();
  }

  /* Flattens the localStorage `data` object containing product arrays (grouped by gender) */
  _flattenAndSort(data) {
    if (!data || typeof data !== "object") return [];

    const out = [];
    for (const [gender, items] of Object.entries(data)) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (item && typeof item === "object") {
          out.push({ ...item, gender });
        }
      }
    }

    // Sort by timestamp descending (newest first); missing timestamps treated as 0
    return out.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  async _renderProducts() {
    for (let i = 0; i < Math.min(5, this.flattenedData.length); i++) {
      const item = this.flattenedData[i];
      const productDataUrl = `https://${Shopify.shop}${item.productUrl}.js`;

      try {
        const response = await fetch(productDataUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const productData = await response.json();

        // define the data points we will need to create the cards:
        const title = productData.title.replace("Gym King ", "");
        const price = Cart.formatMoney(productData.price);
        const compareAt = productData.compare_at_price > productData.price ? Cart.formatMoney(productData.compare_at_price) : "";
        const image = productData.images[0];
        const url = productData.url;

        const splitTitle = title.split(/[-–—]/)[0].trim();
        const splitColor = title.split(/[-–—]/)[1].trim();

        const li = document.createElement("li");
        li.className = "cart_items-item";
        li.innerHTML = `
                <line-item>
                  <div class="cart_item-image"><img src="${image}" alt="${title}"></div>
                  <div class="cart_item-header">
                    <div class="cart_item-info">
                      <h3><a class="Title" href="${url}"><span class="title">${splitTitle}</span><span class="color">${splitColor}</span></a></h3>
                      <div class="Price--wrapper"><span class="Price">${price}</span></div>
                    </div>
                    </div>
                    <div class="cart_item-quantity"><a href="${url}" alt="${title} Product Page" class="button button-secondary rc_button">View Again
                    <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="Icon Icon--arrow"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M13 18l6 -6" /><path d="M13 6l6 6" />
              </svg></a></div>
                </line-item>
              `;

        if (compareAt) {
          const compareAtEl = document.createElement('span');
          compareAtEl.classList.add("Price", "Price--compareAt");
          compareAtEl.innerText = compareAt;
          li.querySelector(".Price--wrapper").insertBefore(compareAtEl, li.querySelector(".Price"));
        }
        this.list.appendChild(li);
      } catch (err) {
        console.error(`Failed to fetch product data for ${item.productName}:`, err);
      }
    }

    this.loader.remove();
  }

  _handleClicks() {
    this.rcButton.addEventListener("click", () => {
      !this.hasRendered ? this._renderProducts() : "";
      this.hasRendered = true;
      this.classList.add("active");
      this.rcButton.classList.add("active");
      this.cartButton.classList.remove("active");
      this.cartContent.classList.remove("active");

      const onCartClick = (e) => {
        e.preventDefault();
        this.cartButton.classList.add("active");
        this.cartContent.classList.add("active");
        this.classList.remove("active");
        this.rcButton.classList.remove("active");

        this.cartButton.removeEventListener("click", onCartClick);
      };

      this.cartButton.addEventListener("click", onCartClick);
    });
  }
}

// Self-register the custom element when this module is loaded
if (!customElements.get("recently-viewed")) {
  customElements.define("recently-viewed", RecentlyViewedElement);
}
