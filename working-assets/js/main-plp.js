/* global IntersectionObserver history sessionStorage, URL */

import Splide from "./splide.min.js";
import { SplideUtil } from "./SplideUtil.js";

// ===================
// Auto Scroll to last viewed product
// ===================

document.addEventListener("DOMContentLoaded", () => {
  const rawData = sessionStorage.getItem("GK::clickedProductId");
  if (!rawData) return;

    const clickedProduct = JSON.parse(rawData);
    const targetElement = document.getElementById(clickedProduct.id);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    sessionStorage.removeItem("GK::clickedProductId");

});

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

// ===================
// Infinite Scroll
// ===================
if (!customElements.get("infinite-scroll")) {
  customElements.define(
    "infinite-scroll",
    class InfiniteScroll extends HTMLElement {
      connectedCallback() {
        this.nextPageUrl = this.dataset.nextPage;
        this.loadTrigger = document.getElementById("pagination-next");
        this.addEventListener("click", this._onProductCardClick);
        this._observeLoadTrigger();
      }

      _observeLoadTrigger() {
        if (!this.loadTrigger) return;

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this._loadMore();
              }
            });
          },
          {
            root: null,
            rootMargin: "0px 0px 700px 0px",
            threshold: 0,
          },
        );

        observer.observe(this.loadTrigger);
      }

      async _loadMore() {
        try {
          if (!this.nextPageUrl) return;

          //fetch the next page in full
          const response = await fetch(this.nextPageUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // parse the returned data parsing into HTML
          const htmlText = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, "text/html");

          // define the elements we require
          const newGrid = doc.querySelector("infinite-scroll");
          const newPagination = doc.getElementById("pagination-next").innerHTML;

          // update the next page pagination link
          if (newPagination) {
            this.loadTrigger.innerHTML = newPagination;
          }

          // append the new products cards to the infinite-scroll element
          if (newGrid) {
            this._updateURL(this.nextPageUrl);
            this.nextPageUrl = newGrid.dataset.nextPage;
            this.insertAdjacentHTML("beforeend", newGrid.innerHTML);
          }
        } catch (error) {
          console.error("Failed to load more products:", error);
        }
      }

      _updateURL(url) {
        if (typeof url === "string" && url.startsWith("/")) {
          history.pushState(null, "", url);
        } else {
          console.warn("Invalid URL passed to _updateURL:", url);
        }
      }

      _onProductCardClick(event) {
        const productAnchor = event.target.closest('a[href*="/products/"]');
        if (productAnchor) {
          const article = productAnchor.closest("article");
          if (article) {
            // set the correct page in the history so the user can continue the search from the same point
            const url = new URL(window.location.href);
            url.searchParams.set("page", article.dataset.page);
            history.replaceState(null, "", url.toString());
            //remember the product card and page
            const path = url.pathname; // store only the path name
            sessionStorage.setItem("GK::clickedProductId", JSON.stringify({ id: article.id, path }));
          }
        }
      }
    },
  );
}
