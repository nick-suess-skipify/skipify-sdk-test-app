import { Messenger, SkipifyApi, Amplitude, roundByDPR } from './utils';
import { store, defaultState } from './state';
import {
  SkipifyCheckoutUrl,
  SDKVersion,
  SkipifyElementIds,
  SkipifyClassNames,
} from './constants';
import { UserEnrollmentInformationType, MerchantType } from './shared.types';
import { Analytics, FlowType } from './analytics';

import { displayIframe } from './utils/iframe';
import './styles/index.css';

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

  /**
   * Elements
   *
   */
  button?: HTMLButtonElement;
  skipifyV2 = false;

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

  setSkipifyV2(enable: boolean) {
    this.skipifyV2 = enable;
  }

  getMerchantIdFromQuery(merchantId?: string) {
    if (merchantId) {
      this.merchantId = merchantId;
      return;
    }

    const scriptSrc = (document.currentScript as any).src;

    if (scriptSrc) {
      const queryParams = new URLSearchParams(new URL(scriptSrc).search);
      const merchantId = queryParams.get('merchantId');
      if (!merchantId) {
        throw new Error('Skipify SDK should be loaded with a MerchantId');
      }
      this.merchantId = merchantId;
    }
  }

  async getMerchant() {
    let merchantPublicData;
    try {
      merchantPublicData = await this.api.getMerchant();
    } catch (e) {
      throw new Error(`Unable to retrieve merchant ${e}`);
    }
    this.merchant = merchantPublicData;

    this.store.setState({
      testMode: merchantPublicData.checkoutTestMode,
    });
  }

  async launchBaseIframe() {
    const existingIframe = document.getElementById(
      SkipifyElementIds.iframe
    ) as HTMLIFrameElement;

    // skip launch lookup iframe if we are on enrollment flow, they
    if (
      existingIframe?.classList.contains(SkipifyClassNames.enrollmentIframe)
    ) {
      return;
    }

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

  positionIframe(shouldScroll = false) {
    if (!this.messenger.iframe) return;

    const buttonPosition = this.button?.getBoundingClientRect();
    if (shouldScroll && buttonPosition?.y) {
      window.scrollBy(0, roundByDPR(buttonPosition.y - 16));
    }

    const iframeSize = this.messenger.iframe.getBoundingClientRect();
    if (!buttonPosition || !iframeSize) return;

    const translateX = Math.max(
      roundByDPR(buttonPosition.right - iframeSize.width),
      0
    );
    const translateY = roundByDPR(buttonPosition.bottom + 16);
    const remainingSpace = roundByDPR(window.innerHeight - translateY);
    const maxHeight = Math.max(remainingSpace - 24, 0);

    this.messenger.iframe.style.transform = `translate(${translateX}px, ${translateY}px)`;
    this.messenger.iframe.style.maxHeight = `${maxHeight}px`;
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

  insertButton(emailInput: HTMLElement) {
    const wrapper = document.createElement('div');
    wrapper.id = SkipifyElementIds.emailWrapper;
    const parent = emailInput.parentNode;
    this.button = document.createElement('button');
    this.button.id = SkipifyElementIds.checkButton;
    this.button.style.width = `${emailInput.getBoundingClientRect().height}px`;
    this.button.innerHTML = `<svg id="_SKIPIFY_check_icon" viewBox="0 0 24 24" data-testid="ExpandMoreIcon"><path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg>`;
    this.button.onclick = (e) => {
      e.preventDefault();
      displayIframe();
      this.positionIframe(true);
    };
    parent?.replaceChild(wrapper, emailInput);
    wrapper.appendChild(emailInput);
    wrapper.appendChild(this.button);
  }

  /**
   * Overwritten methods
   */

  processDOM() {
    console.warn('-- processDom should be overwritten by platform class');
  }

  async clearCart(): Promise<void> {
    console.warn('-- clearCart should be overwritten by platform class');
  }

  async handleOrderCompleted(externalOrderId: string): Promise<void> {
    console.warn(
      `-- handleOrderCompleted ${externalOrderId} should be overwritten by platform class`
    );
  }

  async getCartData(): Promise<any> {
    console.warn('-- getCartData should be overwritten by platform class');
    return null;
  }

  async getCartTotal(): Promise<{ total: number; subtotal: number }> {
    console.warn('-- getCartTotal should be overwritten by platform class');
    return { total: 0, subtotal: 0 };
  }

  async getUserEnrollmentInformation(): Promise<UserEnrollmentInformationType | null> {
    console.warn(
      '-- getUserEnrollmentInformation should be overwritten by platform class'
    );
    return null;
  }
}
