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

        this.addEventListener("touchstart", (e) => {
          this._startX = e.touches[0].clientX;
        });

        this.addEventListener("touchend", (e) => {
          this._endX = e.changedTouches[0].clientX;
          this._handleSwipe();
        });
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
      }

      close() {
        document.body.classList.remove("no-scroll");
        this.setAttribute("aria-hidden", "true");
      }
    }
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
    event.preventDefault();
    const drawer = document.getElementById(
      event.target.closest(".drawer-button").getAttribute("data-target")
    );
    drawer.open();
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
    }
  );
}

// ===================
// DRAWER MENU SUB MENU CONTROLS
// ===================

class SubMenuController {
  constructor(drawerElement) {
    this.drawer = drawerElement;
    this.activeMenus = new Set();

    this.subMenuButtons = this.drawer.querySelectorAll(
      ".side_menu-sub-menu-button"
    );
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
        closeBtn.addEventListener("click", () =>
          this.closeSubMenu(menu.dataset.subMenu)
        );
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
    return this.drawer.querySelector(
      `.side_menu-sub-menu[data-sub-menu="${handle}"]`
    );
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
// CONTENT ACCORDIAN
// ===================
// elements just need the following:
//  1.  .accordian-items > .accordian-header + .accordian-content

if (!customElements.get("content-accordian")) {
  customElements.define(
    "content-accordian",
    class ContentAccordian extends HTMLElement {
      constructor() {
        super();
        this._handleHeaderClick = this._handleHeaderClick.bind(this);
      }

      connectedCallback() {
        this.headers = this.querySelectorAll(".accordian-header");
        this.contents = this.querySelectorAll(".accordian-content");
        this._addCloseButtons();

        this.headers.forEach((header) => {
          header.setAttribute("aria-expanded", "false");
          header.addEventListener("click", this._handleHeaderClick);
        });

        this.contents.forEach((content) => {
          content.setAttribute("aria-hidden", "true");
        });
      }

      _addCloseButtons() {
        const iconHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="Icon Icon--close rotate135">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M18 6l-12 12"></path>
            <path d="M6 6l12 12"></path>
          </svg>`;

        this.headers.forEach((header) => {
          const iconContainer = document.createElement("span");
          iconContainer.innerHTML = iconHTML;
          header.appendChild(iconContainer);
        });
      }

      _handleHeaderClick(event) {
        const header = event.currentTarget;
        const content = header.nextElementSibling;

        if (!content || !content.classList.contains("accordian-content"))
          return;

        const isOpen = header.classList.contains("active");

        this.headers.forEach((h) => {
          h.classList.remove("active");
          h.setAttribute("aria-expanded", "false");
        });

        this.contents.forEach((c) => {
          c.setAttribute("aria-hidden", "true");
        });

        if (!isOpen) {
          header.classList.add("active");
          header.setAttribute("aria-expanded", "true");
          content.setAttribute("aria-hidden", "false");
        }
      }
    }
  );
}

// ===================
// Product Cards
// ===================
if (!customElements.get("product-card")) {
  customElements.define(
    "product-card",
    class ProductCard extends HTMLElement {
      constructor() {
        super();
        //this.observeDOMChanges();
      }

      connectedCallback() {
        this._init();
        this._moveMobileQB();
      }

      _init() {
        // add click listeners to all the desktop quick add to basket buttons
        const desktopButtons =
          this.querySelectorAll(".qatb-btn:not([data-click-added])") || [];

        desktopButtons.forEach((btn) => {
          btn.setAttribute("data-click-added", "true");
          btn.addEventListener("click", (e) => {
            console.log("Add to Bag clicked", e.currentTarget.dataset.vId);
          });
        });

        // add click listeners to the open mobile qatb button
        const openmqatbBtn = this.querySelector(
          ".mqatb-show:not([data-click-added])"
        );
        openmqatbBtn.setAttribute("data-click-added", "true");
        openmqatbBtn.addEventListener("click", (event) => this._openMobileQB(event));


        // add click listeners to the mobile quick add to basket buttons


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
        const modalID = event.target.dataset.id;
        const modalEl = document.getElementById(modalID);
        modalEl.classList.add("active");
        modalEl.setAttribute("aria-hidden", "false");
        document.querySelector("page-overlay").openThis();
      }

      _closeMobileQB(event) {
        const modal = event.target.closest('.mqatb-modal');
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.querySelector("page-overlay").closeThis();
      }

      _moveMobileQB() {
        const modal = this.querySelector(".mqatb-modal");
        const body = document.body;
        body.appendChild(modal);
      }
    }
  );
}
