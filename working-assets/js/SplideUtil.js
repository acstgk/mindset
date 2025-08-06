/* global Node */

// ===================
// Splide Utils
// ===================
export class SplideUtil {
  /**
   * Sets up Splide structure for a target element:
   * - Wraps all child nodes in the necessary Splide markup
   * - Returns the list element, or undefined if not possible
   */
  static splideHTML(target) {
    target.classList.add("splide");

    const track = document.createElement("div");
    const list = document.createElement("div");
    track.classList.add("splide__track");
    list.classList.add("splide__list");

    // Move all children into the splide__list
    while (target.firstChild) {
      const child = target.firstChild;

      if (child.nodeType === Node.ELEMENT_NODE && child.classList.contains("splide__slide")) {
        list.appendChild(child);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.classList.contains("splide__decal")) {
        track.appendChild(child);
      } else {
        child.remove();
      }
    }
    track.appendChild(list);
    target.appendChild(track);

    return list;
  }
}
