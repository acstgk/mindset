/* global */

export default class RecentlyViewed {
  constructor() {
    this.listKey = "GK::recently-viewed";
  }

  addProductToList = () => {
    const productData = document.getElementById("product-details");

    const details = JSON.parse(productData.dataset.details);
    details.timestamp = Date.now();
    let category = details.productGender.toLowerCase();
    category == "boys" || category == "girls" ? (category = "kids") : "";
    delete details.productGender;
    const localObject = JSON.parse(localStorage.getItem(this.listKey)) || { mens: [], womens: [], kids: [], accessories: [] };
    const matchingCategory = localObject[category];

    if (matchingCategory) {
      const baseName = details.productName.split(/[-–—]/)[0].trim();
      let indexToRemove = -1;

      for (let i = 0; i < matchingCategory.length; i++) {
        const item = matchingCategory[i];
        if (item.productId === details.productId || item.productName.split(/[-–—]/)[0].trim() === baseName) {
          indexToRemove = i;
          break;
        }
      }

      if (indexToRemove !== -1) {
        matchingCategory.splice(indexToRemove, 1);
      }

      matchingCategory.unshift(details);
      if (matchingCategory.length > 6) {
        matchingCategory.pop();
      }

      localObject[category] = matchingCategory;
      localStorage.setItem(this.listKey, JSON.stringify(localObject));
    }
  };

  checkProductListDates = () => {
    const list = JSON.parse(localStorage.getItem(this.listKey));

    if (list) {
      const now = Date.now();
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;

      Object.keys(list).forEach((category) => {
        const items = list[category];
        for (let i = items.length - 1; i >= 0; i--) {
          if (now - items[i].timestamp > ninetyDays) {
            items.splice(i, 1);
          } else {
            break;
          }
        }
      });

      localStorage.setItem(this.listKey, JSON.stringify(list));
    }
  };

  getProductList = () => {
    return JSON.parse(localStorage.getItem(this.listKey));
  };

  hasRecentlyViewed = () => {
    const list = this.getProductList();
    return list && Object.values(list).some((arr) => Array.isArray(arr) && arr.length > 0);
  };
}
