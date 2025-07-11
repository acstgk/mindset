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
    this.loaderElements.forEach((el) => (el.style.opacity = "0"));
    const storedGender = localStorage.getItem("content-gender");
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
  }

  _handleGenderClick(button) {
    const gender = button.dataset.gender;
    localStorage.setItem("content-gender", gender);

    // Remove active from all buttons
    this.genderButtons.forEach((btn) => btn.classList.remove("active"));
    // Add active to current
    button.classList.add("active");

    // Hide all gender-specific elements
    const targetClass = `.${gender}-gender-filter`;
    const genderFilters = document.querySelectorAll(
      "[class*='-gender-filter']"
    );
    genderFilters.forEach((el) => {
      if (!el.classList.contains(targetClass)) {
        el.classList.remove("active");
      }
    });

    // Show only matching gender elements
    const matchingElements = document.querySelectorAll(targetClass);
    matchingElements.forEach((el) => {
      el.classList.add("active");
    });

    // Hide no-gender-filter elements
    this.noGenderElements.forEach((el) => (el.style.display = "none"));
    this.loaderElements.forEach((el) => (el.style.opacity = "0"));
  }
}

// Initialize after DOM is ready
document.addEventListener("DOMContentLoaded", () => new GenderSelector());
