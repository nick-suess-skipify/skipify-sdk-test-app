import {
  AbstractSDK,
  Base,
  SkipifyClassNames,
  SkipifyElementIds,
  EnrollmentDataType,
  cleanPhoneNumber,
} from "../shared";
import {
  EmailInput,
  CheckoutCompleted,
  EnrollmentCheckbox,
  BigCommerceStoreFrontApi,
} from "./utils";

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
  completedOrderSelector = ".orderConfirmation-section span strong";
  checkoutUrlMatch = "checkout";
  orderConfirmationUrlMatch = "order-confirmation";

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
    const { enrollmentCheckboxValue, userEmail, isExistingUser } =
      this.store.getState();
    if (
      window.location.href.includes(this.orderConfirmationUrlMatch) &&
      userEmail &&
      !isExistingUser &&
      !this.hasLaunchedIframe &&
      enrollmentCheckboxValue &&
      this.merchantId
    ) {
      this.checkoutCompleted = new CheckoutCompleted({
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

  async getCartData(): Promise<any> {
    const userCart = await this.storeFrontApi.getUserCart();

    if (!userCart) {
      return null;
    }

    const { physicalItems, digitalItems } = userCart.lineItems;
    return [...physicalItems, ...digitalItems];
  }

  // If we have already have an user email in the cart, we can rely on that instead of asking the
  // user to input it again.
  async fetchUserEmailFromCart() {
    if (!window.location.href.includes(this.checkoutUrlMatch)) {
      return;
    }

    const userCart = await this.storeFrontApi.getUserCart();
    if (!userCart) {
      return;
    }

    this.setUserEmail(userCart.email);
  }

  async getUserEnrollmentInformation() {
    const { userEmail } = this.store.getState();

    // We can rely on getting the orderId here:
    // https://support.bigcommerce.com/s/question/0D54O00006sUx6PSAS/can-you-get-the-order-id-using-javascript-on-the-order-confirmation-page
    const completedOrderElement = document.querySelector(
      this.completedOrderSelector
    );
    const completedOrderId = completedOrderElement
      ? completedOrderElement.textContent
      : null;

    if (!completedOrderId) {
      return Promise.resolve(null);
    }

    const completedOrder = await this.storeFrontApi.getOrder(completedOrderId);

    if (!completedOrder) {
      return Promise.resolve(null);
    }

    const enrollmentData: EnrollmentDataType = {
      email: userEmail,
    };

    if (completedOrder.billingAddress?.phone) {
      const cleanedPhoneNumber = cleanPhoneNumber(
        completedOrder.billingAddress.phone
      );
      if (cleanedPhoneNumber) {
        enrollmentData.phone = cleanedPhoneNumber;
      }
    }
    return enrollmentData;
  }
}

export default new BigCommerceSDK();
