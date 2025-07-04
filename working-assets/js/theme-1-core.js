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
      }

      open() {
        this.classList.remove(this.side);
        document.body.classList.add("no-scroll");
        this.setAttribute("open", "");
      }

      close() {
        this.classList.add(this.side);
        document.body.classList.remove("no-scroll");
        this.removeAttribute("open");
      }
    }
  );
}

document.querySelectorAll(".drawer-button").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    const drawer = document.getElementById(
      event.target.closest("button").getAttribute("data-target")
    );
    drawer.open();
  });
});

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
          let side = drawer.getAttribute("side");
          if (!drawer.classList.contains(side)) {
            drawer.close();
          }
        });
      }
    }
  );
}
