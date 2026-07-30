// ===================
// Dynamic BNPL Modals
// ===================

export default class BnplOptions extends HTMLElement {
  connectedCallback() {
    this.bnplURL = "https://thegymking.com/pages/bnpl";
    const infoLink = this.querySelector("a");
    this.productPriceDisplay = window.product?.productPrice;
    this.productPriceValue = window.product?.productPriceRaw;
    if (infoLink) {
      infoLink.addEventListener("click", (event) => this._openmodal(event));
    }
    this.querySelectorAll('[data-bnpl]').forEach(btn => {
      btn.addEventListener("click", (event) => this._openmodal(event, btn.dataset.bnpl));
    });
  }

  async _openmodal(event, provider) {
    event.preventDefault();
    const existingModal = document.querySelector('.bnpl-modal');
    if (existingModal) {
      this._activateAccordionTab(existingModal, provider);
      this._showModal(existingModal);
    } else {
      this._createModal(provider);
    }
    document.body.classList.add("no-scroll");
  }

  async _createModal(provider) {
    //create the modal element
    const modal = document.createElement("div");
    modal.className = "bnpl-modal modal fade-in";
    modal.setAttribute("aria-hidden", "false");

    // add the close button
    const closeBtn = document.createElement("button");
    closeBtn.classList.add("modal-close");
    closeBtn.setAttribute("aria-label", "Close modal");
    closeBtn.innerHTML =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='Icon'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M18 6l-12 12' /><path d='M6 6l12 12' /></svg>";
    closeBtn.addEventListener("click", () => document.querySelector("page-overlay").closeAllOverlays());

    // add the content div and loader

    const payments = this.splitPayments(this.productPriceValue, 3);
    const payin3Content = `<p> Based on a purchase price of <b> ${this.productPriceDisplay}</b>, you could pay in 3 interest free instalments of <b> ${window.languages.currency + (this.productPriceValue / 300).toFixed(2)}</b>.</p>
        <div class="payments">
          <div class="payin pc33">Pay&nbsp;${window.languages.currency + payments[0]} Now</div>
          <div class="payin pc66">Pay&nbsp;${window.languages.currency + payments[1]} in 30 days</div>
          <div class="payin pc100">Pay&nbsp;${window.languages.currency + payments[2]} in 60 days</div>
        </div>`;

    const payments4 = this.splitPayments(this.productPriceValue, 4);
    const payin4Content = `<p> Based on a purchase price of <b> ${this.productPriceDisplay}</b>, you could pay in 4 interest free instalments of <b> ${window.languages.currency + (this.productPriceValue / 400).toFixed(2)}</b>.</p>
        <div class="payments">
          <div class="payin pc25">Pay&nbsp;${window.languages.currency + payments4[0]} Now</div>
          <div class="payin pc50">Pay&nbsp;${window.languages.currency + payments4[1]} in 2 weeks</div>
          <div class="payin pc75">Pay&nbsp;${window.languages.currency + payments4[2]} in 4 weeks</div>
          <div class="payin pc100">Pay&nbsp;${window.languages.currency + payments4[3]} in 6 weeks</div>
        </div>
         <img src="https://cdn.shopify.com/s/files/1/1659/8997/files/clearpay-lightbox.svg?v=1784883316" alt="clearpay terms">
        `;

    let klarnaContent
    if (this.productPriceValue < 3000) {
      klarnaContent = `<p>Based on a purchase price of <b>${this.productPriceDisplay}</b>, pay nothing today and then <b>${this.productPriceDisplay}</b> in 30 days.</p>
       <div class="payments">
        <div class="payin pc0">Pay&nbsp;${window.languages.currency + '0.00'} Now</div>
        <div class="payin pc100">Pay&nbsp;${this.productPriceDisplay} in 30 days</div>
        </div>`;
    } else {
      klarnaContent = payin3Content;
    }


    const contentEl = document.createElement("div");
    contentEl.className = "bnpl-modal--content";
    contentEl.innerHTML = `
        <h2 class="emphasis"> Buy Now Pay Later</h2>
          <content-accordian>
            <div class="accordian-items">
              <div class="accordian-header accent-bg active" aria-controls="accordian-content-klarna" role="button" tabindex="0"><div style="display:flex; align-items:center;">${this.querySelector('.icon--klarna').outerHTML}&nbsp;Klarna</div></div>
              <div class="accordian-content no-animation rtf active" id="accordian-content-klarna">
                ${klarnaContent}
                <p>Klarna's Pay in 30 days and Pay in 3 are unregulated credit agreements. Borrowing more than you can afford or paying late may negatively impact your financial status and ability to obtain credit. 18+, UK residents only. Subject to status. <a href="https://cdn.klarna.com/1.0/shared/content/legal/terms/en-GB/payin30bycard" target="_blank">Terms and conditions</a> and late fees apply</p>
              </div>
            </div>
            <div class="accordian-items">
              <div class="accordian-header accent-bg" aria-controls="accordian-content-clearpay" role="button" tabindex="0"><div style="display:flex; align-items:center;">${this.querySelector('.icon--clearpay').outerHTML}&nbsp;Clearpay</div></div>
              <div class="accordian-content no-animation rtf" id="accordian-content-clearpay">
                ${payin4Content}
                <p>Clearpay is unregulated credit. Borrowing more than you can afford or paying late may negatively impact your financial status and ability to obtain credit. 18+, UK residents only. Subject to status.  <a href="https://clearpay.co.uk/terms" target="_blank">Terms and conditions</a> and late fees apply</p>
              </div>
            </div>
            <div class="accordian-items">
              <div class="accordian-header accent-bg" aria-controls="accordian-content-paypal" role="button" tabindex="0"><div style="display:flex; align-items:center;">${this.querySelector('.icon--paypal').outerHTML}&nbsp;PayPal</div></div>
              <div class="accordian-content no-animation rtf" id="accordian-content-paypal">
                ${payin3Content}
                <p>PayPal Pay in 3 is unregulated credit subject to status. UK Residents only. <a href="https://www.paypal.com/uk/webapps/mpp/paypal-payin3/faq" target="_blank">18+ terms </a>apply.</p>
              </div>
            </div>
          </content-accordian>
    `;
    modal.append(contentEl);
    modal.appendChild(closeBtn);

    //add the modal to the DOM
    document.body.appendChild(modal);
    if (provider) {
      this._activateAccordionTab(modal, provider);
    }
    this._showModal(modal);

    // inject custom css
    const styleEl = document.createElement("style");
    styleEl.textContent = `
        .payin.pc0{ --deg: 0%; }
      .payin.pc25{ --deg: 25%; }
      .payin.pc33{ --deg: 33.3%; }
      .payin.pc50{ --deg: 50%; }
      .payin.pc66{ --deg: 66.6%; }
      .payin.pc75{ --deg: 75%; }
      .payin.pc100{ --deg: 100%; }

      .payin:before {
        content: "";
        display: block;
        width: 60px;
        height: 60px;
        margin-bottom: 1rem;
        border-radius: 50%;
        background-size: 100% 100%;
        background-position: 0px 0px, 0px 0px, 0px 0px, 0px 0px;
        background-image: conic-gradient(from 0deg at 50% 50%, #1b1b1b var(--deg), #d3d3d3FF var(--deg));
        position: relative;
        left: 50%;
        transform: translateX(-50%);
        margin - bottom: 20px;
      }

      .payments {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        justify-content: center;
        gap: 20px;
        padding-bottom: 30px;
      }
         .bnpl-modal--content content-accordian {
         margin: 0;
         }
      .bnpl-modal--content .accordian-header.active+.accordian-content {
    max-height: 50vh;
    overflow:auto;
      }
    `;
    modal.appendChild(styleEl);
  }

  _activateAccordionTab(modal, provider) {
    const accordian = modal.querySelector('content-accordian');
    if (!accordian) return;
    const headers = accordian.querySelectorAll('.accordian-header');
    const contents = accordian.querySelectorAll('.accordian-content');
    const providerMap = { klarna: 0, clearpay: 1, paypal: 2 };
    const index = providerMap[provider];
    if (index === undefined || index >= headers.length) return;
    headers.forEach((h, i) => {
      const isActive = i === index;
      h.classList.toggle('active', isActive);
      h.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
    contents.forEach((c, i) => {
      c.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
  }

  splitPayments(total, parts) {
    const base = Math.floor(total / parts);
    const remainder = total % parts;

    const payments = Array(parts).fill(base);

    // Distribute remainder from the END
    for (let i = 0; i < remainder; i++) {
      payments[parts - 1 - i] += 1;
    }

    return payments.map(p => p / 100);
  }

  _showModal(el) {
    document.querySelector("page-overlay").openThis();
    el.classList.add("active");
    el.setAttribute("aria-hidden", "false");
  }

}



// export default class BnplOptions extends HTMLElement {
//   connectedCallback() {
//     this.klarnaLink = this.querySelector(".klarna-link");
//     this.clearpayLink = this.querySelector(".clearpay-link");
//     this.klarnaLink.addEventListener("click", (event) => this._openmodal("klarna", event));
//     this.clearpayLink.addEventListener("click", (event) => this._openmodal("clearpay", event));

//     this.clearpayURL = "https://thegymking.com/pages/clearpay-terms-conditions";
//     this.klarnaURL = "https://thegymking.com/pages/klarna-terms-conditions";
//   }

//   async _openmodal(option, event) {
//     event.preventDefault();

//     const targetModal = `.bnpl - modal.${ option } `;
//     document.querySelector(targetModal) ? this._showModal(targetModal) : this._createModal(option);
//   }

//   async _getContent(targetUrl) {
//     const response = await fetch(targetUrl);
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${ response.status } `);
//     }

//     // parse the returned data parsing into HTML
//     const htmlText = await response.text();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(htmlText, "text/html");
//     const content = doc.querySelector(".PageContent");

//     return content;
//   }

//   async _createModal(option) {
//     //create the modal element
//     const modal = document.createElement("div");
//     modal.className = "bnpl-modal modal fade-in";
//     modal.classList.add(option);
//     modal.setAttribute("aria-hidden", "false");

//     // add the close button
//     const closeBtn = document.createElement("button");
//     closeBtn.classList.add("modal-close");
//     closeBtn.setAttribute("aria-label", "Close modal");
//     closeBtn.innerHTML =
//       "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='Icon'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M18 6l-12 12' /><path d='M6 6l12 12' /></svg>";
//     closeBtn.addEventListener("click", () => document.querySelector("page-overlay").closeAllOverlays());

//     // add the content div and loader
//     const contentEl = document.createElement("div");
//     contentEl.className = "bnpl-modal--content";
//     contentEl.innerHTML = `< div class="loader" ></ > `;
//     modal.append(contentEl);
//     modal.appendChild(closeBtn);

//     //add the modal to the DOM
//     document.querySelector("page-overlay").openThis();
//     document.body.appendChild(modal);
//     modal.classList.add("active");

//     // finally fetch the data
//     const targetUrl = option === "klarna" ? this.klarnaURL : this.clearpayURL;
//     const content = await this._getContent(targetUrl);
//     contentEl.innerHTML = content.innerHTML;
//   }

//   _showModal(targetModal) {
//     document.querySelector("page-overlay").openThis();
//     const el = document.querySelector(targetModal);
//     el.classList.add("active");
//     el.setAttribute("aria-hidden", "false");
//   }
// }
