/**
 * Main JavaScript file for Mindset theme
 *
 * This file contains:
 * - CartAPI: Shopify cart management with custom events
 * - SlideDrawer: Mobile drawer navigation
 * - PageOverlay: Overlay management for modals/drawers
 * - PredictiveSearch: Search functionality
 * - ProductModalManager: Shared modal logic for products
 * - ProductCard: Product card custom element
 * - LineItem: Cart line item custom element
 * - ComponentLoader: Dynamic component loading system
 */

/* global requestIdleCallback MutationObserver IntersectionObserver, Shopify, theme, clearTimeout sessionStorage location URL iWish navigator */
import Splide from "./splide.min.js";
window.Splide = Splide;

// ===================
// CART CLASS
// ===================
/**
 * CartAPI - Manages Shopify cart operations and dispatches custom events
 * @class
 * @property {Object} cart - Current cart state
 * @property {HTMLElement} cartIcon - Header cart icon element
 */
class CartAPI {
  constructor() {
    this.cart = {}; // Stores current cart data from Shopify
    // Bind methods to maintain context
    this.loadCart = this.loadCart.bind(this);
    this.addItems = this.addItems.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.updateLineItem = this.updateLineItem.bind(this);
    this.dispatchCartUpdate = this.dispatchCartUpdate.bind(this);
    this.cartIcon = document.getElementById("header_cart-icon");

    // Rate limiting protection
    this._lastRequestTime = 0;
    this._minRequestInterval = 300; // Minimum 300ms between requests
    this._pendingRequests = new Map();

    this.loadCart(); // Load cart data on initialization
  }

  /**
   * Dispatches a custom event when the cart data changes
   * @param {string} eventName - Event name (cart:updated, cart:loaded, cart:itemsAdded, etc.)
   */
  dispatchCartUpdate(eventName = "cart:updated") {
    const event = new CustomEvent(eventName, {
      bubbles: true, // Allow event to bubble up the DOM
      detail: { cart: this.cart },
    });
    document.dispatchEvent(event);
    console.log(`Custom event '${eventName}' dispatched`);
  }

  /**
   * Fetches current cart state from Shopify and updates UI
   * Updates cart icon badge and dispatches cart:loaded event
   */
  async loadCart() {
    try {
      const res = await fetch("/cart.js");
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      console.log("Cart JSON data:", data);
      this.cart = data;
      this.cart.item_count > 0 ? this.cartIcon.classList.add("cart-not-empty") : this.cartIcon.classList.remove("cart-not-empty");
      this.dispatchCartUpdate("cart:loaded"); // Notify UI components
    } catch (error) {
      console.error("Error loading cart.js:", error);
    }
  }

  /**
   * Add one or more items to the cart
   * @param {number|Array|Object} items - Accepts:
   *   - Single variant ID: 123456
   *   - Array of IDs: [123, 456, 789]
   *   - Array of objects: [{id: 123, quantity: 2}, {id: 456, quantity: 1}]
   *   - Single object: {id: 123, quantity: 2}
   * @returns {Promise} Shopify cart API response
   */
  async addItems(items) {
    let normalizedItems = [];

    if (Array.isArray(items)) {
      normalizedItems = items.map((item) => (typeof item === "object" ? item : { id: item, quantity: 1 }));
    } else if (typeof items === "object") {
      normalizedItems = [items]; // single object like { id, quantity }
    } else {
      normalizedItems = [{ id: items, quantity: 1 }]; // single id
    }

    try {
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: normalizedItems }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Shopify Add to Cart Error:", errorData);
        // could dispatch an error event here
        return Promise.reject(errorData);
      }

      const data = await res.json();
      await this.loadCart();
      this.dispatchCartUpdate("cart:itemsAdded");
      return data;
    } catch (error) {
      console.error("Network or unexpected error during addItems:", error);
      return Promise.reject(error);
    }
  }

  /**
   * Remove an item from the cart
   * @param {string|number} lineItemKey - Line item key or variant ID
   *   Note: If using variant ID, only first instance will be removed
   */
  async removeItem(lineItemKey) {
    try {
      const res = await fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lineItemKey, quantity: 0 }),
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const data = await res.json();
      await this.loadCart(); // Reload cart data and dispatch update
      this.dispatchCartUpdate("cart:itemRemoved");
      return data;
    } catch (error) {
      console.error("Error removing item:", error);
      return Promise.reject(error);
    }
  }

  /**
   * Update quantity of a cart line item
   * @param {string|number} lineItemKey - Line item key
   * @param {number} quantity - New quantity (set to 0 to remove)
   */
  async updateLineItem(lineItemKey, quantity) {
    try {
      const res = await fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lineItemKey, quantity: quantity }),
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      await this.loadCart(); // Reload cart data and dispatch update
      this.dispatchCartUpdate("cart:lineItemUpdated");
      return data;
    } catch (error) {
      console.error("Error updating item:", error);
      return Promise.reject(error);
    }
  }

  /**
   * Clear all items from the cart
   * Dispatches cart:cleared event when complete
   */
  async clearAll() {
    try {
      const res = await fetch("/cart/clear.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      await this.loadCart(); // Reload cart data and dispatch update
      this.dispatchCartUpdate("cart:cleared");
      return data;
    } catch (error) {
      console.error("Error clearing cart:", error);
      return Promise.reject(error);
    }
  }

  /**
   * Convert money amount to formatted string using theme settings
   * @param {number} amount - Amount in cents
   * @returns {string} Formatted money string (strips .00)
   */
  formatMoney(amount) {
    const format = window.theme.moneyFormat;
    const value = amount / 100;
    const formatted = format.replace("{{amount}}", value.toFixed(2));
    return formatted.replace(/\.00$/, ""); // only strip ".00", leave ".50" etc.
  }

  /**
   * Update the checkout total displayed in the cart
   * @param {number} value - Total cart value in cents
   */
  updateCheckoutTotal(value) {
    let totalPoint = document.querySelector(".cart-total");
    if (value === 0) {
      totalPoint.parentElement.remove();
      Cart.getLineItems();
    } else {
      totalPoint.innerHTML = Cart.formatMoney(value);
    }
  }

  /**
   * Fetches and updates the cart drawer contents
   * Used to refresh line items after cart changes
   * Includes debouncing to prevent rate limiting (429 errors)
   */
  async getLineItems() {
    const requestKey = 'getLineItems';

    // Cancel any pending request
    if (this._pendingRequests.has(requestKey)) {
      clearTimeout(this._pendingRequests.get(requestKey));
    }

    // Calculate time since last request
    const now = Date.now();
    const timeSinceLastRequest = now - this._lastRequestTime;

    // If enough time has passed, execute immediately
    if (timeSinceLastRequest >= this._minRequestInterval) {
      return this._executeGetLineItems();
    }

    // Otherwise, debounce the request
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this._pendingRequests.delete(requestKey);
        this._executeGetLineItems().then(resolve).catch(reject);
      }, this._minRequestInterval - timeSinceLastRequest);

      this._pendingRequests.set(requestKey, timeoutId);
    });
  }

  /**
   * Internal method that actually executes the fetch request
   * Separated for cleaner debouncing logic
   */
  async _executeGetLineItems() {
    this._lastRequestTime = Date.now();

    try {
      const res = await fetch("/?sections=drawer-cart");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      const html = data["drawer-cart"];

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const newSideCart = doc.querySelector("#side-cart");
      const existingSideCart = document.querySelector("#side-cart");

      if (newSideCart && existingSideCart) {
        // Ensure first list item animates in
        const firstListItem = newSideCart.querySelector("li");
        if (firstListItem) {
          firstListItem.classList.add("fade-in", "no-height");
        }

        // Replace only the side-cart contents
        existingSideCart.innerHTML = newSideCart.innerHTML;

        // Activate empty state/content if present within side-cart
        const emptyContent = existingSideCart.querySelector("div.cart_items-list");
        if (emptyContent) {
          emptyContent.classList.add("active");
        }
      }
    } catch (error) {
      console.error("Failed to fetch drawer-cart section:", error);
      throw error; // Re-throw to allow caller to handle
    }
  }
}

// Initialize CartAPI globally and export for modules
window.Cart = new CartAPI();
export const Cart = window.Cart;

// ===================
// SLIDING DRAWER CLASS
// ===================
/**
 * SlideDrawer - Custom element for mobile drawer menus
 * Handles swipe gestures and open/close functionality
 * Usage: <slide-drawer data-side="left|right">...</slide-drawer>
 */
if (!customElements.get("slide-drawer")) {
  customElements.define(
    "slide-drawer",
    class SlideDrawer extends HTMLElement {
      constructor() {
        super();
        this.side = this.dataset.side;
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
      }

      connectedCallback() {
        this.classList.add(this.side);
        const closeBtn = document.createElement("button");
        closeBtn.classList.add("drawer-close");
        closeBtn.setAttribute("aria-label", "Close drawer");
        closeBtn.innerHTML =
          "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='Icon'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M18 6l-12 12' /><path d='M6 6l12 12' /></svg>";
        closeBtn.addEventListener("click", () => this.close());
        this.appendChild(closeBtn);
        this._startX = 0;
        this._endX = 0;
        this.searchElement = document.querySelector("predictive-search");
      }

      _handleSwipe() {
        const distance = this._endX - this._startX;
        const threshold = 50;

        if (this.side === "right" && distance > threshold) {
          this.close();
        } else if (distance < -threshold) {
          this.close();
        }
      }

      open() {
        this.searchElement.close(); //close the searchbar only if open
        document.body.classList.add("no-scroll");
        this.setAttribute("aria-hidden", "false");
        this.addEventListener("touchstart", this._onTouchStart, {
          passive: true,
        });
        this.addEventListener("touchend", this._onTouchEnd, { passive: true });

        setTimeout(() => {
          const lastCartItem = this.querySelectorAll(".fade-in");
          if (lastCartItem) {
            lastCartItem.forEach((item) => {
              item.classList.add("active");
            });
          }
        }, 5);
      }

      close() {
        document.body.classList.remove("no-scroll");
        this.setAttribute("aria-hidden", "true");
        this.removeEventListener("touchstart", this._onTouchStart);
        this.removeEventListener("touchend", this._onTouchEnd);
      }

      _onTouchStart(e) {
        this._startX = e.touches[0].clientX;
      }

      _onTouchEnd(e) {
        this._endX = e.changedTouches[0].clientX;
        this._handleSwipe();
      }
    },
  );
}

// ===================
// SLIDING DRAWER BUTTONS
// ===================
/**
 * Initialize all drawer trigger buttons
 * Elements require:
 *  - Class: .drawer-button
 *  - Attribute: data-target="drawer-id"
 */
document.querySelectorAll(".drawer-button").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    const target = event.target.closest(".drawer-button").getAttribute("data-target");
    const drawer = document.getElementById(target);

    if (!(theme.pageType === "cart" && target === "cartDrawer")) {
      event.preventDefault();
      drawer.open();
    }
  });
});

// ===================
// DRAWER MENU GENDER SELECTION
// ===================
/**
 * SideMenuGenderSelector - Manages gender menu switching in mobile drawer
 * Stores selection in localStorage and applies offset to menu slider
 * @class
 */
class SideMenuGenderSelector {
  constructor(headerSelector) {
    this.header = document.querySelector(headerSelector);
    if (!this.header) return;

    this._bindEvents();
    this._restoreLastSelection();
  }

  _bindEvents() {
    this.header.addEventListener("click", this._handleGenderSelect.bind(this));
  }

  _handleGenderSelect(event) {
    const button = event.target.closest("[data-gender]");
    if (!button) return;

    const gender = button.dataset.gender;
    const menuOffset = { kids: 200, womens: 100 }[gender] || 0;
    document.querySelector(".side_menu-slider").style.left = `-${menuOffset}%`;

    localStorage.setItem("GK::gender--menu", gender);

    const siblings = [...button.parentElement.children];
    siblings.forEach((el) => el.classList.toggle("active", el === button));

    menuController.resetMenus();
  }

  _restoreLastSelection() {
    const lastGender = localStorage.getItem("GK::gender--menu");
    if (lastGender) {
      const match = this.header.querySelector(`[data-gender="${lastGender}"]`);
      match.click();
    }
  }
}

// Initialize gender selector when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new SideMenuGenderSelector(".side_menu-header");
});

// ===================
// DRAWER MENU SUB MENU CONTROLS
// ===================
/**
 * SubMenuController - Manages nested sub-menus in the mobile drawer
 * Tracks open menus and applies slide-in animations
 * @class
 */
class SubMenuController {
  constructor(drawerElement) {
    this.drawer = drawerElement;
    this.activeMenus = new Set();

    this.subMenuButtons = this.drawer.querySelectorAll(".side_menu-sub-menu-button");
    this.subMenus = this.drawer.querySelectorAll(".side_menu-sub-menu");

    this._bindEvents();
  }

  _bindEvents() {
    this.subMenuButtons.forEach((button) => {
      const targetHandle = button.dataset.subMenu;
      button.addEventListener("click", () => this.openSubMenu(targetHandle));
    });

    this.subMenus.forEach((menu) => {
      const closeBtn = menu.querySelector(".sub_menu-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => this.closeSubMenu(menu.dataset.subMenu));
      }
    });
  }

  openSubMenu(handle) {
    const menu = this._getMenuByHandle(handle);
    if (menu) {
      menu.style.transform = "translateX(-100%)";
      menu.style.opacity = "1";
      menu.style.pointerEvents = "auto";
      this.activeMenus.add(menu);
    }
  }

  closeSubMenu(handle) {
    const menu = this._getMenuByHandle(handle);
    if (menu) {
      this._closeActions(menu);
      this.activeMenus.delete(menu);
    }
  }

  resetMenus() {
    this.activeMenus.forEach((menu) => {
      this._closeActions(menu);
    });
    this.activeMenus.clear();
  }

  _getMenuByHandle(handle) {
    return this.drawer.querySelector(`.side_menu-sub-menu[data-sub-menu="${handle}"]`);
  }

  _closeActions(menu) {
    menu.style.transform = "translateX(0)";
    menu.style.opacity = "0";
    menu.style.pointerEvents = "none";
  }
}

// Initialize the sub-menu controller for the navigation drawer
const drawer = document.getElementById("navDrawer");
const menuController = new SubMenuController(drawer);

// ===================
// PAGE OVERLAY CLASS
// ===================
/**
 * PageOverlay - Full-screen overlay for modals and drawers
 * Handles closing all open overlays when clicked
 * Usage: <page-overlay></page-overlay>
 */
if (!customElements.get("page-overlay")) {
  customElements.define(
    "page-overlay",
    class PageOverlay extends HTMLElement {
      connectedCallback() {
        this.addEventListener("click", this.closeAllOverlays.bind(this));
      }

      closeAllOverlays() {
        // allow scrolling
        this.closeThis();
        // close any open drawers
        this._closeLoop("slide-drawer");
        // close any mobile qatb modals
        this._closeLoop(".modal");
        //close the searchbar
        document.querySelector("predictive-search").close();
      }

      _closeLoop(query) {
        const els = document.querySelectorAll(query);
        els.forEach((el) => {
          if (el.getAttribute("aria-hidden") == "false") {
            el.classList.remove("active");
            el.setAttribute("aria-hidden", "true");
            el.close();
          }
        });
      }

      closeThis() {
        document.body.classList.remove("no-scroll");
      }

      openThis() {
        document.body.classList.add("no-scroll");
      }
    },
  );
}

// ===================
// PREDICTIVE SEARCH
// ===================
/**
 * PredictiveSearch - Live search functionality with debouncing
 * Fetches and displays search results as user types
 * Usage: <predictive-search></predictive-search>
 */
if (!customElements.get("predictive-search")) {
  customElements.define(
    "predictive-search",
    class PredictiveSearch extends HTMLElement {
      constructor() {
        super();
        this.isOpen = false;
        this.searchTerm = "";
        this.pageOverlay = document.querySelector("page-overlay");
        this.pageHeader = document.getElementById("shopify-section-header-main");
      }

      connectedCallback() {
        this.searchButton = document.getElementById("header_search-icon");
        this.searchButton.addEventListener("click", this._handleOpenClose);
        this.closeButton = this.querySelector(".search_form-close");
        this.closeButton.addEventListener("click", this._handleOpenClose);
        this.inputField = this.querySelector(".search_form-terms-input");
        this.inputField.addEventListener(
          "input",
          this.debounce((event) => {
            this._onInputChange(event);
          }),
        );
      }

      debounce = (fn, delay = 500) => {
        let timeout;
        return function (...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => fn.apply(this, args), delay);
        };
      };

      _onInputChange = () => {
        this.searchTerm = this.inputField.value.trim();
        if (this.searchTerm.length == 0) this._resetResults();
        if (this.searchTerm.length < 3) return; // only run if search term is greater than 2 letters

        this._getSearchResults();
      };

      _getSearchResults = () => {
        fetch(
          `/search/suggest?q=${this.searchTerm}&resources[limit]=10&resources[limit_scope]=each&resources[type]=product,page,collection,article,query&resources[options][fields]=body,product_type,title,variants.sku&section_id=predictive-search-results`,
        )
          .then((response) => {
            if (!response.ok) {
              var error = new Error(response.status);
              throw error;
            }

            return response.text();
          })
          .then((text) => {
            this._resetResults();
            const resultsMarkup = new DOMParser().parseFromString(text, "text/html").querySelector("#shopify-section-predictive-search-results").innerHTML;
            // If countdown timers are present, ensure the custom element is defined (guarded)
            if (resultsMarkup.includes("countdown-timer") && !customElements.get("countdown-timer")) {
              import("./CountdownTimer.js").then((module) => {
                if (!customElements.get("countdown-timer")) {
                  customElements.define("countdown-timer", module.default);
                }
              });
            }
            const resultEL = document.createElement("div");
            resultEL.classList.add("predictive-search--results");
            resultEL.innerHTML = resultsMarkup;
            this.appendChild(resultEL);
          })
          .catch((error) => {
            throw error;
          });
      };

      _resetResults = () => {
        if (this.querySelector(".predictive-search--results")) this.querySelector(".predictive-search--results").remove();
      };

      _handleOpenClose = (event) => {
        event.preventDefault();
        this.setAttribute("aria-hidden", this.isOpen);
        if (this.isOpen) {
          this.inputField.blur();
          this.pageOverlay.closeThis();
          setTimeout(() => {
            this.pageHeader.style.zIndex = 5;
            this.style.visibility = "hidden";
          }, 150);
        } else {
          this.pageOverlay.openThis();
          this.style.visibility = "visible";
          this.pageHeader.style.zIndex = 11;
          this.inputField.focus();
        }

        this.isOpen = !this.isOpen; // update the isOpen status for next click
      };

      close = () => {
        this.setAttribute("aria-hidden", "true");
        this.style.visibility = "hidden";
        this.pageHeader.style.zIndex = 5;
        this.isOpen = false;
      };
    },
  );
}

// ===================
// Global Utilities
// ===================
/**
 * gkUtils - Global utility functions
 * Currently handles Quick Add To Bag (QATB) button functionality
 * @class
 */
class gkUtils {
  /**
   * Binds Quick Add To Bag buttons within a container
   * @param {HTMLElement} root - Container element with .qatb-btn buttons
   */
  bindQATBButtons(root) {
    const qatbButtons = root.querySelectorAll(".qatb-btn") || [];
    qatbButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const targetButton = e.currentTarget;
        const targetSize = targetButton.innerText;

        const errors = targetButton.closest(".qatb-btns").parentElement.querySelectorAll(".cart-error");
        errors.forEach((error) => error.remove());

        targetButton.innerHTML = `<div class="loader"></div>`;

        Cart.addItems(targetButton.dataset.vId)
          .then(() => {
            targetButton.innerHTML = targetSize;
            const prodID = root.id;
            const modal = document.getElementById(prodID);
            modal ? modal.classList.remove("active") : "";
          })
          .catch((error) => {
            targetButton.innerHTML = targetSize;
            const errorBox = document.createElement("div");
            errorBox.className = "cart-error warning";
            errorBox.textContent = error.description || "Sorry, something went wrong.";
            targetButton.closest(".qatb-btns").before(errorBox);
          });
      });
    });
  }
}

// Initialize gkUtils globally
window.gkUtils = new gkUtils();

// ===================
// Product Modal Manager
// ===================
/**
 * ProductModalManager - Manages product quick-add modals
 * Shared by both ProductCard and LineItem components
 * Handles modal creation, opening, closing, and touch swipe gestures
 * @class
 */
class ProductModalManager {
  /**
   * @param {HTMLElement} sourceElement - The parent element (ProductCard or LineItem)
   */
  constructor(sourceElement) {
    this.sourceElement = sourceElement; // Reference to parent element
    this._touchStartY = null; // Track touch start position for swipe
    this._touchStartListener = null; // Touch event listener reference
    this._touchEndListener = null; // Touch event listener reference
  }

  /**
   * Opens or creates a product modal
   * Adds touch swipe-to-close functionality for mobile
   * @param {Event} event - Click event from trigger button
   */
  openModal(event) {
    const isOverlay = document.body.classList.contains("no-scroll");
    const trigger = event.currentTarget || event.target;
    const modalID = trigger.dataset.target;
    let modalEl = document.getElementById(modalID);

    if (!modalEl) {
      modalEl = this.buildModal(trigger);
      document.body.appendChild(modalEl);
      window.gkUtils.bindQATBButtons(modalEl);
    }

    setTimeout(() => {
      modalEl.classList.add("active");
      isOverlay ? modalEl.classList.add("keep-overlay") : "";
      modalEl.setAttribute("aria-hidden", "false");
      document.querySelector("page-overlay").openThis();

      // Touch swipe-to-close support for mobile devices
      if ("ontouchstart" in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)) {
        // Remove any previous listeners if present
        if (this._touchStartListener) {
          modalEl.removeEventListener("touchstart", this._touchStartListener);
          this._touchStartListener = null;
        }
        if (this._touchEndListener) {
          modalEl.removeEventListener("touchend", this._touchEndListener);
          this._touchEndListener = null;
        }
        // Handler for touchstart: record startY
        this._touchStartListener = (touchEvent) => {
          if (touchEvent.touches && touchEvent.touches.length > 0) {
            this._touchStartY = touchEvent.touches[0].clientY;
          }
        };
        // Handler for touchend: check swipe down
        this._touchEndListener = (touchEvent) => {
          if (typeof this._touchStartY !== "number") return;
          if (touchEvent.changedTouches && touchEvent.changedTouches.length > 0) {
            const endY = touchEvent.changedTouches[0].clientY;
            const deltaY = endY - this._touchStartY;
            if (deltaY > 50) {
              // Swipe down detected; close modal
              // Synthetic event with target as modalEl
              this.closeModal({ target: modalEl });
            }
          }
          this._touchStartY = null;
        };
        modalEl.addEventListener("touchstart", this._touchStartListener);
        modalEl.addEventListener("touchend", this._touchEndListener);
      }
    }, 200);
  }

  /**
   * Builds the modal DOM structure
   * Creates image gallery, product info, and add-to-bag buttons
   * @param {HTMLElement} trigger - Button element that triggered the modal
   * @returns {HTMLElement} Complete modal element ready to append to DOM
   */
  buildModal(trigger) {
    const imgURLs = trigger.dataset.images.split(",");
    const modalID = trigger.dataset.target;
    const productTitle = trigger.dataset.productTitle;

    //create the modal
    const modal = document.createElement("div");
    modal.className = "fade-in mqatb-modal modal";
    modal.id = modalID;
    modal.setAttribute("aria-hidden", "true");

    // create the image container and render the images
    const images = document.createElement("div");
    images.className = "mqatb-images";
    const loopEnd = imgURLs.length < 8 ? imgURLs.length : 8;
    for (let i = 0, len = loopEnd; i < len; i++) {
      if (imgURLs[i].length > 0) {
        const img = document.createElement("img");
        img.src = imgURLs[i];
        img.draggable = false;
        img.alt = `${productTitle} - image ${i + 1}`;
        images.appendChild(img);
      }
    }

    // Copy the product details - check trigger first (for .cart_items-ctl-button), then sourceElement
    const productInfoSource = trigger.querySelector(".product_card-info") || this.sourceElement.querySelector(".product_card-info");
    const productInfo = productInfoSource.innerHTML;
    const info = document.createElement("div");
    info.className = "mqatb-info";
    info.innerHTML = productInfo;
    // Remove any cart control buttons that may have been copied from line items
    info.querySelectorAll(".cart_items-ctl-button").forEach((el) => el.remove());

    // Copy add to bag buttons - check trigger first, then sourceElement
    const buttonsDataSource = trigger.querySelector(".datb") || this.sourceElement.querySelector(".datb");
    const buttonsData = buttonsDataSource.innerHTML;
    const buttons = document.createElement("div");
    buttons.className = "mqatb-btns";
    buttons.innerHTML = `Quick Add: ${buttonsData}`


    // add content to the modal
    const modalContent = document.createElement("div");
    modal.appendChild(images);
    modalContent.appendChild(info);
    modalContent.appendChild(buttons);
    modal.appendChild(modalContent);

    //create the close button and add close functionality
    const close = document.createElement("div");
    close.className = "round-btn mqatb-close";
    const closeIcon = `
     <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="rotate45 icon icon-plus"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" />
    </svg>`;
    close.innerHTML = closeIcon;
    modal.appendChild(close);
    close.addEventListener("click", (event) => this.closeModal(event));

    //return the modal for rendering to dom
    return modal;
  }

  /**
   * Closes the modal and cleans up event listeners
   * Optionally keeps page overlay open if modal was stacked
   * @param {Event} event - Click event from close button or swipe
   */
  closeModal(event) {
    const modal = event.target.closest(".mqatb-modal");
    const keepOverlay = modal.classList.contains("keep-overlay");
    // Remove touch listeners if present
    if (this._touchStartListener) {
      modal.removeEventListener("touchstart", this._touchStartListener);
      this._touchStartListener = null;
    }
    if (this._touchEndListener) {
      modal.removeEventListener("touchend", this._touchEndListener);
      this._touchEndListener = null;
    }
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    !keepOverlay ? document.querySelector("page-overlay").closeThis() : "";
    modal.classList.remove("keep-overlay");
  }
}

// Make ProductModalManager globally accessible
window.ProductModalManager = ProductModalManager;

// ===================
// Product Cards
// ===================
/**
 * ProductCard - Custom element for product card components
 * Handles quick-add modals, iWish integration, and countdown timers
 * Uses ProductModalManager for modal functionality
 * Usage: <product-card>...</product-card>
 */
if (!customElements.get("product-card")) {
  customElements.define(
    "product-card",
    class ProductCard extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        // Initialize the modal manager for this product card
        this.modalManager = new ProductModalManager(this);
        this._init();

        // Listen for countdown ended event
        this._countdownHandler = () => {
          const decal = this.querySelector(".product_card-decal");
          if (decal) decal.remove();
        };
        window.addEventListener("countdown:ended", this._countdownHandler);
      }

      /**
       * Initialize event listeners and modal functionality
       * Binds QATB buttons, modal triggers, and iWish buttons
       */
      _init() {
        window.gkUtils.bindQATBButtons(this);

        // add click listeners to the open mobile qatb button
        const openmqatbBtn = this.querySelector(".mqatb-show");
        if (!openmqatbBtn) return;
        openmqatbBtn.addEventListener("click", (event) => this.modalManager.openModal(event));

        // add click listeners to the Iwish buttons
        const el = this.querySelector(".iWishColl");
        if (el) {
          if (typeof iWish !== "undefined" && iWish.iwishAddClick) {
            iWish.iwishAddClick(el);
          }
        }

        // add click listeners to the modal close button
        const close = this.querySelector(".mqatb-close");
        if (close) close.addEventListener("click", (event) => this.modalManager.closeModal(event));
      }

      disconnectedCallback() {
        if (this._countdownHandler) {
          window.removeEventListener("countdown:ended", this._countdownHandler);
        }
      }
    },
  );
}

// ===================
// DYNAMIC IMPORTS
// ===================
/**
 * ComponentLoader - Lazy-loads custom element modules
 * Uses IntersectionObserver for viewport-based loading
 * Uses MutationObserver for dynamically added elements
 * Prevents duplicate definitions and optimizes bundle size
 * @class
 */
class ComponentLoader {
  static uninitializedLoaders = []; // Queue of loaders waiting for DOM elements
  static sharedObserver = null; // Shared MutationObserver for all loaders

  /**
   * @param {string} selector - Custom element tag name
   * @param {Function} importFn - Dynamic import function returning module promise
   */
  constructor(selector, importFn) {
    this.selector = selector; // Tag name to watch for
    this.importFn = importFn; // Import function for the module

    if (customElements.get(this.selector)) return;

    const existingEl = document.querySelector(selector);

    if (existingEl) {
      this.init();
    } else {
      ComponentLoader.registerLoader(this);
    }
  }

  static registerLoader(loaderInstance) {
    ComponentLoader.uninitializedLoaders.push(loaderInstance);
    if (!ComponentLoader.sharedObserver) {
      ComponentLoader.sharedObserver = new MutationObserver(ComponentLoader.handleMutations);
      ComponentLoader.sharedObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  static handleMutations(mutations) {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        ComponentLoader.uninitializedLoaders = ComponentLoader.uninitializedLoaders.filter((loader) => {
          if (node.matches?.(loader.selector) || node.querySelector?.(loader.selector)) {
            loader.loadAndDefine();
            return false; // remove from list once initialized
          }
          return true;
        });

        // Disconnect if all have been initialized
        if (ComponentLoader.uninitializedLoaders.length === 0) {
          ComponentLoader.sharedObserver.disconnect();
          ComponentLoader.sharedObserver = null;
        }
      }
    }
  }

  init() {
    const target = document.querySelector(this.selector)?.closest(".shopify-section") || document.querySelector(this.selector);
    const rect = target?.getBoundingClientRect();

    if (!rect || rect.top <= window.innerHeight) {
      this.loadAndDefine();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries, obs) => {
        if (entries[0].isIntersecting) {
          this.loadAndDefine();
          obs.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "0px 0px 200px 0px",
        threshold: 0,
      },
    );

    this.observer.observe(target);
  }

  loadAndDefine() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.importFn().then((module) => {
      // If tag was defined during import side-effects, stop here
      if (customElements.get(this.selector)) return;

      const Ctor = module && module.default ? module.default : null;
      if (!Ctor) return;

      try {
        customElements.define(this.selector, Ctor);
      } catch (err) {
        // Safari/Chromium will throw NotSupportedError if this constructor
        // has already been registered under a different tag name.
        if (err && err.name === "NotSupportedError") {
          // Define a thin subclass so the constructor is unique.
          const Wrapper = class extends Ctor { };
          // Re-check in case another racing define happened while we handled the error
          if (!customElements.get(this.selector)) {
            customElements.define(this.selector, Wrapper);
          }
        } else {
          throw err;
        }
      }
    });
  }
}

// Export ComponentLoader globally and initialize hero carousel immediately
window.ComponentLoader = ComponentLoader;
new ComponentLoader("hero-carousel", () => import("./HeroCarousel.js"));

/**
 * Initialize dynamic components using requestIdleCallback
 * Components are lazy-loaded when browser is idle or when they appear in viewport
 */
function initDynamicComponents() {
  // Lazy-load components when visible
  new ComponentLoader("productcard-carousel", () => import("./ProductCarousel.js"));
  new ComponentLoader("countdown-timer", () => import("./CountdownTimer.js"));
  new ComponentLoader("product-recommendations", () => import("./ProductRecommendations.js"));
  new ComponentLoader("personal-recommendations", () => import("./PersonalisedCarousel.js"));
  new ComponentLoader("content-accordian", () => import("./ContentAccordian.js"));
  new ComponentLoader("bnpl-options", () => import("./BnplOptions.js"));
  new ComponentLoader("size-table", () => import("./SizeTable.js"));
  new ComponentLoader("ometria-form", () => import("./OmetriaForm.js"));
  new ComponentLoader("custom-video-controls", () => import("./CustomVideo.js"));
}

// Initialize components when browser is idle (better performance)
// Use requestIdleCallback with a fallback for unsupported browsers
if ("requestIdleCallback" in window) {
  requestIdleCallback(initDynamicComponents, { timeout: 2000 });
} else {
  setTimeout(initDynamicComponents, 1500);
}


// ===================
// CART LINE ITEMS
// ===================
/**
 * LineItem - Custom element for cart line items
 * Handles quantity updates, item removal, and product modals
 * Uses ProductModalManager for quick-add modal functionality
 * Usage: <line-item data-key="line-key" data-index="0">...</line-item>
 */
if (!customElements.get("line-item")) {
  customElements.define(
    "line-item",
    class LineItem extends HTMLElement {
      connectedCallback() {
        // Initialize the modal manager for this line item
        this.modalManager = new ProductModalManager(this);
        this.lineItemKey = this.dataset.key;
        this._bindQuantityControls();
        this._bindModalTriggers();
      }

      /**
       * Binds modal trigger buttons for product quick-view
       * Allows opening product details from cart line items
       */
      _bindModalTriggers() {
        // Bind any modal trigger buttons in the line item
        const modalTrigger = this.querySelector(".mqatb-show");
        if (modalTrigger) {
          modalTrigger.addEventListener("click", (event) => this.modalManager.openModal(event));
        }

        // Bind close buttons if present in the line item
        const closeBtn = this.querySelector(".mqatb-close");
        if (closeBtn) {
          closeBtn.addEventListener("click", (event) => this.modalManager.closeModal(event));
        }

        // Bind complementary product buttons to open modals instead of redirecting
        const ctlButtons = this.querySelectorAll(".cart_items-ctl-button");
        ctlButtons.forEach((btn) => {
          btn.addEventListener("click", (event) => {
            event.preventDefault();
            this.modalManager.openModal(event);
          });
        });
      }

      /**
       * Binds quantity selector controls (+, -, input field, remove)
       * Updates cart via CartAPI and refreshes UI
       */
      _bindQuantityControls() {
        let lastQty = 0;
        const selector = this.querySelector(".quantity-selector");
        if (!selector) return;
        const input = selector.querySelector(".qty-input");

        // Handle +/- buttons
        selector.querySelectorAll("[data-new-qty]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const newQty = parseInt(btn.dataset.newQty, 10);
            if (!isNaN(newQty)) {
              Cart.updateLineItem(this.lineItemKey, newQty).then(() => {
                // remove the element from the DOM if newQty is zero
                if (newQty === 0) this.removeItemEl();
                this.lineItemKey = Cart.cart.items[this.dataset.index]?.key || this.lineItemKey;
                // update the quantity selector values
                input.value = newQty;
                selector.querySelector(".quantity-minus").dataset.newQty = newQty - 1;
                selector.querySelector(".quantity-plus").dataset.newQty = newQty + 1;

                // update the line total.
                this.querySelector(".cart_item-total").innerHTML = Cart.formatMoney(Cart.cart.items[this.dataset.index].line_price, Cart.cart.currency);

                // update the cart total
                Cart.updateCheckoutTotal(Cart.cart.total_price, Cart.cart.currency);
              });
            }
          });
        });

        // Handle input blur and Enter/Tab keys
        const commitChange = () => {
          const newQty = parseInt(input.value, 10);
          if (!isNaN(newQty) && newQty !== lastQty) {
            lastQty = newQty;
            Cart.updateLineItem(this.lineItemKey, newQty);
            // update the cart total
            selector.querySelector(".quantity-minus").dataset.newQty = newQty - 1;
            selector.querySelector(".quantity-plus").dataset.newQty = newQty + 1;
            Cart.updateCheckoutTotal(Cart.cart.total_price, Cart.cart.currency);
          }
        };

        input.addEventListener("change", commitChange);
        input.addEventListener("blur", commitChange);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === "Tab") {
            commitChange();
          }
        });

        // Handle remove button
        const removeBtn = selector.querySelector(".quantity-zero");
        if (removeBtn) {
          removeBtn.addEventListener("click", () => {
            Cart.removeItem(this.lineItemKey).then(() => {
              this.removeItemEl();
            });
          });
        }
      }

      /**
       * Remove line item from DOM with fade-out animation
       * Updates indices of remaining items after removal
       */
      removeItemEl() {
        const el = this;
        requestAnimationFrame(() => {
          el.classList.add("fade-out");
          el.addEventListener(
            "transitionend",
            () => {
              const index = el.dataset.index;
              const allLineItems = document.querySelectorAll("line-item");
              allLineItems.forEach((item) => {
                const itemIndex = parseInt(item.dataset.index, 10);
                if (itemIndex > index) {
                  item.dataset.index = itemIndex - 1;
                }
              });

              el.parentElement.remove();
              Cart.updateCheckoutTotal(Cart.cart.total_price, Cart.cart.currency);
            },
            {
              once: true,
            },
          );
        });
      }
    },
  );
}

// ===================
// FREE DELIVERY INFORMATION
// ===================

if (!customElements.get("free-delivery")) {
  customElements.define(
    "free-delivery",
    class FreeDelivery extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        this.progressBar = this.querySelector(".free-delivery_status-bar");
        this.textElement = this.querySelector(".free-delivery_text");
        this.Options = JSON.parse(this.getAttribute("data-settings"));

        this.thresholdValue = this.Options.thresholdValue;
        this.thresholdName = this.Options.thresholdName;
        this.threshold2Show = this.Options.threshold2Show;
        this.threshold2Value = this.Options.threshold2Value;
        this.threshold2Name = this.Options.threshold2Name;
        this.deliveryStatus = this.dataset.deliveryStatus === "true"; // force a boolean value

        document.addEventListener("cart:loaded", this.updateProgress);
      }

      updateProgress = (event) => {
        if (!this.deliveryStatus) {
          // only run if not an active free delivery subscriber
          const cart = event.detail.cart;
          let message;
          let newProgress = "100%";
          let bgColor = "var(--c-grey)";

          // update the cart free delivery status
          if (cart.total_price >= this.threshold2Value && this.threshold2Show) {
            message = `<span class="success">Enjoy! You've unlocked <b>FREE ${this.threshold2Name}</b>.</span>`;
            newProgress = "100";
            bgColor = "var(--c-success)";
          } else if (cart.total_price >= this.thresholdValue) {
            message = `<span class="success">You've unlocked <b>FREE ${this.thresholdName}</b>.</span>`;
            newProgress = "100";
            bgColor = "var(--c-success)";
            if (this.threshold2Show) {
              message += `<br>Spend <b>${Cart.formatMoney(this.threshold2Value - cart.total_price)}</b> more for FREE ${this.threshold2Name}.`;
              newProgress = Math.min(100, (cart.total_price / this.threshold2Value) * 100);
              bgColor = "var(--c-grey)";
            }
          } else {
            message = `Spend <b>${Cart.formatMoney(this.thresholdValue - cart.total_price)}</b> more for FREE ${this.thresholdName}.`;
            newProgress = Math.min(100, (cart.total_price / this.thresholdValue) * 100);
            bgColor = "var(--c-grey)";
          }

          this.textElement.innerHTML = message;
          this.progressBar.style.setProperty("--pc-progress", `${newProgress}%`);
          this.progressBar.style.setProperty("--bg-color", `${bgColor}`);

          // dispatch a custom dleivery status updated event for pdp page to pick up
          const deliveryEvent = new CustomEvent("delivery:statusUpdated", {
            bubbles: true,
            detail: {
              thresholdReached: cart.total_price >= this.thresholdValue,
              threshold2Reached: this.threshold2Show && cart.total_price >= this.threshold2Value,
              threshold2Show: this.threshold2Show,
              thresholdValue: this.thresholdValue,
              thresholdName: this.thresholdName,
              threshold2Value: this.threshold2Value,
              threshold2Name: this.threshold2Name,
            },
          });
          document.dispatchEvent(deliveryEvent);
        }
      };
    },
  );
}

// ===================
// CART UPSELLS
// ===================
/**
 * CartUpsells - Manages cart upsell accordion functionality
 * Handles toggle behavior and auto-opens on large viewports
 * Usage: <cart-upsells>...</cart-upsells>
 */
if (!customElements.get("cart-upsells")) {
  customElements.define(
    "cart-upsells",
    class CartUpsells extends HTMLElement {
      connectedCallback() {
        this.header = this.querySelector('.cart-upsells h2');
        this.carousel = this.querySelector('.cart-upsells--carousel');
        this.icon = this.querySelector('.cart-upsells h2 svg');

        if (this.header && this.carousel && this.icon) {
          this.autoOpenOnLargeScreens()
          this.header.addEventListener('click', () => this.toggleUpsells());
        }
      }

      /**
       * Toggle the visibility of the upsell carousel
       */
      toggleUpsells() {
        this.carousel.classList.toggle('active');
        this.icon.classList.toggle('active');
      }

      showUpsells() {
        this.carousel.classList.add('active');
        this.icon.classList.add('active');
      }

      hideUpsells() {
        this.carousel.classList.remove('active');
        this.icon.classList.remove('active');
      }

      /**
       * Auto-open the upsells accordion on large viewports (>= 1000px height) or low item counts
       */
      autoOpenOnLargeScreens() {
        // console.log("Auto-open upsells :: checked");
        const viewportHeight = window.innerHeight;
        const itemCount = Cart?.cart?.items?.length || 0;
        if (viewportHeight >= 1000 || (viewportHeight < 1000 && itemCount < 2)) {
          this.showUpsells();
          // console.log("Auto-open upsells :: show", viewportHeight, itemCount);
        } else {
          this.hideUpsells();
          // console.log("Auto-open upsells :: hide", viewportHeight, itemCount);
        }
      }
    },
  );
}

// ===================
// iWish Customisations
// ===================

class iWishCustom {
  constructor() {
    this.counterElement = document.querySelector(".iwish-counter");
    this.iconElement = document.querySelector(".iwishPage.header_icon");

    // run once at start
    this.updateClass();

    // observe future changes
    if (this.counterElement) {
      this._counterObserver = new MutationObserver(() => this.updateClass());
      this._counterObserver.observe(this.counterElement, {
        childList: true, // watch for text node changes
        characterData: true, // watch character data changes
        subtree: true, // include descendants (text nodes)
      });
    }
  }

  updateClass() {
    if (!this.counterElement || !this.iconElement) return;
    const count = parseInt((this.counterElement.textContent || "").trim(), 10);
    this.iconElement.classList.toggle("wishlisted", !isNaN(count) && count > 0);
  }
}

new iWishCustom(); // make sure you instantiate with ()

// ===================
// ===================
// Global functions and logic
// ===================
// ===================

function openCartDrawerIfNotOnCartPage() {
  if (theme.pageType != "cart") {
    Cart.getLineItems().then(() => {
      const drawer = document.getElementById("cartDrawer");
      const cartSection = drawer.querySelector("#side_menu-cart");
      const isActive = cartSection.classList.contains("active");
      isActive ? "" : cartSection.click();
      if (drawer) drawer.open();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const rawData = sessionStorage.getItem("GK::clickedProductId");
  if (!rawData) return;

  try {
    const clickedProductData = JSON.parse(rawData);
    const currentPath = location.pathname;
    const previousPath = document.referrer ? new URL(document.referrer).pathname : "";

    if (clickedProductData.path !== currentPath && clickedProductData.path !== previousPath) {
      sessionStorage.removeItem("GK::clickedProductId");
    }
  } catch (e) {
    console.error("Failed to parse GK::clickedProductId:", e);
    sessionStorage.removeItem("GK::clickedProductId"); // cleanup bad data
  }
});

document.addEventListener("cart:itemsAdded", openCartDrawerIfNotOnCartPage);

// ===================
// Recently Viewed
// ===================

import RecentlyViewed from "./RecentlyViewed.js";
const recentlyViewed = new RecentlyViewed();
recentlyViewed.checkProductListDates();

if (recentlyViewed.hasRecentlyViewed() && !document.querySelector("recently-viewed") && document.getElementById("cartDrawer")) {
  document.getElementById("side_menu-recents").style.display = "block";
  const recentlyViewedEl = document.createElement("recently-viewed");
  let sideCart = document.getElementById("cartDrawer");

  sideCart.insertBefore(recentlyViewedEl, sideCart.querySelector(".drawer-close"));
  import("./RecentlyViewedElement.js");
} else if (document.querySelector("recently-viewed")) {
  import("./RecentlyViewedElement.js").then(() => {
    customElements.whenDefined("recently-viewed").then(() => {
      const el = document.querySelector("recently-viewed");
      if (el && typeof el._renderProducts === "function") {
        el._renderProducts();
        document.querySelector("#recently-viewed-section").style.display = "grid";
      }
    });
  });
}

// ===================
// keyboard shortcuts
// ===================

class KeyboardShortcutsManager {
  constructor() {
    this.shortcuts = [];
    this.enabled = true;
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  registerShortcut(keys, callback, options = {}) {
    this.shortcuts.push({ keys, callback, ...options });
  }

  handleKeyDown(event) {
    if (!this.enabled) return;

    // Don't trigger inside form inputs unless explicitly allowed
    const target = event.target;
    const isTypingArea = ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable;
    if (isTypingArea && !event.altKey) return;

    const keyCombo = this.normalizeKeyCombo(event);
    this.shortcuts.forEach((shortcut) => {
      if (shortcut.keys === keyCombo) {
        event.preventDefault();
        shortcut.callback(event);
      }
    });
  }

  normalizeKeyCombo(event) {
    const parts = [];
    if (event.ctrlKey) parts.push("ctrl");
    if (event.altKey) parts.push("alt");
    if (event.shiftKey) parts.push("shift");
    parts.push(event.key.toLowerCase());
    return parts.join("+");
  }

  enable() {
    this.enabled = true;
  }
  disable() {
    this.enabled = false;
  }
}

const shortcuts = new KeyboardShortcutsManager();

shortcuts.registerShortcut("ctrl+/", () => {
  document.querySelector("#header_search-icon")?.click();
});

shortcuts.registerShortcut("ctrl+c", () => {
  document.querySelector("#header_cart-icon")?.click();
});

shortcuts.registerShortcut("escape", () => {
  document.querySelector("page-overlay").closeAllOverlays();
});

shortcuts.registerShortcut("ctrl+h", () => {
  window.location.href = "/";
});

shortcuts.registerShortcut("ctrl+p", () => {
  window.location.href = "/account";
});

shortcuts.registerShortcut("enter", () => {
  const cartDrawer = document.getElementById("cartDrawer");
  const cartPageCheckoutBtn = document.getElementById("main-cart--button");

  if (cartPageCheckoutBtn || cartDrawer.getAttribute("aria-hidden") == false) {
    window.location.href = "/checkout";
  }
});

shortcuts.registerShortcut("ctrl+?", () => {
  //  open shortcuts info modal
});

// ===================
// Annoucement Carousel
// ===================
if (!customElements.get("announcement-bar")) {
  customElements.define(
    "announcement-bar",
    class AnnouncementCarousel extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        this.classList.add("splide");
        let transType = "loop";
        let autoplay = true;
        if (Shopify.designMode) {
          autoplay = false;
          transType = "slide";
        }

        this.splide = new window.Splide(this, {
          type: transType,
          autoplay: autoplay,
          interval: 5000,
          pagination: false,
        });

        this.splide.on("overflow", (isOverflow) => {
          this.splide.options = {
            ...this.splide.options,
            arrows: isOverflow,
            drag: isOverflow,
          };
        });

        this.splide.mount();
      }
    },
  );
}
