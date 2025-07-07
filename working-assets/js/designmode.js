/* global Hero */

document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector("hero-carousel")) {
    new Hero("hero-carousel");
  }

  if (event.target.querySelector("announcement-bar")) {
    new Hero("announcement-bar");
  }
});

document.addEventListener("shopify:section:select", (event) => {
  customElements.whenDefined("slide-drawer").then(() => {
    document.querySelectorAll("slide-drawer").forEach((item) => {
      item.close();
    });
    const drawer = event.target.querySelector("slide-drawer");
    if (drawer && typeof drawer.open === "function") {
      drawer.open();
    }
  });
});

document.addEventListener("shopify:block:select", (event) => {
  const blockId = event.detail.blockId;
  const block = document.querySelector(`[data-block-id="${blockId}"]`);
  if (!block) return;

  // If a hero-slide  matches the blockId, switch focus to it

  checkSplide("hero-carousel");
  checkSplide("announcement-bar");

  function checkSplide(el) {
    if (
      document.querySelector(el).querySelector(`[data-block-id="${blockId}"]`)
    ) {
      const splideElement = document.querySelector(el);
      if (!splideElement || !splideElement.splide) return;
      const slides = Array.from(
        splideElement.querySelectorAll(".splide__slide")
      );
      const index = slides.indexOf(block);

      if (index >= 0) {
        splideElement.splide.go(index);
      }
    }
  }
});
