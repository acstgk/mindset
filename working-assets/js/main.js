/* global MutationObserver IntersectionObserver, Shopify, theme, clearTimeout sessionStorage location URL */
import Splide from "./splide.min.js";
window.Splide = Splide;
import RecentlyViewed from "./RecentlyViewed.js";

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

// ===================
// SLIDING DRAWER CLASS
// ===================
// requires a 'sliding drawer button'.
// requires a close

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
// elements just need the following infomation:
//  1.  class of .drawer-button
//  2.  data-target attribute equal to the drawer ID

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

document.addEventListener("DOMContentLoaded", () => {
  new SideMenuGenderSelector(".side_menu-header");
});

// ===================
// DRAWER MENU SUB MENU CONTROLS
// ===================

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

const drawer = document.getElementById("navDrawer");
const menuController = new SubMenuController(drawer);

// ===================
// PAGE OVERLAY CLASS
// ===================

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
// CART CLASS
// ===================

class CartAPI {
  constructor() {
    this.cart = {};
    this.loadCart = this.loadCart.bind(this);
    this.addItems = this.addItems.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.updateLineItem = this.updateLineItem.bind(this);
    this.dispatchCartUpdate = this.dispatchCartUpdate.bind(this);
    this.cartIcon = document.getElementById("header_cart-icon");
    this.loadCart();
  }

  // Dispatches a custom event when the cart data changes
  dispatchCartUpdate(eventName = "cart:updated") {
    const event = new CustomEvent(eventName, {
      bubbles: true, // Allow event to bubble up the DOM
      detail: { cart: this.cart },
    });
    document.dispatchEvent(event);
    console.log(`Custom event '${eventName}' dispatched`);
  }

  // get the cart data so we can include it with the custom event
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

  // == add one or more items to the cart ==
  // will accept:
  // 1: a single variant ID,
  // 2: an array of product ID's - [1211,2222,333]
  // 3: an array of cart objects - [{ id: 1211, quantity: 1 },{ id: 2222, quantity: 3 },{ id: 333, quantity: 2 },]

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

  // == remove an item from the cart ==
  // lineItemKey must be line item key or variant ID ( variant id will automatically remove first instance only)
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

  // == update a line in the cart==
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

  // == clear all items out of the cart and send the cart update event ==
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

  // == convert the money to the right format ==
  formatMoney(amount) {
    const format = window.theme.moneyFormat;
    const value = amount / 100;
    const formatted = format.replace("{{amount}}", value.toFixed(2));
    return formatted.replace(/\.00$/, ""); // only strip ".00", leave ".50" etc.
  }

  // == update the value in the checkout button ==
  updateCheckoutTotal(value) {
    let totalPoint = document.querySelector(".cart-total");
    if (value === 0) {
      totalPoint.parentElement.remove();
      Cart.getLineItems();
    } else {
      totalPoint.innerHTML = Cart.formatMoney(value);
    }
  }

  async getLineItems() {
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
    }
  }
}

window.Cart = new CartAPI();
export const Cart = window.Cart;

// ===================
// PREDICTIVE SEARCH
// ===================

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

class gkUtils {
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

window.gkUtils = new gkUtils();

// ===================
// DYNAMIC IMPORTS
// ===================

class ComponentLoader {
  static uninitializedLoaders = [];
  static sharedObserver = null;

  constructor(selector, importFn) {
    this.selector = selector;
    this.importFn = importFn;

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
          const Wrapper = class extends Ctor {};
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

// dynamically import modules required by the page
window.ComponentLoader = ComponentLoader; // Export for global access
new ComponentLoader("hero-carousel", () => import("./HeroCarousel.js"));
new ComponentLoader("productcard-carousel", () => import("./ProductCarousel.js"));
new ComponentLoader("countdown-timer", () => import("./CountdownTimer.js"));
new ComponentLoader("product-recommendations", () => import("./ProductRecommendations.js"));
new ComponentLoader("personal-recommendations", () => import("./PersonalisedCarousel.js"));
new ComponentLoader("content-accordian", () => import("./ContentAccordian.js"));
new ComponentLoader("bnpl-options", () => import("./BnplOptions.js"));
new ComponentLoader("size-table", () => import("./SizeTable.js"));
new ComponentLoader("ometria-form", () => import("./OmetriaForm.js"));
new ComponentLoader("custom-video-controls", () => import("./CustomVideo.js"));

// with product cards in the cart drawer, always load the product-card module even without the scroll listener/observer
if (!customElements.get("product-card")) {
  import("./ProductCard.js").then((module) => {
    if (!customElements.get("product-card")) {
      customElements.define("product-card", module.default);
    }
  });
}

// ===================
// CART LINE ITEMS
// ===================

if (!customElements.get("line-item")) {
  customElements.define(
    "line-item",
    class LineItem extends HTMLElement {
      connectedCallback() {
        this.lineItemKey = this.dataset.key;
        this._bindQuantityControls();
      }

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
// Update the product localstorage object
// ===================

const recentlyViewed = new RecentlyViewed();
recentlyViewed.checkProductListDates();

// ===================
// Render the Recently Viewed element and import JS data
// ===================

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
