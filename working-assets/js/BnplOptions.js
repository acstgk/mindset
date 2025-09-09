// ===================
// Dynamic BNPL Modals
// ===================

export default class BnplOptions extends HTMLElement {
  connectedCallback() {
    this.klarnaLink = this.querySelector(".klarna-link");
    this.clearpayLink = this.querySelector(".clearpay-link");
    this.klarnaLink.addEventListener("click", (event) => this._openmodal("klarna", event));
    this.clearpayLink.addEventListener("click", (event) => this._openmodal("clearpay", event));

    this.clearpayURL = "https://thegymking.com/pages/clearpay-terms-conditions";
    this.klarnaURL = "https://thegymking.com/pages/klarna-terms-conditions";
  }

  async _openmodal(option, event) {
    event.preventDefault();

    const targetModal = `.bnpl-modal.${option}`;
    console.log(targetModal);

    document.querySelector(targetModal) ? this._showModal(targetModal) : this._createModal(option);
  }

  async _getContent(targetUrl) {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // parse the returned data parsing into HTML
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const content = doc.querySelector(".PageContent");

    return content;
  }

  async _createModal(option) {
    //create the modal element
    const modal = document.createElement("div");
    modal.className = "bnpl-modal modal fade-in";
    modal.classList.add(option);
    modal.setAttribute("aria-hidden", "false");

    // add the close button
    const closeBtn = document.createElement("button");
    closeBtn.classList.add("modal-close");
    closeBtn.setAttribute("aria-label", "Close modal");
    closeBtn.innerHTML =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='Icon'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M18 6l-12 12' /><path d='M6 6l12 12' /></svg>";
    closeBtn.addEventListener("click", () => document.querySelector("page-overlay").closeAllOverlays());

    //get the modal content from the T&C's page
    const targetUrl = option === "klarna" ? this.klarnaURL : this.clearpayURL;
    const content = await this._getContent(targetUrl);
    modal.classList.add("active");
    modal.innerHTML = content.innerHTML;
    modal.appendChild(closeBtn);

    //add the modal to the DOM
    document.querySelector("page-overlay").openThis();
    document.body.appendChild(modal);
  }

  _showModal(targetModal) {
    document.querySelector("page-overlay").openThis();
    const el = document.querySelector(targetModal);
    el.classList.add('active');
    el.setAttribute("aria-hidden", "false");
  }
}
