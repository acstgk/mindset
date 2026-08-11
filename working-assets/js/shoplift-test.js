function shopliftTest() {
  const hypothesisID = "019fb32a-1eb5-79b2-a56b-f179fe6a66fc";
  const style = document.createElement("style");
  if (!window.shoplift) return;
  window.shoplift.isHypothesisActive(hypothesisID).then((active) => {
    if (active && window.theme.pageType == "index") {
      console.log("SHOPLIFT:: Active");
      style.textContent = `

    `;
      document.head.appendChild(style);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => shopliftTest());
