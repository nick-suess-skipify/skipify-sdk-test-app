import {
  AbstractSDK,
  Base,
  SkipifyClassNames,
  SkipifyElementIds,
  cleanPhoneNumber,
  insertLoadingStateElement,
  UserEnrollmentInformationType,
  PlatformCartType
} from "@checkout-sdk/shared";
import { EmailInput } from "@checkout-sdk/shared/classes"
import {
  CheckoutCompleted,
  EnrollmentCheckbox,
  BigCommerceStoreFrontApi,
  LoggedInCustomer,
} from './utils';
import { BigCommerceLineItem } from './bigcommerce.types';
import { SamsungDemo } from "./utils/samsungDemo";

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
  loadingShippingSelector = 'li.checkout-step--shipping .address-form-skeleton'
  completedOrderSelector = '.orderConfirmation-section span strong';
  checkoutUrlMatch = 'checkout';
  orderConfirmationUrlMatch = 'order-confirmation';
  checkoutFormSteps = ['checkout-step--payment', 'checkout-step--shipping', 'checkout-step--billing']

  /**
   * Child classes that implements specific business logic.
   */
  emailInput: EmailInput | null = null;
  checkoutCompleted: CheckoutCompleted | null = null;
  enrollmentCheckbox: EnrollmentCheckbox | null = null;
  loggedInCustomer: LoggedInCustomer | null = null;

  storeFrontApi: BigCommerceStoreFrontApi;

  samsungDemo: SamsungDemo | null = null;


  constructor({ emailInputId, paymentButtonId, merchantId }: Props = {}) {
    super(merchantId);
    if (emailInputId) {
      this.emailInputId = emailInputId;
    }
    if (paymentButtonId) {
      this.paymentButtonId = paymentButtonId;
    }

    this.platform = "bigcommerce";
    this.storeFrontApi = new BigCommerceStoreFrontApi();
    this.fetchUserEmailFromCart();

    // only run samsung demo on dev and stage build
    if (['development', 'staging'].includes(import.meta.env.MODE)) {
      this.samsungDemo = new SamsungDemo(this.messenger);
    }

  }

  override processDOM() {
    this.processEmailInput();
    this.processCheckoutCompleted();
    this.processEnrollmentCheckbox();
    this.processLoggedInCustomer();
    this.processEmbedCheckout();

    if (['development', 'staging'].includes(import.meta.env.MODE)) {
      this.processSamsungDemo();
    }
  }

  processSamsungDemo() {
    // Trying to set up checkout button if LD flag for samsung demo is true
    const { flags } = this.store.getState();
    if (flags?.samsungDemo && this.samsungDemo?.canShowSamsungDemo() && this.samsungDemo?.checkoutButton === null) {
      this.samsungDemo.setupButton();
      this.useButtonCheckout = true;
    }
  }

  processEmailInput() {
    const emailInputElem = document.getElementById(this.emailInputId) as HTMLInputElement;
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
      setUserEmail: (email) => this.setUserLookupData(email, undefined, true),
      resetIframe: () => {
        this.messenger.closeIframe(true)
      },
      passwordInputId: this.passwordInputId
    });

    insertLoadingStateElement(emailInputElem)
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

    const loadingShippingElem = document.querySelector(this.loadingShippingSelector)
    if (loadingShippingElem) return; // We want to wait until the shipping section is fully loaded so we can get the user phone number

    this.loggedInCustomer = new LoggedInCustomer({
      node: loggedInCustomerElem,
      fetchUserEmailFromCart: () => this.fetchUserEmailFromCart(false),
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

  processEmbedCheckout() {
    if (!this.isSkipifyEmbedEnabled) return;

    const checkoutWrapperElem = this.getEmbedContainer();
    if (!checkoutWrapperElem || checkoutWrapperElem?.classList.contains(SkipifyClassNames.embedOverlayWrapper)) {
      return;
    }
    this.launchBaseIframe();
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

  transformLineItem(item: any) {
    const newItem = { ...item }
    if (item.options) {
      newItem.options = item.options.map((option: { nameId: string; valueId: number; }) =>
        ({ nameId: String(option.nameId), valueId: String(option.valueId) }))
    } else {
      newItem.options = []
    }

    return newItem;
  }

  override async getCartData(): Promise<PlatformCartType> {
    const userCart = await this.storeFrontApi.getUserCart();

    if (!userCart) {
      return null;
    }

    const { physicalItems, digitalItems } = userCart.lineItems;

    if (digitalItems.length > 0) {
      return null; // We aren't supporting Digital Items as of now - let the customer finish the order in the merchant website
    }
    return { items: [...physicalItems.map(this.transformLineItem)] };
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
  async fetchUserEmailFromCart(onlyGuest = true) {
    if (!this.canShowIframe()) {
      return;
    }

    const userCart = await this.storeFrontApi.getUserCart();
    if (!userCart) {
      return;
    }

    // customerId == 0 when it's a guest checkout
    if (onlyGuest && userCart.customerId !== 0) { // This means user is logged in
      return;
    }

    let phone = '';
    // Retrieve the user's phone number from the pre-selected shipping address
    try {
      if (userCart.id && userCart.customerId !== 0) { // Only do that for logged in users: customerId != 0
        const userCheckout = await this.storeFrontApi.getUserCheckout(userCart.id)

        if (userCheckout?.consignments && userCheckout?.consignments?.length > 0) {
          const consignment = userCheckout.consignments[0];

          if (consignment.address?.phone) {
            phone = consignment.address.phone;
          }
        }
      }
    } catch (e) {
      console.error('Error fetching user checkout:', e);
    }

    this.setUserLookupData(userCart.email, phone, true);
  }

  override getEmbedContainer() {
    return document.querySelector('.layout-main') as HTMLDivElement
  }

  override onIframeDisplay(): null {
    if (this.isSkipifyEmbedEnabled) {
      this.checkoutFormSteps.forEach(className => {
        const elements = document.querySelectorAll('.' + className);
        elements.forEach(element => {
          (element as HTMLDivElement).style.display = 'none';
        });
      });
    }
    return null
  }

  override onIframeClose(checkoutCompleted: boolean): null {
    if (this.isSkipifyEmbedEnabled && !checkoutCompleted) {
      this.checkoutFormSteps.forEach(className => {
        const elements = document.querySelectorAll('.' + className);
        elements.forEach(element => {
          (element as HTMLDivElement).style.display = 'block';
        });
      });
    }
    return null
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

  override canShowIframe(): boolean {
    return window.location.href.includes(this.checkoutUrlMatch) || !!this.samsungDemo?.canShowSamsungDemo();
  }
}

export default new BigCommerceSDK();
