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
      interval: 7000,
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
      const firstSlide = this.splide.Components.Slides.getAt(0)?.slide;
      if (firstSlide) this.loadAndPlayVideo(firstSlide);
    });

    this.splide.on("active", (slide) => {
      this.loadAndPlayVideo(slide.slide);
    });

    this.splide.on("resized", () => {
      const slideIndex = this.splide.index;
      const slideEl = this.splide.Components.Slides.getAt(slideIndex)?.slide;

      if (slideEl) this.loadAndPlayVideo(slideEl);
    });

    this.splide.on("inactive", (slide) => {
      const videos = slide.slide.querySelectorAll(".hero_slide-video");
      videos.forEach((video) => {
        try {
          if (!video.paused) video.pause();
        } catch (err) {
          console.debug("Video pause failed", err);
        }
      });
    });

    this.splide.mount();
  }

  loadAndPlayVideo(slide) {
    if (!slide) return;

    const width = window.innerWidth;
    const selector = width < 768 ? ".hero_slide-video.mob-only" : ".hero_slide-video.mob-hide";
    const video = slide.querySelector(selector);

    if (!video || video.tagName !== "VIDEO") return;

    const source = video.querySelector("source[data-src-lazy]");
    if (source && !source.src) {
      source.src = source.getAttribute("data-src-lazy");
      video.load();
    }

    try {
      video.currentTime = 0;
      video.play().catch((err) => {
        console.debug("Autoplay blocked or video not ready", err);
      });
    } catch (err) {
      console.debug("Video play ignored", err);
    }
  }
}
