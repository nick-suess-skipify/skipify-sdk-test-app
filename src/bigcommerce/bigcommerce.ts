import { AbstractSDK, Base, SkipifyClassNames } from "../shared";

class BigCommerceSDK extends Base implements AbstractSDK {
  constructor() {
    super();
  }

  processDOM() {
    this.processEmailInput();
    this.processPaymentButton();
    this.processEnrollmentCheckbox();
  }

  processEmailInput() {
    const emailInputElem = document.getElementById("email");
    if (
      !emailInputElem ||
      emailInputElem?.classList.contains(SkipifyClassNames.emailInput)
    ) {
      return;
    }

    emailInputElem?.classList.add(SkipifyClassNames.emailInput);

    emailInputElem?.addEventListener("blur", this.handleInput);
  }

  handleInput(e: FocusEvent) {
    const emailValue = (e.target as HTMLInputElement).value;
    console.log(emailValue);
    alert(`-- Email input blur: ${emailValue}`);
  }

  processPaymentButton() {
    const paymentButtonElem = document.getElementById(
      "checkout-payment-continue"
    );
    if (
      !paymentButtonElem ||
      paymentButtonElem?.classList.contains(SkipifyClassNames.paymentButton)
    ) {
      return;
    }

    paymentButtonElem?.classList.add(SkipifyClassNames.paymentButton);

    paymentButtonElem?.addEventListener("click", this.handlePaymentButton);
  }

  handlePaymentButton() {
    alert(`-- Payment button clicked`);
  }

  processEnrollmentCheckbox() {
    const paymentButtonElem = document.getElementById(
      "checkout-payment-continue"
    );
    const enrollmentCheckboxElem = document.getElementById(
      SkipifyClassNames.enrollmentCheckbox
    );
    if (paymentButtonElem && !enrollmentCheckboxElem) {
      this.handleEnrollmentCheckbox(paymentButtonElem);
    }
  }

  handleEnrollmentCheckbox(paymentButtonElem: HTMLElement) {
    const wrapperEl = document.createElement("div");
    wrapperEl.id = SkipifyClassNames.enrollmentCheckbox;

    const contentEl = document.createElement("div");
    contentEl.innerHTML =
      "Save my information with a one-time code for faster future checkouts. By continuing you agree to Skipify Terms and Conditions and Privacy Policy.";

    const checkboxEl = document.createElement("input");
    checkboxEl.setAttribute("type", "checkbox");
    checkboxEl.style.width = "32px";
    checkboxEl.style.marginRight = "14px";

    wrapperEl.appendChild(checkboxEl);
    wrapperEl.appendChild(contentEl);

    wrapperEl.style.display = "flex";
    wrapperEl.style.alignItems = "space-between";
    wrapperEl.style.marginBottom = "18px";

    paymentButtonElem.parentNode?.prepend(wrapperEl);
  }
}

export default new BigCommerceSDK();
