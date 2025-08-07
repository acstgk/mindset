/* global */

export default class RecentlyViewed {
 constructor() {
  this.listKey = "GK::recently-viewed";
 }

  updateProductList = () => {
    const productData = document.getElementById('product-details');
    const details = JSON.parse(productData.dataset.details);
    details.viewedDate = Date.now();

    const existingList = JSON.parse(localStorage.getItem(this.listKey)) || [];

    // Extract prefix before first hyphen, en-dash, or em-dash
    const prefixMatch = details.productName.split(/[-–—]/)[0].trim();

    // Remove any items with the same prefix or same productId
    const updatedList = existingList.filter(item => {
      const existingPrefix = item.productName.split(/[-–—]/)[0].trim();
      return item.productId !== details.productId && existingPrefix !== prefixMatch;
    });

    updatedList.unshift(details);

    const trimmedList = updatedList.slice(0, 6);

    localStorage.setItem(this.listKey, JSON.stringify(trimmedList));
  }

  checkProductListDates = () => {
    const list = JSON.parse(localStorage.getItem(this.listKey)) || [];
    const now = Date.now();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    for (let i = list.length - 1; i >= 0; i--) {
      if (now - list[i].viewedDate > ninetyDays) {
        list.splice(i, 1);
      } else {
        break;
      }
    }
    localStorage.setItem(this.listKey, JSON.stringify(list));
  }

  getProductList = () => {
     return JSON.parse(localStorage.getItem(this.listKey))
  }
}