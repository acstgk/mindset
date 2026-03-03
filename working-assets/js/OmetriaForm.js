if (!customElements.get("ometria-form")) {
  customElements.define(
    "ometria-form",
    class OmetriaForm extends HTMLElement {
      connectedCallback() {
        this.form = this.querySelector("form");
        this.form.addEventListener("submit", (e) => e.preventDefault()); // prevent form redirtect
        this.form.id = "ometria-subscription-form";
        this.requiredElements = this.querySelectorAll(".ometria-push");
        this.formTitle = this.querySelector("h1");
        this.formSubtitle = this.querySelector("h2");
        this.formCopy = this.querySelector(".ctatxt");
        this.onwardLinks = document.querySelector(".continueShopping");
        this.hiddenPhone = document.getElementById("newsletter[hiddenphone]");
        this.submitButtons = this.querySelectorAll(".gender-submit-button");
        this.submitButtons.forEach((button) => {
          const gender = button.dataset.gender;
          button.addEventListener("click", (e) => this._submitForm(gender, e));
        });
      }

      _submitForm = async (gender, e) => {
        if (this._isValid() || !this.hiddenPhone) {
          e.preventDefault();
          document.getElementById("newsletter[gender]").value = gender;
          if (this.hiddenPhone) this.hiddenPhone.value = this._addIntCode();
          document.querySelector(".newsletter-error")?.classList.add("visually-hidden");

          const urlEncodedDataPairs = Object.keys(this.requiredElements).map((key) => {
            const el = this.requiredElements[key];
            if (el.type === "checkbox" || el.type === "radio") {
              return encodeURIComponent(el.name) + "=" + encodeURIComponent(el.checked ? "true" : "false");
            }
            return encodeURIComponent(el.name) + "=" + encodeURIComponent(el.value);
          });

          let formBody = [];
          formBody = urlEncodedDataPairs.join("&").replace(/%20/g, "+");

          try {
            const resp = await fetch("https://api.ometria.com/forms/signup/ajax", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
              },
              body: formBody,
            });

            if (resp.ok) {
              this.formSubtitle?.remove();
              this.form.remove();
              if (this.formTitle) {
                this.formTitle.innerHTML = window.successTitle;
              } else {
                this.innerHTML = "<div><h3 class='emphasis' style='margin:0;'>Success!</h3><p class='center'>Thank you for subscribing to our newsletter.</p></div>"
              }
              this.formCopy && (this.formCopy.innerHTML = window.successText);
              this.onwardLinks?.classList.add("active");
            }
          } catch (error) {
            const errorEl = document.createElement("p");
            errorEl.className = "warning";
            errorEl.innerText = `Sorry, there was an error in submitting the form.(${error})`;
            this.form.appendChild(errorEl);
          }
        } else {
          document.querySelector(".newsletter-error")?.classList.remove("visually-hidden");
        }
        return false;
      };

      // add the international code for the phone number (required by ometria)
      _addIntCode() {
        let phoneNo = document.getElementById("newsletter[phone]").value;

        if (phoneNo[0] == 0) {
          phoneNo = "+44" + phoneNo.slice(1);
        } else if (phoneNo.length > 0) {
          phoneNo = "+44" + phoneNo;
        } else {
          phoneNo = "";
        }
        return phoneNo;
      }

      _isValid() {
        let valid = false;
        if (
          document.querySelector("input[name='ue']")?.value.length > 0 &&
          (document.getElementById("newsletter[phone]")?.value.length == 0 || (document.getElementById("newsletter[phone]")?.value.length > 9 && document.getElementById("newsletter[phone]")?.value.length < 12))
        ) {
          valid = true;
        }
        return valid;
      }

      _handleSubmit(result) {
        if (result.ok) {
          this.formSubtitle?.remove();
          this.formCopy && (this.formCopy.innerHTML = window.successText);
        } else {
          const error = document.createElement("p");
          error.className = "warning";
          error.innerText = "Sorry, there was an error in submitting the form.";
          this.form.appendChild(error);
        }
      }
    },
  );
}
