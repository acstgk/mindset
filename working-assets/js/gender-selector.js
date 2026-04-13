class GenderSelector {
  constructor() {
    this.genderButtons = document.querySelectorAll(".gender-btn");
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
    const storedGender = localStorage.getItem("GK::gender--content");
    let matchButton = null;

    if (storedGender) {
      matchButton = Array.from(this.genderButtons).find(
        (btn) => btn.dataset.gender === storedGender
      );
    }

    if (!matchButton) {
      matchButton = document.querySelector('.gender-btn[data-gender="mens"]');
    }

    if (matchButton) matchButton.click();
    this.noGenderElements.forEach((el) => (el.style.display = "none"));
    document.querySelectorAll(".gender-loader").forEach((el) => el.remove());
  }

  _handleGenderClick(button) {
    const gender = button.dataset.gender;
    localStorage.setItem("GK::gender--content", gender);

    // Remove active from all buttons and update aria-pressed
    this.genderButtons.forEach((btn) => {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-expanded", "false");
    });
    // Add active to current button
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-expanded", "true");

    // Hide all gender-specific elements
    const targetClass = `.${gender}-gender-filter`;
    const genderFilters = document.querySelectorAll(
      "[class*='-gender-filter']"
    );
    genderFilters.forEach((el) => {
      if (!el.classList.contains(targetClass)) {
        el.classList.remove("active");
        el.setAttribute("aria-hidden", "true");
      }
    });

    // Show only matching gender elements
    const matchingElements = document.querySelectorAll(targetClass);
    matchingElements.forEach((el) => {
      el.classList.add("active");
      el.setAttribute("aria-hidden", "false");
    });

    // Hide no-gender-filter elements
    this.noGenderElements.forEach((el) => (el.style.display = "none"));
  }
}

// Initialize after DOM is ready
document.addEventListener("DOMContentLoaded", () => new GenderSelector());
