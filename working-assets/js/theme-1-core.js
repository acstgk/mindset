if (!customElements.get("slide-drawer")) {
  customElements.define(
    "slide-drawer",
    class SlideDrawer extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        const side = this.getAttribute('side');
        this.classList.add(side);

      }
    }
  );
}
