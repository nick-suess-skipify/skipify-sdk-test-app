import {
  AbstractSDK,
  Base,
  SkipifyClassNames,
  SkipifyElementIds,
} from "../shared";
import { EmailInput } from "./emailInput";
import { CheckoutCompleted } from "./checkoutCompleted";
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
  checkoutUrlMatch = "order-confirmation";

  /**
   * Child classes that implements specific business logic.
   */
  emailInput: EmailInput | null = null;
  checkoutCompleted: CheckoutCompleted | null = null;
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
    this.processCheckoutCompleted();
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

  processCheckoutCompleted() {
    const { enrollmentCheckboxValue } = this.store.getState();
    if (
      window.location.href.includes(this.checkoutUrlMatch) &&
      this.userEmail &&
      !this.hasLaunchedIframe &&
      enrollmentCheckboxValue &&
      this.merchantId
    ) {
      this.checkoutCompleted = new CheckoutCompleted({
        setHasLaunchedIframe: this.setHasLaunchedIframe,
        messenger: this.messenger,
        merchantId: this.merchantId,
      });
    }
  }

  processEnrollmentCheckbox() {
    const paymentButtonElem = document.getElementById(this.paymentButtonId);
    const enrollmentCheckboxElem = document.getElementById(
      SkipifyElementIds.enrollmentCheckbox
    );

    if (paymentButtonElem && !enrollmentCheckboxElem) {
      // Reset enrollment checkbox value as its value is persisted across page changes
      this.setEnrollmentCheckboxValue(true);

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
}

export default new BigCommerceSDK();
