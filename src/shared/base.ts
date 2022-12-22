import { SkipifyApi } from "./api";
import { Messenger } from "./messenger";

export class Base {
  merchantId: string | null = null;
  merchant: any; // TODO Map all data we need from MMs
  observer: MutationObserver;
  api: SkipifyApi;
  messenger: Messenger;
  userEmail: string | null = null;
  user: {
    transactionId: string;
    isPhoneRequired: boolean;
    email: string;
  };

  constructor() {
    /**
     * Get Merchant Id from script query params, if not present script will fail
     */
    this.getMerchantIdFromQuery();

    /**
     * initiate empty user
     */
    this.user = {
      transactionId: "",
      isPhoneRequired: false,
      email: "",
    };

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

  async getUserFromLookup(email: string) {
    const user: {
      transactionId: string;
      isPhoneRequired: boolean;
    } = await this.api.emailLookup(email);
    this.user = { ...user, email };
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

  async clearCart(): Promise<void> {
    console.warn("-- clearCart should be overwritten by platform class");
  }
}
