import { AbstractSDK, Base, SkipifyClassNames } from "../shared";
import { EmailInput } from "./emailInput";
import { PaymentButton } from "./paymentButton";
import { EnrollmentCheckbox } from "./enrollmentCheckbox";

interface OwnProps {
  emailInputId?: string;
  paymentButtonId?: string;
}

type Props = OwnProps;

class BigCommerceSDK extends Base implements AbstractSDK {
  /**
   * Attributes that can be customizable on SDK instantiation.
   * Default values are assigned based on default BigCommerce themes.
   */
  emailInputId = "email";
  paymentButtonId = "checkout-payment-continue";

  /**
   * Child classes that implements specific business logic.
   */
  emailInput: EmailInput | null = null;
  paymentButton: PaymentButton | null = null;
  enrollmentCheckbox: EnrollmentCheckbox | null = null;

  constructor({ emailInputId, paymentButtonId }: Props) {
    super();
    if (emailInputId) {
      this.emailInputId = emailInputId;
    }
    if (paymentButtonId) {
      this.paymentButtonId = paymentButtonId;
    }
  }

  processDOM() {
    this.processEmailInput();
    this.processPaymentButton();
    this.processEnrollmentCheckbox();
  }

  processEmailInput() {
    const emailInputElem = document.getElementById(this.emailInputId);
    if (
      !emailInputElem ||
      emailInputElem?.classList.contains(SkipifyClassNames.emailInput)
    ) {
      return;
    }

    this.emailInput = new EmailInput({
      node: emailInputElem,
    });
  }

  processPaymentButton() {
    const paymentButtonElem = document.getElementById(this.paymentButtonId);
    if (
      !paymentButtonElem ||
      paymentButtonElem?.classList.contains(SkipifyClassNames.paymentButton)
    ) {
      return;
    }

    this.paymentButton = new PaymentButton({ node: paymentButtonElem });
  }

  processEnrollmentCheckbox() {
    const paymentButtonElem = document.getElementById(this.paymentButtonId);
    const enrollmentCheckboxElem = document.getElementById(
      SkipifyClassNames.enrollmentCheckbox
    );
    if (paymentButtonElem && !enrollmentCheckboxElem) {
      this.enrollmentCheckbox = new EnrollmentCheckbox({
        node: paymentButtonElem,
      });
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

    // XXX: This is an example of sending a message to the iframe.
    // We store the iframe source in the base class, and then send a message to it.
    //
    // checkboxEl.addEventListener("change", () => {
    //   this.iframeSource?.postMessage(
    //     { name: "TEST_MESSAGE", payload: { success: true } },
    //     { targetOrigin: IFRAME_ORIGIN }
    //   );
    // });

    wrapperEl.appendChild(checkboxEl);
    wrapperEl.appendChild(contentEl);

    wrapperEl.style.display = "flex";
    wrapperEl.style.alignItems = "space-between";
    wrapperEl.style.marginBottom = "18px";

    paymentButtonElem.parentNode?.prepend(wrapperEl);
  }
}

export default new BigCommerceSDK({});
