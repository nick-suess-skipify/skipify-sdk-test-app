import { SkipifyApi } from "./api";
import { Messenger } from "./messenger";

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
  enrollmentCheckboxValue = true;

  /**
   * Feature classes
   */
  api: SkipifyApi;
  messenger: Messenger;

  constructor() {
    /**
     * Get Merchant Id from script query params, if not present script will fail
     */
    this.getMerchantIdFromQuery();

    /**
     * All outside requests are handled by the SkipifyApi class
     */
    this.api = new SkipifyApi({ merchantId: this.merchantId });
    this.getMerchantFromApi();

    /**
     * Messenger implements a communication system between Skipify SDK and Skipify Iframe
     */
    this.messenger = new Messenger({
      setEnrollmentCheckboxValue: this.setEnrollmentCheckboxValue,
      clearCartCallback: () => this.clearCart(),
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

  makeMutationObserver() {
    return new MutationObserver(() => {
      this.processDOM();
    });
  }

  processDOM() {
    console.warn("-- processDom should be overwritten by platform class");
  }

  setEnrollmentCheckboxValue(value: boolean) {
    this.enrollmentCheckboxValue = value;
  }

  async clearCart(): Promise<void> {
    console.warn("-- clearCart should be overwritten by platform class");
  }
}
