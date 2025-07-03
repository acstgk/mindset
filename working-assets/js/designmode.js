/* global Hero */

document.addEventListener("shopify:section:load", (event) => {
  if (event.target.querySelector("hero-carousel")) {
    new Hero("hero-carousel");
  }
});

document.addEventListener("shopify:block:select", (event) => {
  console.log(event.detail.blockId);

  const blockId = event.detail.blockId;
  const slide = document.querySelector(`[data-block-id="${blockId}"]`);
  if (!slide) return;

  const splideElement = document.querySelector("hero-carousel");
  if (!splideElement || !splideElement.splide) return;
  const slides = Array.from(splideElement.querySelectorAll(".splide__slide"));
  const index = slides.indexOf(slide);

  if (index >= 0) {
    splideElement.splide.go(index);
  }
});
