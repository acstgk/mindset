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
        this.side = this.getAttribute("side");
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
// PAGE OVERLAY CLASS
// ===================

if (!customElements.get("page-overlay")) {
  customElements.define(
    "page-overlay",
    class PageOverlay extends HTMLElement {
      connectedCallback() {
        this.addEventListener("click", this._closeAll.bind(this));
      }

      _closeAll() {
        document.body.classList.remove("no-scroll");
        const drawers = document.querySelectorAll("slide-drawer");
        drawers.forEach((drawer) => {
          if (drawer.getAttribute("aria-hidden") == "false") {
            drawer.close();
          }
        });
      }
    }
  );
}
