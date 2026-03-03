;
import { SplideUtil } from "./SplideUtil.js";

// ===================
// Hero Carousel
// ===================
export default class HeroCarousel extends HTMLElement {
  constructor() {
    super();
    this.splide = null;
    this.storedGender = localStorage.getItem("GK::gender--content") || "mens";
    this.slideNo = this.querySelector(".hero_slide[data-gender=" + this.storedGender + "]")?.dataset.index || 0;
  }

  connectedCallback() {
    SplideUtil.splideHTML(this);
    this.splide = new window.Splide(this, {
      type: "fade",
      autoplay: true,
      interval: 5000,
      arrows: false,
      rewind: true,
      lazyLoad: "nearby",
      start: Number(this.slideNo),
      preloadPages: 1,
      pauseOnHover: true,
    });

    this.splide.on("overflow", (isOverflow) => {
      this.splide.options = {
        ...this.splide.options,
        pagination: isOverflow,
        drag: isOverflow,
      };
    });

    this.splide.on("pagination:mounted", (data) => {
      if (data.items.length > 1) {
        data.items.forEach((item) => {
          item.button.textContent = "0" + String(item.page + 1);
        });
      }
    });

    this.splide.on("ready", () => {
      const firstSlide = this.splide.root.querySelector("#splide01-slide01");
      this.loadAndPlayVideo(firstSlide);
    });

    this.splide.on("active", (slide) => {
      this.loadAndPlayVideo(slide.slide);
    });

    this.splide.on("resized", () => {
      const slideIndex = this.splide.index;
      const slideEl = this.splide.Components.Slides.get(slideIndex)[slideIndex].slide;

      this.loadAndPlayVideo(slideEl);
    });

    this.splide.on("inactive", (slide) => {
      const mobVid = slide.slide.querySelector(".hero_slide-video.mob-only");
      const deskVid = slide.slide.querySelector(".hero_slide-video.mob-hide");
      const width = window.innerWidth;

      if (width < 768) {
        if (mobVid) {
          mobVid.pause();
        }
      } else {
        if (deskVid) {
          deskVid.pause();
        }
      }
    });

    this.splide.mount();
  }

  loadAndPlayVideo(slide) {
    if (!slide) return;

    const width = window.innerWidth;
    let video = width < 768 ? slide.querySelector(".hero_slide-video.mob-only") : slide.querySelector(".hero_slide-video.mob-hide");

    if (!video) return;

    const source = video.querySelector("source[data-src-lazy]");
    if (source && !source.src) {
      source.src = source.getAttribute("data-src-lazy");
      video.load();
    }

    video.play();
  }
}
