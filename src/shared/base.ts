import { SkipifyApi } from "./api";
import { Messenger } from "./messenger";
import { store, defaultState } from "./state";
import { UserEnrollmentInformationType } from "./shared.types";

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
    this.messenger = new Messenger({
      clearCartCallback: () => this.clearCart(),
      reset: () => this.reset(),
      getUserEnrollmentInformation: () => this.getUserEnrollmentInformation(),
      setEnrollmentCheckboxValue: (value) =>
        this.setEnrollmentCheckboxValue(value),
      setHasInitializedIframe: (value) => this.setHasInitializedIframe(value),
      setHasLaunchedIframe: (value) => this.setHasLaunchedIframe(value),
    });

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

  setUserEmail(email: string) {
    this.store.setState({
      userEmail: email,
    });
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

  async getUserEnrollmentInformation(): Promise<UserEnrollmentInformationType | null> {
    console.warn(
      "-- getUserEnrollmentInformation should be overwritten by platform class"
    );
    return Promise.resolve(null);
  }
}
