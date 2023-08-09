import { Messenger, SkipifyApi, Amplitude } from "./utils";
import { store, defaultState } from "./state";
import { SkipifyCheckoutUrl, SDKVersion } from "./constants";
import { UserEnrollmentInformationType, MerchantType } from "./shared.types";
import { Analytics, BaseEventProperties, FlowType } from "./analytics";

import "./styles/index.css";

declare global {
  interface Window {
    BigCommerceSDK: any;
    CustomSDK: any;
  }
}

export class Base {
  /**
   * Merchant data
   */
  merchantId: string | null = null;
  merchant: MerchantType | null = null;

  /**
   * Internal
   */
  observer: MutationObserver;
  hasInitializedIframe = false; // Means the checkout iframe is ready for communication
  skipifyCheckoutCompleted = false; // Means the order was processed through Skipify

  /**
   * Feature classes
   */
  api: SkipifyApi;
  messenger: Messenger;
  amplitude: Amplitude;
  store;

  constructor(merchantId?: string) {
    /**
     * Add values like SDK version to the window object
     * It's useful when debugging
     */
    (window as any).SkipifyCheckout = {
      SDKVersion: SDKVersion,
    };

    /**
     * Get Merchant Id from script query params, if not present script will fail
     */
    this.getMerchantIdFromQuery(merchantId);

    /**
     * Persisted state
     */
    this.store = store;

    /**
     * All outside requests are handled by the SkipifyApi class
     */
    this.api = new SkipifyApi({ merchantId: this.merchantId });
    this.getMerchant();

    /**
     * Messenger implements a communication system between Skipify SDK and Skipify Iframe
     */
    this.messenger = new Messenger({ base: this });

    /**
     * Amplitude implements analytic track requests
     */
    this.amplitude = new Amplitude();

    /**
     * Mutation observer used to enable Skipify features on checkout
     */
    this.observer = this.makeMutationObserver();
    this.start();
  }

  getMerchantIdFromQuery(merchantId?: string) {
    if (!!merchantId) {
      this.merchantId = merchantId;
      return;
    }

    const scriptSrc = (document.currentScript as any).src;

    if (scriptSrc) {
      const queryParams = new URLSearchParams(new URL(scriptSrc).search);
      const merchantId = queryParams.get("merchantId");
      if (!merchantId) {
        throw new Error("Skipify SDK should be loaded with a MerchantId");
      }
      this.merchantId = merchantId;
    }
  }

  async getMerchant() {
    const merchantPublicData = await this.api.getMerchant();
    this.merchant = merchantPublicData;

    this.store.setState({
      testMode: merchantPublicData.checkoutTestMode,
    });
  }

  async launchBaseIframe() {
    this.messenger.launchBaseIframe(
      `${SkipifyCheckoutUrl}/embed/${this.merchantId}/lookup`
    );
  }

  async launchEnrollmentIframe() {
    this.canProceedCheck();

    this.messenger.launchEnrollmentIframe(
      `${SkipifyCheckoutUrl}/embed/${this.merchantId}/enroll`
    );
  }

  start() {
    this.processDOM();
    this.launchBaseIframe();
    this.observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  reset() {
    this.store.setState((prev) => ({
      ...defaultState,
      testMode: prev.testMode, // We don't want to reset this value
    }));
  }

  makeMutationObserver() {
    return new MutationObserver(() => {
      this.processDOM();
    });
  }

  /**
   * Analytics
   */

  async trackSdkInitiated() {
    const { userEmail } = this.store.getState();
    await this.amplitude.identify(userEmail);
    const { total, subtotal } = await this.getCartTotal();

    const properties = {
      flow_type: FlowType.egc,
      user_id: userEmail,
      email: userEmail,
      merchant_id: this.merchantId,
      merchant_name: this.merchant?.branding?.displayName,
      parent_merchant_id: this.merchant?.topLevelMerchantId,
      total,
      subtotal,
    };

    this.amplitude.track(new Analytics.sdkInitiatedEvent(properties));
  }

  async trackEnrollmentUnchecked() {
    const { userEmail } = this.store.getState();
    await this.amplitude.identify(userEmail);
    const { total, subtotal } = await this.getCartTotal();

    const properties = {
      flow_type: FlowType.enrollment,
      user_id: userEmail,
      email: userEmail,
      merchant_id: this.merchantId,
      merchant_name: this.merchant?.branding?.displayName,
      parent_merchant_id: this.merchant?.topLevelMerchantId,
      total,
      subtotal,
    };

    this.amplitude.track(new Analytics.enrollmentUncheckedEvent(properties));
  }

  /**
   * Setters
   */

  setEnrollmentCheckboxValue(value: boolean) {
    if (!value) {
      this.trackEnrollmentUnchecked();
    }

    this.store.setState({
      enrollmentCheckboxValue: value,
    });
  }

  async setUserEmail(email: string) {
    if (!email) {
      return;
    }

    const { testMode } = this.store.getState();
    this.store.setState({
      userEmail: email,
      eligible: false,
    });

    const cartData = await this.getCartData();

    if (testMode) {
      const emailWhitelisted = await this.api.isEmailWhitelisted(email);
      this.store.setState({
        emailWhitelisted,
      });
      if (!emailWhitelisted) {
        return;
      }
    }

    if (this.hasInitializedIframe) {
      this.messenger.lookupUser(email, cartData);
    } else {
      this.messenger.addUserToLookup(email, cartData);
    }
  }

  canProceedCheck() {
    const { testMode, emailWhitelisted } = this.store.getState();
    if (testMode && !emailWhitelisted) {
      throw new Error("can't proceed, aborting");
    }
  }

  setHasInitializedIframe(value: boolean) {
    this.hasInitializedIframe = value;
  }

  /**
   * Overwritten methods
   */

  processDOM() {
    console.warn("-- processDom should be overwritten by platform class");
  }

  async clearCart(): Promise<void> {
    console.warn("-- clearCart should be overwritten by platform class");
  }

  async handleOrderCompleted(externalOrderId: string): Promise<void> {
    console.warn(
      `-- handleOrderCompleted ${externalOrderId} should be overwritten by platform class`
    );
  }

  async getCartData(): Promise<any> {
    console.warn("-- getCartData should be overwritten by platform class");
    return null;
  }

  async getCartTotal(): Promise<{ total: number; subtotal: number }> {
    console.warn("-- getCartTotal should be overwritten by platform class");
    return { total: 0, subtotal: 0 };
  }

  async getUserEnrollmentInformation(): Promise<UserEnrollmentInformationType | null> {
    console.warn(
      "-- getUserEnrollmentInformation should be overwritten by platform class"
    );
    return null;
  }
}
