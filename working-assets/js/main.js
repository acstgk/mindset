/* global Shopify, theme, iWish */

import Splide from "./splide.min.js";
import { SplideUtil } from "./SplideUtil.js";

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

        this.splide = new Splide(this, {
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
// Hero Carousel
// ===================

if (!customElements.get("hero-carousel")) {
  customElements.define(
    "hero-carousel",
    class HeroCarousel extends HTMLElement {
      constructor() {
        super();
        this.splide = null;
      }

      connectedCallback() {
        SplideUtil.splideHTML(this);
        this.splide = new Splide(this, {
          type: "fade",
          autoplay: true,
          interval: 5000,
          arrows: false,
          rewind: true,
          lazyLoad: "nearby",
          preloadPages: 1,
          pauseOnHover: true,
        });

        this.splide.on("overflow", (isOverflow) => {
          this.splide.options = {
            ...this.splide.options,
            pagination: isOverflow,
            drag: isOverflow,
          };
        });

        this.splide.on("pagination:mounted", (data) => {
          if (data.items.length > 1) {
            data.items.forEach((item) => {
              item.button.textContent = "0" + String(item.page + 1);
            });
          }
        });

        this.splide.on("ready", () => {
          const firstSlide = this.splide.root.querySelector("#splide01-slide01");
          this.loadAndPlayVideo(firstSlide);
        });

        this.splide.on("active", (slide) => {
          this.loadAndPlayVideo(slide.slide);
        });

        this.splide.on("resized", () => {
          const slideIndex = this.splide.index;
          const slideEl = this.splide.Components.Slides.get(slideIndex)[slideIndex].slide;

          this.loadAndPlayVideo(slideEl);
        });

        this.splide.on("inactive", (slide) => {
          const mobVid = slide.slide.querySelector(".mob-only");
          const deskVid = slide.slide.querySelector(".mob-hide");
          const width = window.innerWidth;

          if (width < 768) {
            mobVid.pause();
          } else {
            deskVid.pause();
          }
        });

        this.splide.mount();
      }

      loadAndPlayVideo(slide) {
        if (!slide) return;

        const width = window.innerWidth;
        let video = width < 768 ? slide.querySelector(".mob-only") : slide.querySelector(".mob-hide");

        if (!video) return;

        const source = video.querySelector("source[data-src-lazy]");
        if (source && !source.src) {
          source.src = source.getAttribute("data-src-lazy");
          video.load();
        }

        video.play();
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

    localStorage.setItem("menu_gender", gender);

    const siblings = [...button.parentElement.children];
    siblings.forEach((el) => el.classList.toggle("active", el === button));

    menuController.resetMenus();
  }

  _restoreLastSelection() {
    const lastGender = localStorage.getItem("menu_gender");
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
        this._closeLoop(".mqatb-modal");
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
// Product Cards
// ===================

if (!customElements.get("product-card")) {
  customElements.define(
    "product-card",
    class ProductCard extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        this._init();
        this._moveMobileQB();
      }

      _init() {
        // add click listeners to all the desktop quick add to basket buttons
        const qatbButtons = this.querySelectorAll(".qatb-btn:not([data-click-added])") || [];

        qatbButtons.forEach((btn) => {
          btn.setAttribute("data-click-added", "true");
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            const targetButton = e.currentTarget;
            const targetSize = targetButton.innerText;

            // remove any existing cart errors
            const errors = targetButton.closest(".qatb-btns").parentElement.querySelectorAll(".cart-error");
            errors.forEach((error) => {
              error.remove();
            });

            targetButton.innerHTML = `<div class="loader"></div>`; // add the loading animation

            //add the product/s
            Cart.addItems(targetButton.dataset.vId)
              .then(() => {
                //if success
                targetButton.innerHTML = targetSize;
                //close the modal so cart can open
                const modal = document.getElementById(`mqatb-${this.dataset.prodId}`);
                modal ? modal.classList.remove("active") : "";
              })
              .catch((error) => {
                // if error
                targetButton.innerHTML = targetSize;

                // display an error message next to the qatb buttons
                const errorBox = document.createElement("div");
                errorBox.className = "cart-error warning";
                errorBox.textContent = error.description || "Sorry, something went wrong.";
                targetButton.closest(".qatb-btns").before(errorBox);
              });
          });
        });

        // add click listeners to the open mobile qatb button
        const openmqatbBtn = this.querySelector(".mqatb-show:not([data-click-added])");
        if (!openmqatbBtn) return;
        openmqatbBtn.setAttribute("data-click-added", "true");
        openmqatbBtn.addEventListener("click", (event) => this._openMobileQB(event));

        // add click listeners to the Iwish buttons
        const el = this.querySelector(".iWishColl:not([data-click-added])");
        el.setAttribute("data-click-added", "true");
        if (typeof iWish !== "undefined" && iWish.iwishAddClick) {
          iWish.iwishAddClick(el);
        }

        // add click listeners to the modal close button
        const close = this.querySelector(".mqatb-close");
        close.addEventListener("click", (event) => this._closeMobileQB(event));
      }

      _openMobileQB(event) {
        const modalID = event.target.dataset.target;
        const modalEl = document.getElementById(modalID);
        modalEl.classList.add("active");
        modalEl.setAttribute("aria-hidden", "false");
        document.querySelector("page-overlay").openThis();
      }

      _closeMobileQB(event) {
        const modal = event.target.closest(".mqatb-modal");
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.querySelector("page-overlay").closeThis();
      }

      _moveMobileQB() {
        const modal = this.querySelector(".mqatb-modal");
        if (!modal) return;
        const body = document.body;
        body.appendChild(modal);
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
      console.log("Cart JSON data loaded:", data);
      this.cart = data;
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
      console.log("Item/s added successfully:", data);
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
      console.log("Item removed:", data);
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
      console.log("Line Item Updated:", data);
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
      console.log("Cart cleared:", data);
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
      const newDrawer = doc.querySelector("#cartDrawer");
      const existingDrawer = document.querySelector("#cartDrawer");

      if (newDrawer && existingDrawer) {
        const firstListItem = newDrawer.querySelector("li");
        if (firstListItem) {
          firstListItem.classList.add("fade-in", "no-height");
        }

        const closeBtn = existingDrawer.querySelector(".drawer-close");
        existingDrawer.innerHTML = newDrawer.innerHTML;
        if (closeBtn) existingDrawer.appendChild(closeBtn);
        const emptyContent = existingDrawer.querySelector("div.cart_items-list");
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
const Cart = window.Cart;

// ===================
// CART LINE ITEMS
// ===================

if (!customElements.get("line-item")) {
  customElements.define(
    "line-item",
    class LineItem extends HTMLElement {
      connectedCallback() {
        this.lineItemKey = this.dataset.key;
        this.itemIndex = this.dataset.index;
        this._bindQuantityControls();
      }

      _bindQuantityControls() {
        let lastQty = 0;
        const selector = this.querySelector(".quantity-selector");
        const input = selector.querySelector(".qty-input");
        const lineItemKey = this.lineItemKey;

        // Handle +/- buttons
        selector.querySelectorAll("[data-new-qty]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const newQty = parseInt(btn.dataset.newQty, 10);
            if (!isNaN(newQty)) {
              Cart.updateLineItem(lineItemKey, newQty).then(() => {
                // remove the element from the DOM if newQty is zero
                if (newQty === 0) this.removeItemEl();

                // update the quantity selector values
                input.value = newQty;
                selector.querySelector(".quantity-minus").dataset.newQty = newQty - 1;
                selector.querySelector(".quantity-plus").dataset.newQty = newQty + 1;

                // update the line total.
                this.querySelector(".cart_item-total").innerHTML = Cart.formatMoney(Cart.cart.items[this.itemIndex].line_price, Cart.cart.currency);

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
            Cart.updateLineItem(lineItemKey, newQty);
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
            Cart.removeItem(lineItemKey).then(() => {
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
// Global functions and logic
// ===================

function openCartDrawerIfNotOnCartPage() {
  if (theme.pageType != "cart") {
    Cart.getLineItems().then(() => {
      const drawer = document.getElementById("cartDrawer");
      if (drawer) drawer.open();
    });
  }
}

document.addEventListener("cart:itemsAdded", openCartDrawerIfNotOnCartPage);

// ===================
// DYNAMIC IMPORTS
// ===================


class LazyComponentLoader {
  /**
   * @param {string} selector - Custom element selector (e.g. 'product-carousel')
   * @param {Function} importFn - Function that returns the dynamic import (e.g. () => import('./ProductCarousel.js'))
   */

  constructor(selector, importFn) {
    this.selector = selector;
    this.importFn = importFn;
    this.element = document.querySelector(selector);
    this.tagName = selector;

    if (!this.element || customElements.get(this.tagName)) return;

    this.init();
  }

  init() {
    this.checkAndLoad = this.checkAndLoad.bind(this);
    this.checkAndLoad();
    window.addEventListener("scroll", this.checkAndLoad, { passive: true });
    window.addEventListener("resize", this.checkAndLoad);
  }

  checkAndLoad() {
    const rect = this.element.getBoundingClientRect();
    if ((rect.top) - window.innerHeight <= 200) {
      this.loadAndDefine();
      window.removeEventListener("scroll", this.checkAndLoad);
      window.removeEventListener("resize", this.checkAndLoad);
    }
  }

  loadAndDefine() {
    this.importFn().then((module) => {
      if (!customElements.get(this.tagName)) {
        customElements.define(this.tagName, module.default);
      }
    });
  }
}

new LazyComponentLoader("product-carousel", () => import("./ProductCarousel.js"));
new LazyComponentLoader("content-accordian", () => import("./ContentAccordian.js"));


