if (!customElements.get("address-form")) {
  customElements.define(
    "address-form",
    class AddressForm extends HTMLElement {
      connectedCallback() {
        this.id = this.dataset.address;
        this.openButton = document.getElementById(`${this.id}-form-button`);
        this.openButton.addEventListener("click", this._openThis);
        this.closeButton = this.querySelector("#address-form-close");
        this.closeButton.addEventListener("click", this._closeThis);
      }

      _openThis = () => {
        console.log("open");
        this.classList.toggle("active");
        this.openButton.style.display = "none"
      };

      _closeThis = (event) => {
        event.preventDefault();
        console.log("close");
        this.classList.toggle("active");
        this.openButton.style.display = "inline-block"
      };
    },
  );
}
