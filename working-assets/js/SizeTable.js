if (!customElements.get("size-table")) {
  customElements.define(
    "size-table",
    class SizeGuideTable extends HTMLElement {
      constructor() {
        super();
        this.toggleView = this.toggleView.bind(this);
        this.toggleVisibility = this.toggleVisibility.bind(this);
      }

      //set up logic
      connectedCallback() {
        this.table = this.querySelector("table");
        this.cms = this.querySelectorAll(".cm");
        this.ins = this.querySelectorAll(".in");
        this.units = this.querySelectorAll(".unit");
        this.toggleVisibility(this.ins);
        this.toggleVisibility(this.units);
        this.addToggleControls();
      }

      // utility method to toggle element visibilityu
      toggleVisibility(elements) {
        elements.forEach((element) => {
          element.classList.toggle("visually-hidden");
        });
      }

      // utility method for creating the toggle control buttons
      createButton(label, className, onClick) {
        const button = document.createElement("button");
        button.textContent = label;
        button.classList.add(className, "button");
        button.addEventListener("click", onClick);
        return button;
      }

      // add the toggle control buttons to the DOM
      addToggleControls() {
        const newDiv = document.createElement("div");
        newDiv.classList.add("toggle-buttons");

        const cmBtn = this.createButton("cm", "button-primary", this.toggleView);
        newDiv.appendChild(cmBtn);

        if (this.ins.length > 0) {
          const inchBtn = this.createButton("inches", "button-secondary", this.toggleView);
          newDiv.appendChild(inchBtn);
        }

        this.table.parentNode.insertBefore(newDiv, this.table);
      }

      // this is the function that is called on toggle control button click.
      toggleView(e) {
        if (e.target.classList.contains("button-secondary")) {
          const buttons = this.querySelectorAll(".button");
          buttons.forEach((button) => {
            button.classList.toggle("button-primary");
            button.classList.toggle("button-secondary");
          });
          this.toggleVisibility(this.ins);
          this.toggleVisibility(this.cms);
        }
      }
    },
  );
}
