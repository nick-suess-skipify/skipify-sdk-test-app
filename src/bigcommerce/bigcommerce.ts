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
}

export default new BigCommerceSDK({});
