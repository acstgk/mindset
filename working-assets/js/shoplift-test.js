function shopliftTest() {
  const hypothesisID = "019e8270-204a-74ac-92de-82e21cffdd21"; //the shopplift test ID
  const style = document.createElement("style");
  window.shoplift.isHypothesisActive(hypothesisID).then((active) => {
    if (active) {
      console.log("SHOPLIFT:: Active");
      style.textContent = `
        .cart_items-ctl { display: none !important; height: 0, width: 0;}
    `;
      document.head.appendChild(style);
    }
  });
}

shopliftTest();
