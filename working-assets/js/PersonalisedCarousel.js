// ===================
// Personalised Product Recommendations
// ===================

export default class PersonalRecommendations extends HTMLElement {
  connectedCallback() {
    this.noscript = this.querySelector("noscript");
    this.fallbackHtml = this.noscript.textContent || this.noscript.innerText;
    this._initCarousel();
  }

  _initCarousel = () => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = this.fallbackHtml;
    this.insertBefore(tempDiv.childNodes[1], this.noscript);

    // Optionally remove the <noscript> element
    this.removeChild(this.noscript);
  };
}
