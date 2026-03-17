// working-assets/js/utils.js
/* global clearTimeout */

/**
 * Binds Quick Add To Bag buttons within a container
 * @param {HTMLElement} root - Container element with .qatb-btn buttons
 */
export function bindQATBButtons(root) {
  const qatbButtons = root.querySelectorAll(".qatb-btn") || [];
  qatbButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetButton = e.currentTarget;
      const targetSize = targetButton.innerText;

      const errors = targetButton.closest(".qatb-btns").parentElement.querySelectorAll(".cart-error");
      errors.forEach((error) => error.remove());

      targetButton.innerHTML = `<div class="loader"></div>`;

      // Assumes Cart API is globally available
      window.Cart.addItems(targetButton.dataset.vId)
        .then(() => {
          targetButton.innerHTML = targetSize;
          const prodID = root.id;
          const modal = document.getElementById(prodID);
          modal ? modal.classList.remove("active") : "";
        })
        .catch((error) => {
          targetButton.innerHTML = targetSize;
          const errorBox = document.createElement("div");
          errorBox.className = "cart-error warning";
          errorBox.textContent = error.description || "Sorry, something went wrong.";
          targetButton.closest(".qatb-btns").before(errorBox);
        });
    });
  });
}

/**
 * Universal debounce utility
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 500) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Redirect loader utility for clicking external normal links
 */
export function pageRedirect() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;

    // Only unmodified left-clicks
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // Ignore new tab/window and downloads
    if (a.target === '_blank') return;
    if (a.hasAttribute('download')) return;

    const href = a.getAttribute('href');
    if (!href) return;

    // Ignore non-navigation links
    if (href.startsWith('#')) return;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;

    // Wait one frame so other scripts can cancel navigation
    requestAnimationFrame(() => {
      if (e.defaultPrevented) return; // JS hijacked it

      // Apply progress cursor globally
      document.documentElement.style.setProperty('cursor', 'progress', 'important');
      setTimeout(() => {
        const mobilefilters = document.querySelector('filters-menu-bar');
        if (mobilefilters) {
          mobilefilters.style.setProperty('z-index', '-1');
        }
        const pageOverlay = document.querySelector("page-overlay");
        pageOverlay.closeAllOverlays();
        pageOverlay.style.setProperty('background-color', 'rgba(255 255 255)');
        pageOverlay.style.setProperty('transition', 'opacity 1s, visibility 1s', 'important');
        pageOverlay.style.setProperty('display', 'grid');
        pageOverlay.style.setProperty('place-content', 'center');
        pageOverlay.innerHTML = "<div class='loader'></div>";
        document.body.classList.add('no-scroll');

      }, 500);
    });
  });
}
