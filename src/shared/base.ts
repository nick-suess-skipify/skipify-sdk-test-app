import { Messenger, SkipifyApi } from "./utils";
import { store, defaultState } from "./state";
import { SkipifyCheckoutUrl, SDKVersion } from "./constants";
import { UserEnrollmentInformationType, SkipifyAuthUser } from "./shared.types";

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
    this.getMerchantFromApi();

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

  async getMerchantFromApi() {
    const merchantFromApi = await this.api.getMerchant();
    this.merchant = merchantFromApi;
  }

  async isExistingUser(email: string) {
    if (!email) {
      // Update state when searching an empty email
      this.store.setState({
        isExistingUser: false,
        transactionId: "",
      });
      return false;
    }

    const skipifyUser: SkipifyAuthUser = await this.api.emailLookup(email);

    this.store.setState({
      isExistingUser: skipifyUser && !skipifyUser.isPhoneRequired,
      transactionId: skipifyUser && skipifyUser.transactionId,
    });

    // Means it's an existing user, therefore the complete checkout flow should be triggered
    return skipifyUser && !skipifyUser.isPhoneRequired;
  }

  async existingUserCheck(email: string) {
    const isExistingUser = await this.isExistingUser(email);

    if (isExistingUser) {
      const cartData = await this.getCartData();

      if (!cartData) {
        console.warn("-- Cant get cart data from platform");
        return;
      }

      const createdOrder = await this.api.createOrder(cartData);

      this.messenger.launchIframe(
        `${SkipifyCheckoutUrl}/embed/${this.merchantId}/checkout/${createdOrder.id}`
      );
    }
  }

  start() {
    this.processDOM();
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
    });
    await this.existingUserCheck(email);
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
