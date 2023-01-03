import { AbstractSDK, Base, SkipifyClassNames } from "../shared";
import { EmailInput } from "./emailInput";
import { PaymentButton } from "./paymentButton";
import { EnrollmentCheckbox } from "./enrollmentCheckbox";
import { BigCommerceStoreFrontApi } from "./storeFrontApi";

import "../styles/index.css";

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

  storeFrontApi: BigCommerceStoreFrontApi;

  constructor({ emailInputId, paymentButtonId }: Props = {}) {
    super();
    if (emailInputId) {
      this.emailInputId = emailInputId;
    }
    if (paymentButtonId) {
      this.paymentButtonId = paymentButtonId;
    }

    this.storeFrontApi = new BigCommerceStoreFrontApi();
    this.fetchUserEmailFromCart();
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
      setUserEmail: (email) => this.setUserEmail(email),
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

  async clearCart(): Promise<void> {
    const userCart = await this.storeFrontApi.getUserCart();

    if (!userCart) {
      return;
    }

    await this.storeFrontApi.deleteCart(userCart.id);
  }

  // If we have already have an user email in the cart, we can rely on that instead of asking the
  // user to input it again.
  async fetchUserEmailFromCart() {
    const userCart = await this.storeFrontApi.getUserCart();

    if (!userCart || this.userEmail) {
      return;
    }

    this.setUserEmail(userCart.email);
  }

  async setUserEmail(email: string) {
    this.userEmail = email;
    email &&
      email !== this.capturedUser.email &&
      (await this.getUserFromLookup(email));
    this.userEmail &&
      console.log(this.capturedUser.isNewUser ? "New user" : "Existing user");
  }
}

export default new BigCommerceSDK();
