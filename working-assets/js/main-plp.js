/* global IntersectionObserver history sessionStorage, URL URLSearchParams FormData */

import Splide from "./splide.min.js";
import { SplideUtil } from "./SplideUtil.js";

// ===================
// Loading Initial Setting
// ===================

// Remember and reset grid size
function gridSize() {
  const gridSize = localStorage.getItem("GK::grid-size");
  if (!gridSize) return;

  const grid = document.querySelector("infinite-scroll");
  grid.classList = "max-width";
  grid.classList.add(gridSize);
  grid.style.opacity = 1;
  document.querySelector(".column-controls").dataset.grid = gridSize;
}

// Auto Scroll to last viewed product
function autoScroll() {
  const rawData = sessionStorage.getItem("GK::clickedProductId");
  if (!rawData) return;

  const clickedProduct = JSON.parse(rawData);
  const targetElement = document.getElementById(clickedProduct.id);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  sessionStorage.removeItem("GK::clickedProductId");
}

//  run on document load to ensure all dom elements available
document.addEventListener("DOMContentLoaded", () => {
  gridSize();
  autoScroll();
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
        this.loadTriggerActive = this.loadTrigger?.querySelector("#infinite-trigger");
        if (this.loadTriggerActive) this.addEventListener("click", this._onProductCardClick);
        this.observer = null;
        this._observeLoadTrigger();
      }

      _observeLoadTrigger = () => {
        if (!this.loadTrigger || !this.loadTriggerActive) return;

        // Ensure nextPageUrl reflects the latest pagination (including new filter params)
        const refreshedNext = this.loadTriggerActive?.dataset?.nextPage || this.loadTrigger?.dataset?.nextPage || this.loadTriggerActive?.getAttribute?.("href");
        if (refreshedNext) {
          this.nextPageUrl = refreshedNext;
        }

        this.observer = new IntersectionObserver(
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

        this.observer.observe(this.loadTrigger);
      };

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

            // Re-attach observer to the new pagination element
            if (this.observer) {
              this.observer.disconnect();
            }
            this.loadTrigger = document.getElementById("pagination-next");
            this._observeLoadTrigger();
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

// ===================
// Price range controls
// ===================

class PriceRangeControl {
  constructor(fromSliderSelector, toSliderSelector, fromInputSelector, toInputSelector) {
    this.fromSlider = document.querySelector(fromSliderSelector);
    this.toSlider = document.querySelector(toSliderSelector);
    this.fromInput = document.querySelector(fromInputSelector);
    this.toInput = document.querySelector(toInputSelector);

    if (this.fromInput && this.fromSlider && this.toInput && this.toSlider) {
      this.#fillSlider(this.fromSlider, this.toSlider, "#C6C6C6", "#111", this.toSlider);
      this.#setToggleAccessible(this.toSlider);

      this.init();
    }
  }

  init() {
    this.fromSlider.oninput = () => this.#controlFromSlider();
    this.toSlider.oninput = () => this.#controlToSlider();
    this.fromInput.oninput = () => this.#controlFromInput();
    this.toInput.oninput = () => this.#controlToInput();
  }

  #controlFromInput() {
    const [from, to] = this.#getParsed(this.fromInput, this.toInput);
    this.#fillSlider(this.fromInput, this.toInput, "#C6C6C6", "#111", this.toSlider);
    if (from > to) {
      this.fromSlider.value = to;
      this.fromInput.value = to;
    } else {
      this.fromSlider.value = from;
    }
  }

  #controlToInput() {
    const [from, to] = this.#getParsed(this.fromInput, this.toInput);
    this.#fillSlider(this.fromInput, this.toInput, "#C6C6C6", "#111", this.toSlider);
    this.#setToggleAccessible(this.toInput);
    if (from <= to) {
      this.toSlider.value = to;
      this.toInput.value = to;
    } else {
      this.toInput.value = from;
    }
  }

  #controlFromSlider() {
    const [from, to] = this.#getParsed(this.fromSlider, this.toSlider);
    this.#fillSlider(this.fromSlider, this.toSlider, "#C6C6C6", "#111", this.toSlider);
    if (from > to) {
      this.fromSlider.value = to;
      this.fromInput.value = to;
    } else {
      this.fromInput.value = from;
    }
  }

  #controlToSlider() {
    const [from, to] = this.#getParsed(this.fromSlider, this.toSlider);
    this.#fillSlider(this.fromSlider, this.toSlider, "#C6C6C6", "#111", this.toSlider);
    this.#setToggleAccessible(this.toSlider);
    if (from <= to) {
      this.toSlider.value = to;
      this.toInput.value = to;
    } else {
      this.toInput.value = from;
      this.toSlider.value = from;
    }
  }

  #getParsed(currentFrom, currentTo) {
    const from = parseInt(currentFrom.value, 10);
    const to = parseInt(currentTo.value, 10);
    return [from, to];
  }

  #fillSlider(from, to, sliderColor, rangeColor, controlSlider) {
    const rangeDistance = to.max - to.min;
    const fromPosition = from.value - to.min;
    const toPosition = to.value - to.min;
    controlSlider.style.background = `linear-gradient(
      to right,
      ${sliderColor} 0%,
      ${sliderColor} ${(fromPosition / rangeDistance) * 100}%,
      ${rangeColor} ${(fromPosition / rangeDistance) * 100}%,
      ${rangeColor} ${(toPosition / rangeDistance) * 100}%,
      ${sliderColor} ${(toPosition / rangeDistance) * 100}%,
      ${sliderColor} 100%)`;
  }

  #setToggleAccessible(currentTarget) {
    if (Number(currentTarget.value) <= 0) {
      this.toSlider.style.zIndex = 2;
    } else {
      this.toSlider.style.zIndex = 0;
    }
  }
}

new PriceRangeControl("#fromSlider", "#toSlider", ".fromInput", ".toInput");

// ===================
// Product Grid Filters
// ===================

class EnhancedFilters {
  constructor(formElement) {
    this.form = formElement;
    this.applyFilters = this.applyFilters.bind(this);
    this.filterTitles = this.form.querySelectorAll(".filter_item-name");
    this.filterLabels = this.form.querySelectorAll(".filter_value-label");
    this.filterCheckboxes = this.form.querySelectorAll(".filter_value-checkbox");
    this.form.addEventListener("change", this.applyFilters);
  }

  /**
   * Handles the filter change event and updates the product grid accordingly.
   *
   * Steps performed:
   * 1. Prevents default form change behavior (safety).
   * 2. Collects current form data and constructs the new URL with updated search parameters.
   * 3. Sends a fetch request to retrieve the updated product list based on filters.
   * 4. Temporarily hides pagination and shows a loader while fetching.
   * 5. Parses the fetched HTML and replaces the current product grid and pagination controls.
   * 6. Updates the browser URL to reflect current filter state.
   * 7. Re-initializes infinite scroll observation on the new pagination element.
   * 8. Updates filter titles, labels, and disabled states based on new results.
   *
   * @param {Event} event - The change event triggered by filter inputs.
   */

  async applyFilters(event) {
    event.preventDefault();

    const formData = new FormData(this.form);
    const method = this.form.method.toUpperCase() || "GET";
    const url = new URL(this.form.action || window.location.href);

    // clear and replace the existing search params
    url.search = "";
    url.search = new URLSearchParams(formData).toString();

    const fetchUrl = url.toString();

    try {
      const currentGrid = document.querySelector("infinite-scroll");
      const currentPaginationNext = document.getElementById("pagination-next");
      const currentPaginationPrev = document.getElementById("pagination-prev");
      const currentTotalCount = document.querySelector(".product-count");

      if (currentPaginationNext) currentPaginationNext.style.display = "none";
      if (currentPaginationPrev) currentPaginationPrev.style.display = "none";
      currentGrid.style.minHeight = "40vh";
      currentGrid.innerHTML = `<div class="loader"></div>`;

      const response = await fetch(fetchUrl, { method });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Update URL in browser immediately after parsing
      window.history.pushState(null, "", fetchUrl);

      // Replace product grid
      const newGrid = doc.querySelector("infinite-scroll");

      if (newGrid && currentGrid) {
        currentGrid.innerHTML = newGrid.innerHTML;
        currentGrid.dataset.nextPage = newGrid.dataset.nextPage;
        currentGrid.style.minHeight = "auto";
      }

      // Replace pagination if needed
      const newPaginationPrev = doc.getElementById("pagination-prev");
      if (newPaginationPrev && currentPaginationPrev) {
        currentPaginationPrev.replaceWith(newPaginationPrev);
      } else if (newPaginationPrev && !currentPaginationPrev) {
        document.insertBefore(document.querySelector("infinite-scroll"), newPaginationPrev);
      } else if (!newPaginationPrev && currentPaginationPrev) {
        currentPaginationPrev.remove();
      }

      const newPaginationNext = doc.getElementById("pagination-next");
      if (newPaginationNext && currentPaginationNext) {
        currentPaginationNext.replaceWith(newPaginationNext);
      }

      // Update InfiniteScroll's nextPageUrl to match new filters
      const derivedNextFromDoc = newGrid?.dataset?.nextPage || newPaginationNext?.dataset?.nextPage || newPaginationNext?.querySelector?.("#infinite-trigger")?.getAttribute?.("href");

      // After replacing #pagination-next, re-observe it in InfiniteScroll
      const infiniteScroll = document.querySelector("infinite-scroll");
      if (infiniteScroll && typeof infiniteScroll._observeLoadTrigger === "function") {
        // Detach any existing observer tied to the old pagination element
        if (infiniteScroll.observer) {
          infiniteScroll.observer.disconnect();
          infiniteScroll.observer = null;
        }
        infiniteScroll.loadTrigger = document.getElementById("pagination-next");
        infiniteScroll.loadTriggerActive = infiniteScroll.loadTrigger?.querySelector("#infinite-trigger");
        if (derivedNextFromDoc) {
          infiniteScroll.nextPageUrl = derivedNextFromDoc;
        } else if (infiniteScroll.loadTriggerActive) {
          // Fallback to reading from the current DOM
          const fallbackNext = infiniteScroll.loadTriggerActive.dataset?.nextPage || infiniteScroll.loadTrigger?.dataset?.nextPage || infiniteScroll.loadTriggerActive.getAttribute("href");
          if (fallbackNext) infiniteScroll.nextPageUrl = fallbackNext;
        }
        infiniteScroll._observeLoadTrigger();
      }

      // Update filter titles
      const newFilterTitles = doc.querySelectorAll(".filter_item-name");
      const newFilterLabels = doc.querySelectorAll(".filter_value-label");
      const newfilterCheckboxes = doc.querySelectorAll(".filter_value-checkbox");
      const newTotalCount = doc.querySelector(".product-count").innerText;

      currentTotalCount.innerText = newTotalCount;

      const maxLength = Math.max(this.filterTitles.length, newFilterTitles.length, this.filterLabels.length, newFilterLabels.length, this.filterCheckboxes.length, newfilterCheckboxes.length);

      for (let i = 0; i < maxLength; i++) {
        const newTitle = newFilterTitles[i];
        const newLabel = newFilterLabels[i];
        const newCheckboxWrapper = newfilterCheckboxes[i];
        const currentTitle = this.filterTitles[i];
        const currentLabel = this.filterLabels[i];
        const currentCheckboxWrapper = this.filterCheckboxes[i];

        if (currentTitle && newTitle) {
          currentTitle.innerHTML = newTitle.innerHTML;
          currentTitle.dataset.activeCount = newTitle.dataset.activeCount;
        }

        if (currentLabel && newLabel) {
          currentLabel.innerHTML = newLabel.innerHTML;
          currentLabel.dataset.activeCount = newLabel.dataset.activeCount;
        }

        const currentInput = currentCheckboxWrapper?.querySelector("input[type='checkbox']");
        const newInput = newCheckboxWrapper?.querySelector("input[type='checkbox']");

        if (currentInput && newInput) {
          if (newInput.disabled) {
            currentInput.setAttribute("disabled", "");
          } else {
            currentInput.removeAttribute("disabled");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching filtered results:", error);
    }
  }
}

const form = document.getElementById("filter-form");
if (form) new EnhancedFilters(form);

// ===================
// Product Grid column Sizing
// ===================

class ColumnControls {
  constructor(element) {
    this.buttons = element.querySelectorAll("button");
    this.buttonUp = element.querySelector(".grid-control--up");
    this.buttonDown = element.querySelector(".grid-control--down");
    this.currentSize = localStorage.getItem("GK::grid-size") || "grid";
    this.sizes = ["small-grid", "grid", "large-grid"];
    this._addEventListeners();
  }

  _addEventListeners() {
    this.buttons.forEach((button) => {
      button.addEventListener("click", () => {
        this._handleClicks(button);
      });
    });
  }

  _handleClicks(button) {
    const currentIndex = this.sizes.indexOf(this.currentSize);
    const newIndex = button === this.buttonDown ? Math.max(0, currentIndex - 1) : Math.min(2, currentIndex + 1);
    this.currentSize = this.sizes[newIndex];
    localStorage.setItem("GK::grid-size", this.currentSize);
    gridSize();
  }
}

const colControls = document.querySelector(".column-controls");
if (colControls) new ColumnControls(colControls);

// ===================
// Blurb Collapse for mobile
// ===================

class BlurbControls {
  constructor(selector) {
    this.element = document.querySelector(selector);
    if (this.element) {
      this.isOverflow = this.element.clientHeight < this.element.scrollHeight;
    }
    if (this.isOverflow) this._addbutton();
  }

  _addbutton() {
    const controlBtn = document.createElement("a");
    controlBtn.className = "expand-blurb";
    controlBtn.innerText = "Read more";
    controlBtn.addEventListener("click", this._toggleView);
    this.element.appendChild(controlBtn);
  }

  _toggleView = () => {
    console.log(this.element);

    this.element.classList.toggle("active");
  };
}

new BlurbControls(".collection-blurb");
