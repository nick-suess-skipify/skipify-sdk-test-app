import { Messenger, SkipifyApi } from "./utils";
import { store, defaultState } from "./state";
import { SkipifyCheckoutUrl, SDKVersion } from "./constants";
import { UserEnrollmentInformationType } from "./shared.types";

import "../styles/index.css";

export class Base {
  /**
   * Merchant data
   */
  merchantId: string | null = null;
  merchant: any; // TODO Map all data we need from MMs

  /**
   * Internal
   */
  observer: MutationObserver;
  hasLaunchedIframe = false; // Means the checkout iframe was launched
  hasInitializedIframe = false; // Means the checkout iframe is ready for communication
  isIframeInitialized = false;

  /**
   * Feature classes
   */
  api: SkipifyApi;
  messenger: Messenger;
  store;

  constructor() {
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
    this.getMerchantIdFromQuery();

    /**
     * Persisted state
     */
    this.store = store;

    /**
     * All outside requests are handled by the SkipifyApi class
     */
    this.api = new SkipifyApi({ merchantId: this.merchantId });

    /**
     * Messenger implements a communication system between Skipify SDK and Skipify Iframe
     */
    this.messenger = new Messenger({ base: this });

    /**
     * Mutation observer used to enable Skipify features on checkout
     */
    this.observer = this.makeMutationObserver();
    this.start();
  }

  getMerchantIdFromQuery() {
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

  async launchBaseIframe() {
    this.messenger.launchBaseIframe(
      `${SkipifyCheckoutUrl}/embed/${this.merchantId}/lookup`
    );
  }

  async launchEnrollmentIframe() {
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
    this.store.setState({
      ...defaultState,
    });
  }

  makeMutationObserver() {
    return new MutationObserver(() => {
      this.processDOM();
    });
  }

  /**
   * Setters
   */

  setEnrollmentCheckboxValue(value: boolean) {
    this.store.setState({
      enrollmentCheckboxValue: value,
    });
  }

  async setUserEmail(email: string) {
    this.store.setState({
      userEmail: email,
      eligible: false,
    });

    const cartData = await this.getCartData();
    this.messenger.lookupUser(email, cartData);
  }

  setHasLaunchedIframe(value: boolean) {
    this.hasLaunchedIframe = value;
  }

  setHasInitializedIframe(value: boolean) {
    this.hasInitializedIframe = value;
  }

  setIsIframeInitialized(value: boolean) {
    this.isIframeInitialized = value;
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

  async getCartData(): Promise<any> {
    console.warn("-- getCartData should be overwritten by platform class");
    return null;
  }

  async getUserEnrollmentInformation(): Promise<UserEnrollmentInformationType | null> {
    console.warn(
      "-- getUserEnrollmentInformation should be overwritten by platform class"
    );
    return null;
  }
}
