class GenderSelector {
  constructor() {
    this.genderButtons = document.querySelectorAll(".gender-btn");
    this.genderFilterElements = document.querySelectorAll("[class*='-gender-filter']");
    this.noGenderElements = document.querySelectorAll(".no-gender-filter");
    this.loaderElements = document.querySelectorAll(".gender-loader");
    this._bindEvents();
    this._initFromStorage();
  }

  _bindEvents() {
    this.genderButtons.forEach((button) => {
      button.addEventListener("click", () => this._handleGenderClick(button));
    });
  }

  _initFromStorage() {
    let storedGender = null;
    try {
      storedGender = localStorage.getItem("GK::gender--content");
    } catch {
      /* private browsing */
    }
    let matchButton = null;

    if (storedGender) {
      matchButton = Array.from(this.genderButtons).find((btn) => btn.dataset.gender === storedGender);
    }

    if (!matchButton) {
      matchButton = document.querySelector('.gender-btn[data-gender="mens"]');
    }

    if (matchButton) matchButton.click();
    this.noGenderElements.forEach((el) => (el.style.display = "none"));
    this.loaderElements.forEach((el) => el.remove());
  }

  _handleGenderClick(button) {
    const gender = button.dataset.gender;
    try {
      localStorage.setItem("GK::gender--content", gender);
    } catch {
      /* private browsing */
    }

    // Update buttons from cache
    this.genderButtons.forEach((btn) => {
      const isActive = btn === button;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
      btn.setAttribute("aria-expanded", String(isActive));
    });

    // Toggle gender-filter elements from cache (read once, write once)
    const targetClass = `${gender}-gender-filter`;
    this.genderFilterElements.forEach((el) => {
      const isMatch = el.classList.contains(targetClass);
      el.classList.toggle("active", isMatch);
      el.setAttribute("aria-hidden", String(!isMatch));
    });

    this.noGenderElements.forEach((el) => (el.style.display = "none"));
  }
}

// Initialize after DOM is ready
document.addEventListener("DOMContentLoaded", () => new GenderSelector());
