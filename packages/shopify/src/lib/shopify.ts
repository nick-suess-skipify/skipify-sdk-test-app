import {
  AbstractSDK,
  Base,
  cleanPhoneNumber,
  SkipifyClassNames,
  SkipifyElementIds,
  UserEnrollmentInformationType,
  log,
} from "@checkout-sdk/shared";

import { ShopifyCart, ShopifyGlobalObject, ShopifyLine } from "./shopify.types";
import { CheckoutCompleted, EmailInput, EnrollmentCheckbox } from "./utils";

/**
 * Global window.Shopify object available on checkout page
 */
declare global {
  interface Window {
    Shopify: ShopifyGlobalObject;
  }
}
class ShopifySDK extends Base implements AbstractSDK {
  /**
   * Attributes that can be customizable on SDK instantiation.
   * Default values are assigned based on default BigCommerce themes.
   */
  emailInputId = "checkout_email";
  discountCodeSelector = ".reduction-code"; // selects shopify discount code elements
  paymentButtonSelector = ".step__footer .shown-if-js"; // selects shopify payment button elements
  lookupDisabled = false; // global flag to disable lookup
  whitelistedDomains = ["skipify.com", "skipifyqa.msdc.co", "plae.co"];

  /**
   * Child classes that implements specific business logic.
   */
  emailInput: EmailInput | null = null;
  checkoutCompleted: CheckoutCompleted | null = null;
  enrollmentCheckbox: EnrollmentCheckbox | null = null;

  constructor() {
    super();
  }

  override start(): void {
    const { step } = window.Shopify?.Checkout || {};
    if (step === "shipping_method") return; // current we don't do anything on shipping method page, skip

    super.start();
  }

  override processDOM() {
    const { step } = window.Shopify?.Checkout || {};
    if (step === "contact_information") {
      // we only process email input / lookup in contact information page
      this.processDiscountCode(); // important to run this first
      this.processEmailInput();
    }

    if (step === "payment_method") {
      // we only process enrollment checkbox in payment method page (last page)
      this.processEnrollmentCheckbox();
    }

    // shopify sometimes just doesn't land on "thank_you" page for some reason
    // check if order_id is present in checkout object
    if (step === "thank_you" || window.Shopify?.checkout?.order_id) {
      this.processCheckoutCompleted();
    }
  }

  processDiscountCode(): void {
    const discountElements = document.querySelector(this.discountCodeSelector);
    if (!discountElements) {
      // if no discount elements found, enable lookup
      this.lookupDisabled = false;
    } else {
      // else disable lookup, as we cannot process discount code yet
      // let shopify handle orders with discount code for now
      log("Discount elements found, disabling lookup");
      this.lookupDisabled = true;
    }
  }

  processCheckoutCompleted(): void {
    const { enrollmentCheckboxValue, userEmail, eligible } =
      this.store.getState();

    log("Checking if user eligible for enrollment...", {
      enrollmentCheckboxValue,
      userEmail,
      eligible,
    });

    if (userEmail && eligible && enrollmentCheckboxValue && this.merchantId) {
      log("Launching enrollment iframe...");
      this.checkoutCompleted = new CheckoutCompleted({
        launchEnrollmentIframe: () => this.launchEnrollmentIframe(),
      });
    } else {
      if (!eligible) {
        log("not eligible for enrollment, skip");
      }
      if (!userEmail) {
        log("userEmail not found, skip");
      }
      if (!enrollmentCheckboxValue) {
        log("enrollmentCheckboxValue not found, skip");
      }
    }
  }

  processEmailInput(): void {
    const emailInputElem = document.getElementById(
      this.emailInputId
    ) as HTMLInputElement;
    const listenerAlreadyAdded = emailInputElem?.classList.contains(
      SkipifyClassNames.emailInput
    );
    if (!emailInputElem || listenerAlreadyAdded) {
      if (!emailInputElem) log("Email input not found.");
      return;
    }

    const { userEmail } = this.store.getState();

    if (!!emailInputElem.value && emailInputElem.value === userEmail) {
      // if email input already has a value, and it's the same as userEmail in store,
      // user most likely refreshed the shopify page or encountered a shopify validation error
      // we do not want to reset the store in this case
      log(
        "Email input value is same as userEmail, user most likely refreshed the page"
      );
    } else {
      log("No existing email value, resetting store");

      this.store.setState({
        userEmail: "",
        eligible: false,
        emailWhitelisted: false,
      }); // partially reset state before we're creates a new email listener

      log("Create a new amplitude session");

      const newSessionId = Date.now();

      this.amplitude.setSessionId(newSessionId); // reset amplitude session id

      log("New amplitude session id", this.amplitude.getSessionId());
    }

    // add email input listener
    this.emailInput = new EmailInput({
      node: emailInputElem,
      setUserEmail: (email) => {
        log("Email input on blur", email);
        this.setUserEmail(email);
      },
    });

    log("Email input found, listener added");
  }

  override async clearCart(): Promise<void> {
    try {
      const response = await fetch("/cart/clear.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      await response.json();
    } catch (error) {
      console.error("An error occurred while clearing the cart:", error);
    }
  }

  override async getCartData(): Promise<ShopifyLine[] | null> {
    try {
      const response = await fetch("/cart.js", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = (await response.json()) as ShopifyCart;

      // We cannot process all digital items cart for now
      // If every item in cart is a digital item (does not require shipping), leave the order for shopify to handle

      if (data.items.every((item) => item.requires_shipping === false)) {
        log("Every item in Cart does not requiring shipping, returning null");
        return null;
      }

      const transformedItems = data.items.map((item) => ({
        quantity: item.quantity,
        merchandise: {
          id: item.variant_id.toString(),
          product: {
            id: item.product_id.toString(),
          },
        },
      }));
      return transformedItems;
    } catch (error) {
      console.error("An error occurred while fetching the cart:", error);
      return null;
    }
  }

  processEnrollmentCheckbox(): void {
    const paymentButtonElem = document.querySelector(
      this.paymentButtonSelector
    ) as HTMLElement;
    const enrollmentCheckboxElem = document.getElementById(
      SkipifyElementIds.enrollmentCheckbox
    );

    const { eligible, userEmail } = this.store.getState();

    if (paymentButtonElem && !enrollmentCheckboxElem) {
      this.setEnrollmentCheckboxValue(true);

      log("Check if we should show the enrollment box", {
        eligible,
        userEmail,
      });

      if (userEmail && eligible) {
        this.enrollmentCheckbox = new EnrollmentCheckbox({
          node: paymentButtonElem,
          injectMethod: "insertBefore",
        });
      } else {
        if (!eligible) log("Not eligible for enrollment, skip");
        if (!userEmail) log("userEmail not found in store, skip");
      }
    }
  }

  override async getUserEnrollmentInformation() {
    log("Collecting user enrollment information...");

    const { userEmail } = this.store.getState();
    const shippingAddress = window.Shopify?.checkout?.shipping_address;
    const billingAddress = window.Shopify?.checkout?.billing_address;

    const address = shippingAddress || billingAddress;

    const phone = cleanPhoneNumber(
      shippingAddress?.phone || billingAddress?.phone
    );

    if (!userEmail) {
      log("User email [require] not found, skip");
      return Promise.resolve(null);
    }

    const enrollmentData: UserEnrollmentInformationType = {
      email: userEmail,
      phone: phone,
      shippingAddress: {
        phoneNumber: phone,
        address1: address?.address1 || "",
        address2: address?.address2 || "",
        city: address?.city || "",
        firstName: address?.first_name || "",
        lastName: address?.last_name || "",
        state: address?.province_code || "",
        zipCode: address?.zip || "",
      },
    };

    log("Enrollment data:", enrollmentData);

    return enrollmentData;
  }

  override async handleOrderCompleted(_externalOrderId: string): Promise<void> {
    log("Order Completed by Skipify...", { externalOrderId: _externalOrderId });
    this.skipifyCheckoutCompleted = true;
    this.clearCart();
    this.amplitude.reset();
  }

  override async setUserEmail(email: string) {
    log("Store email and lookup...", { email });
    if (!email) {
      return;
    }

    email = email.toLowerCase();

    const { testMode } = this.store.getState();
    this.store.setState({
      userEmail: email,
      eligible: false,
    });

    //override email whitelisting behaviour for testing for now
    //exact match for email is too strict,  using domain whitelisting for now
    if (testMode) {
      let isRemoteWhitelisted = false;

      try {
        isRemoteWhitelisted = await this.api.isEmailWhitelisted(email);
      } catch (error) {
        log("Error checking email whitelist with remote server", error);
      }
      const emailDomain = email.split("@")[1];

      const isDomainWhitelisted = this.whitelistedDomains.includes(emailDomain);

      const emailWhitelisted = isDomainWhitelisted || isRemoteWhitelisted;

      log("In test mode, checking if email is whitelisted", {
        email,
        emailWhitelisted,
      });
      this.store.setState({
        emailWhitelisted,
      });

      if (!emailWhitelisted) {
        return;
      }
    }

    if (this.lookupDisabled) {
      log("Lookup disabled, skip");
      return;
    }

    const cartData = await this.getCartData();

    if (cartData) {
      if (this.hasInitializedIframe) {
        this.messenger.lookupUser(email, cartData);
      } else {
        this.messenger.addUserToLookup(email, cartData);
      }
    } else {
      log("Cart data not found, skip");
    }
  }

  override async getCartTotal() {
    let total = 0;
    let subtotal = 0;

    // Depend on which stage of the checkout we are, the total price is in a different place

    if (window.Shopify.checkout) {
      total = parseFloat(window.Shopify.checkout.total_price);
    } else if (window.Shopify.Checkout) {
      total = window.Shopify.Checkout.totalPrice;
    }

    if (window.Shopify.checkout) {
      subtotal = parseFloat(window.Shopify.checkout.subtotal_price);
    } else if (window.Shopify.Checkout) {
      subtotal = window.Shopify.Checkout.estimatedPrice;
    }

    log("Getting cart total from Shopify...", { total, subtotal });
    return { total, subtotal };
  }
}

export default new ShopifySDK();
