/* global Shopify Cart iWish */
import RecentlyViewed from "./RecentlyViewed.js";

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
    this._renderProducts = this._renderProducts.bind(this);
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
    const sorted = out.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // If on a product page, remove the first item (likely the current product)
    if (window.location.pathname.includes("/products/")) {
      sorted.shift();
    }

    return sorted;
  }

  async _renderProducts() {
    this.list.innerHTML = ""

    let renderedItems = 0;
    for (let i = 0; i < this.flattenedData.length; i++) {
      if (renderedItems == 5) break;
      const item = this.flattenedData[i];
      const productDataUrl = `https://${Shopify.shop}${item.productUrl}.js`;

      let cartlist = document.querySelectorAll("line-item");
      let cartitems = [];
      cartlist.forEach((cartitem) => {
        cartitems.push(cartitem.dataset.productId);
      });

      if (!cartitems.includes(String(item.productId))) {
        try {
          const response = await fetch(productDataUrl);
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          const productData = await response.json();

          // define the data points we will need to create the cards:
          const title = productData.title.replace("Gym King ", "");
          const splitTitle = title.split(/[-–—]/)[0].trim();
          const splitColor = title.split(/[-–—]/)[1].trim();
          const price = Cart.formatMoney(productData.price);
          const compareAt = productData.compare_at_price > productData.price ? Cart.formatMoney(productData.compare_at_price) : "";
          const image = productData.images[0];
          const url = productData.url;
          const variants = productData.variants;

          let qatbBtns = "";

          // create the wishlist button
          const iWishBtn = document.createElement("a");
          iWishBtn.classList.add("iWishAdd", "iWishcoll", "iwishcheck", "round-btn");
          iWishBtn.href = "javascript:void(0)";
          iWishBtn.ariaLabel = "add/remove product from wishlist";
          iWishBtn.dataset.product = productData.id;
          iWishBtn.dataset.pTitle = title;
          iWishBtn.innerHTML = `<svg
                    version="1.1"
                    id="Capa_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    width="21px"
                    height="21px"
                    viewBox="0 0 378.94 378.94"
                    style="enable-background:new 0 0 378.94 378.94;"
                    xml:space="preserve"
                  >
                    <g><path d="M348.151,54.514c-19.883-19.884-46.315-30.826-74.435-30.826c-28.124,0-54.559,10.942-74.449,30.826l-9.798,9.8l-9.798-9.8c-19.884-19.884-46.325-30.826-74.443-30.826c-28.117,0-54.56,10.942-74.442,30.826c-41.049,41.053-41.049,107.848,0,148.885l147.09,147.091c2.405,2.414,5.399,3.892,8.527,4.461c1.049,0.207,2.104,0.303,3.161,0.303c4.161,0,8.329-1.587,11.498-4.764l147.09-147.091C389.203,162.362,389.203,95.567,348.151,54.514z M325.155,180.404L189.47,316.091L53.782,180.404c-28.368-28.364-28.368-74.514,0-102.893c13.741-13.739,32.017-21.296,51.446-21.296c19.431,0,37.702,7.557,51.438,21.296l21.305,21.312c6.107,6.098,16.897,6.098,23.003,0l21.297-21.312c13.737-13.739,32.009-21.296,51.446-21.296c19.431,0,37.701,7.557,51.438,21.296C353.526,105.89,353.526,152.039,325.155,180.404z"/></g>
                  </svg>`;
          iWish.iwishAddClick(iWishBtn);

          // generate the quick atb buttons
          for (let i = 0; i < variants.length; i++) {
            const vTitle = variants[i].title;
            const vId = variants[i].id;
            const vAvailable = variants[i].available ? "qatb-btn" : "qatb-btn--oos";
            qatbBtns += `<a href="/cart/add?id=${vId}&quantity=1" id="qatb-btn--${vId}" data-v-id="${vId}" class="${vAvailable}">${vTitle}</a>`;
            if (i == 0) {
              iWishBtn.dataset.variant = vId;
            }
          }

          const li = document.createElement("li");
          li.dataset.prodId = productData.id;
          li.className = "cart_items-item";
          li.innerHTML = `
                <line-item>
                  <div class="cart_item-image"><img src="${image}&width=85" alt="${title}"></div>
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
              <div class="qatb-btns">${qatbBtns}</div>
                </line-item>
              `;

          if (compareAt) {
            const compareAtEl = document.createElement("span");
            compareAtEl.classList.add("Price", "Price--compareAt");
            compareAtEl.innerText = compareAt;
            li.querySelector(".Price--wrapper").insertBefore(compareAtEl, li.querySelector(".Price"));
          }

          window.gkUtils.bindQATBButtons(li); // bind logic to qatb buttons
          li.appendChild(iWishBtn); // append the wishlist button
          this.list.appendChild(li); // add the element to the DOM

          renderedItems += 1;
        } catch (err) {
          console.error(`Failed to fetch product data for ${item.productName}:`, err);
        }
      }
    }

    this.loader.remove();
    // document.addEventListener("cart:loaded", this._renderProducts);
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
