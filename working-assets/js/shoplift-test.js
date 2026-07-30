function shopliftTest() {
  const hypothesisID = "019e8270-204a-74ac-92de-82e21cffdd21"; //the shopplift test ID
  const style = document.createElement("style");
  window.shoplift.isHypothesisActive(hypothesisID).then((active) => {
    if (active && window.theme.pageType == "index") {
      console.log("SHOPLIFT:: Active");
      style.textContent = `
        .yotpo-widget-loyalty-floater-widget.yotpo-widget-override-css {
            display: none;
        }

        #shopify-section-template--28979726614911__1785416516408442e1 {
          display: block;
      }
    `;
      document.head.appendChild(style);
    }
  });
}

shopliftTest();
