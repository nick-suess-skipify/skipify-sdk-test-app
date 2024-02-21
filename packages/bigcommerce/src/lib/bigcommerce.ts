import {
  AbstractSDK,
  Base,
  SkipifyClassNames,
  SkipifyElementIds,
  UserEnrollmentInformationType,
  cleanPhoneNumber,
} from '@checkout-sdk/shared';
import {
  EmailInput,
  CheckoutCompleted,
  EnrollmentCheckbox,
  BigCommerceStoreFrontApi,
  LoggedInCustomer,
} from './utils';
import { BigCommerceLineItem } from './bigcommerce.types';

interface OwnProps {
  emailInputId?: string;
  paymentButtonId?: string;
  merchantId?: string;
}

type Props = OwnProps;

export class BigCommerceSDK extends Base implements AbstractSDK {
  /**
   * Attributes that can be customizable on SDK instantiation.
   * Default values are assigned based on default BigCommerce themes.
   */
  emailInputId = 'email';
  passwordInputId = 'password';
  paymentButtonId = 'checkout-payment-continue';
  loggedInCustomerSelector = '[data-test=sign-out-link]';
  completedOrderSelector = '.orderConfirmation-section span strong';
  checkoutUrlMatch = 'checkout';
  orderConfirmationUrlMatch = 'order-confirmation';

  /**
   * Child classes that implements specific business logic.
   */
  emailInput: EmailInput | null = null;
  checkoutCompleted: CheckoutCompleted | null = null;
  enrollmentCheckbox: EnrollmentCheckbox | null = null;
  loggedInCustomer: LoggedInCustomer | null = null;

  storeFrontApi: BigCommerceStoreFrontApi;

  constructor({ emailInputId, paymentButtonId, merchantId }: Props = {}) {
    super(merchantId);
    if (emailInputId) {
      this.emailInputId = emailInputId;
    }
    if (paymentButtonId) {
      this.paymentButtonId = paymentButtonId;
    }

    this.storeFrontApi = new BigCommerceStoreFrontApi();
    this.fetchUserEmailFromCart();
  }

  override processDOM() {
    this.processEmailInput();
    this.processCheckoutCompleted();
    this.processEnrollmentCheckbox();
    this.processLoggedInCustomer();
  }

  processEmailInput() {
    const emailInputElem = document.getElementById(this.emailInputId);
    if (!emailInputElem) {
      this.messenger.resetIframeStyles();
      return;
    }
    if (emailInputElem?.classList.contains(SkipifyClassNames.emailInput)) {
      return;
    }
    this.insertButton(emailInputElem);

    this.emailInput = new EmailInput({
      node: emailInputElem,
      setUserEmail: (email) => this.setUserEmail(email),
      passwordInputId: this.passwordInputId,
      onChange: (e) => {
        //if the email change, we need to hide the skipify layer button and relaunch the iframe
        if (
          this.isSkipifyLayerEnabled &&
          e.target instanceof HTMLInputElement &&
          e.target.value.trim().toLowerCase() !==
            this.store.getState().userEmail
        ) {
          this.launchBaseIframe();
          if (this.button) this.button.style.display = 'none';
        }
      },
    });
  }

  processLoggedInCustomer() {
    const loggedInCustomerElem = document.querySelector(
      this.loggedInCustomerSelector
    );
    if (
      !loggedInCustomerElem ||
      loggedInCustomerElem?.classList.contains(
        SkipifyClassNames.loggedInCustomer
      )
    ) {
      return;
    }

    this.loggedInCustomer = new LoggedInCustomer({
      node: loggedInCustomerElem,
      fetchUserEmailFromCart: () => this.fetchUserEmailFromCart(),
    });
  }

  processCheckoutCompleted() {
    const { enrollmentCheckboxValue, userEmail, eligible } =
      this.store.getState();

    if (
      window.location.href.includes(this.orderConfirmationUrlMatch) &&
      userEmail &&
      eligible &&
      enrollmentCheckboxValue &&
      this.merchantId &&
      // Check if the orderId is already available in the order confirmation page
      // https://support.bigcommerce.com/s/question/0D54O00006sUx6PSAS/can-you-get-the-order-id-using-javascript-on-the-order-confirmation-page
      document.querySelector(this.completedOrderSelector)
    ) {
      this.checkoutCompleted = new CheckoutCompleted({
        launchEnrollmentIframe: () => this.launchEnrollmentIframe(),
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

      const { eligible, userEmail } = this.store.getState();
      // Only render if user is eligible, it could be a user that started Skipify checkout and exited
      if (userEmail && eligible) {
        this.enrollmentCheckbox = new EnrollmentCheckbox({
          node: paymentButtonElem,
        });
      }
    }
  }

  override async clearCart(): Promise<void> {
    const userCart = await this.storeFrontApi.getUserCart();

    if (!userCart) {
      return;
    }

    await this.storeFrontApi.deleteCart(userCart.id);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async handleOrderCompleted(_externalOrderId: string): Promise<void> {
    this.skipifyCheckoutCompleted = true;
    this.clearCart();
    this.reset(); // Reset the store after the order is completed
  }

  override async getCartData(): Promise<BigCommerceLineItem[] | null> {
    const userCart = await this.storeFrontApi.getUserCart();

    if (!userCart) {
      return null;
    }

    const { physicalItems, digitalItems } = userCart.lineItems;
    return [...physicalItems, ...digitalItems];
  }

  override async getCartTotal() {
    const userCart = await this.storeFrontApi.getUserCart();
    if (!userCart) {
      return { total: 0, subtotal: 0 };
    }
    return {
      total: Number(userCart.cartAmount),
      subtotal: Number(userCart.cartAmount),
    };
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

  override async getUserEnrollmentInformation() {
    const { userEmail } = this.store.getState();

    // We can rely on getting the orderId here:
    // https://support.bigcommerce.com/s/question/0D54O00006sUx6PSAS/can-you-get-the-order-id-using-javascript-on-the-order-confirmation-page
    const completedOrderElement = document.querySelector(
      this.completedOrderSelector
    );
    const completedOrderId = completedOrderElement
      ? completedOrderElement.textContent
      : null;

    const enrollmentData: UserEnrollmentInformationType = {
      email: userEmail,
    };

    if (completedOrderId) {
      const completedOrder = await this.storeFrontApi.getOrder(
        completedOrderId
      );
      if (completedOrder?.billingAddress?.phone) {
        const cleanedPhoneNumber = cleanPhoneNumber(
          completedOrder.billingAddress.phone
        );
        if (cleanedPhoneNumber) {
          enrollmentData.phone = cleanedPhoneNumber;
        }
      }

      const [shippingItem] = completedOrder?.consignments?.shipping ?? [];

      if (shippingItem) {
        enrollmentData.shippingAddress = {
          address1: shippingItem.address1,
          city: shippingItem.city,
          firstName: shippingItem.firstName,
          lastName: shippingItem.lastName,
          state: shippingItem.stateOrProvince,
          zipCode: shippingItem.postalCode,
          address2: shippingItem.address2,
          phoneNumber: enrollmentData.phone,
        };
      }
    }
    return enrollmentData;
  }
}

export default new BigCommerceSDK();
