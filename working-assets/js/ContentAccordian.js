// ===================
// CONTENT ACCORDIAN
// ===================
// elements just need the following:
//  1.  .accordian-items > .accordian-header + .accordian-content

export default class ContentAccordian extends HTMLElement {
  constructor() {
    super();
    this._handleHeaderClick = this._handleHeaderClick.bind(this);
  }

  connectedCallback() {
    this.headers = this.querySelectorAll(".accordian-header");
    this.contents = this.querySelectorAll(".accordian-content");
    this._addCloseButtons();

    this.headers.forEach((header) => {

      header.addEventListener("click", this._handleHeaderClick);
      if (header.classList.contains('active')) {
        header.setAttribute("aria-expanded", "true");
      } else {
        header.setAttribute("aria-expanded", "false");
      }
    });

    this.contents.forEach((content, index) => {
      content.classList.add('no-animation');
      if (this.headers[index].classList.contains('active')) {
        content.setAttribute("aria-hidden", "false");
      } else {
        content.setAttribute("aria-hidden", "true");
      }
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

    if (!content || !content.classList.contains("accordian-content")) return;

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
      setTimeout(() => {
        header.scrollIntoView({
          behavior: "smooth",
        })
      }, 200)
    }
  }
}
