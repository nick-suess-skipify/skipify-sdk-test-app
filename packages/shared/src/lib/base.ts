import { Messenger, SkipifyApi, Amplitude, roundByDPR, log, showCheckIcon } from './utils';
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
  isSkipifyResumable = false;

  useButtonCheckout = false; // for samsung demo
  checkoutButton: Element | null = null; // for samsung demo
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

  /**
   * Skipify Layer
   *
   */
  shouldDisplayOnTop = false;

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
     * Experiential code for samsung demo, determine if we use button checkout or not
     */
    this.getUseButtonCheckout();

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

  /**
   * Check current script url and look for useButtonCheckout flag, if = true and have force device id, update base setting
   */
  getUseButtonCheckout() {
    // Get the current script element
    const currentScript = document.currentScript as HTMLScriptElement | null;
    const forceDeviceId = localStorage.getItem('skipify_force_device_id');

    if (currentScript && currentScript.src && forceDeviceId) {
      // Extract the URL of the current script
      const scriptUrl = new URL(currentScript.src);

      // Get query parameters from the script URL
      const urlParams = new URLSearchParams(scriptUrl.search);
      const useButtonCheckoutParam = urlParams.get('useButtonCheckout');

      // Set the class property based on the parameter
      this.useButtonCheckout = useButtonCheckoutParam === 'true';
    }
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

    // skip launch lookup iframe if we are on enrollment flow
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

    if (!this.button || !document.body.contains(this.button)) {
      this.messenger.resetIframeStyles();
      return;
    }
    let buttonPosition = this.button.getBoundingClientRect();

    if (
      !buttonPosition ||
      !document.body.classList.contains(SkipifyClassNames.body) // avoid calculation position if the iframe is not visible
    ) {
      return;
    }

    const totalHeight = document.documentElement.scrollHeight;
    const totalWidth = window.innerWidth;

    const buttonAbsolutePosition = buttonPosition.top + window.scrollY;
    this.shouldDisplayOnTop = buttonAbsolutePosition > totalHeight / 2;

    if (shouldScroll) {
      const scrollY = this.shouldDisplayOnTop
        ? buttonAbsolutePosition +
          buttonPosition.height -
          window.innerHeight +
          16
        : buttonAbsolutePosition - 16;

      window.scrollTo({ top: scrollY, behavior: 'smooth' });
      buttonPosition = this.button.getBoundingClientRect();
    }

    if (this.shouldDisplayOnTop) {
      this.messenger.iframe.style.bottom =
        window.innerHeight - buttonPosition.top + 16 + 'px';
    } else {
      this.messenger.iframe.style.bottom = '';
    }

    const { width: iframeWidth } =
      this.messenger.iframe.getBoundingClientRect();

    const translateX =
      totalWidth > 490
        ? Math.max(roundByDPR(buttonPosition.right - iframeWidth), 36)
        : totalWidth > iframeWidth
        ? roundByDPR((totalWidth - iframeWidth) / 2)
        : 0;
    const translateY = this.shouldDisplayOnTop
      ? 0
      : roundByDPR(buttonPosition.bottom + 16);
    const remainingSpace = this.shouldDisplayOnTop
      ? buttonPosition.top
      : roundByDPR(window.innerHeight - buttonPosition.bottom);

    const maxHeight = Math.max(remainingSpace - 24, 0);

    this.messenger.iframe.style.left = '0';
    this.messenger.iframe.style.transform = `translate(${translateX}px, ${translateY}px)`;
    this.messenger.iframe.style.maxHeight = `${maxHeight}px`;

    const arrowIframe = document.getElementById(SkipifyElementIds.iframeArrow);
    const arrowPositionX = roundByDPR(buttonPosition.x + 9);
    const arrowPositionY = this.shouldDisplayOnTop
      ? roundByDPR(buttonPosition.top - 36)
      : roundByDPR(translateY - 5);
    if (arrowIframe) {
      arrowIframe.style.display = 'block';
      arrowIframe.style.transform = `translate(${arrowPositionX}px, ${arrowPositionY}px)`;
    }
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

    email = email.trim().toLowerCase();

    const { testMode, userEmail } = this.store.getState();
    if (email === userEmail) {
      log('User email is the same as what stored in store, aborting setUserEmail');
      return;
    }

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

  setSkipifyResumable(value: boolean) {
    this.isSkipifyResumable = value;
  }

  insertButton(emailInput: HTMLElement) {
    const wrapper = document.createElement('div');
    wrapper.id = SkipifyElementIds.emailWrapper;
    if (!this.button) {
      this.button = document.createElement('button');
      this.button.type = 'button';
      this.button.id = SkipifyElementIds.checkButton;
      this.button.innerHTML = `<svg id="_SKIPIFY_expand_more_icon" style="display: none;" viewBox="0 0 24 24" data-testid="ExpandMoreIcon"><path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg>
      <svg id="_SKIPIFY_check_icon" style="display: block;" viewBox="0 0 24 24" data-testid="CheckIcon"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`;
      this.button.onclick = (e) => {
        e.preventDefault();
        displayIframe();
        if(this.store.getState().flags?.skipifyLayer) {
          // Only show the check icon on V2 - as on V1 the iframe is covering the button no need to change back n forth.
          showCheckIcon();
          // Only position iframe (the V2 positioning) if on V2 - if not leave the same
          this.positionIframe(true);
        } 
        this.messenger.restoreIframeHeight();
      };
    }
    const buttonSize = emailInput.getBoundingClientRect().height - 4;
    this.button.style.width = `${buttonSize}px`;
    this.button.style.height = `${buttonSize}px`;

    const emailStyles = window.getComputedStyle(emailInput);

    const stylePropertiesToCopy = [
      'border-top-right-radius',
      'border-top-left-radius',
      'border-bottom-right-radius',
      'border-bottom-left-radius',
    ];

    for (const property of stylePropertiesToCopy) {
      const borderRadius = emailStyles.getPropertyValue(property);
      if (borderRadius) {
        const borderRadiusValue = parseFloat(
          borderRadius.replace(/px|em|rem|%/, '')
        );
        this.button.style.setProperty(
          property,
          `${buttonSize / borderRadiusValue}%`
        );
      }
    }

    this.button.style.display = this.isSkipifyResumable ? 'flex' : 'none';
    emailInput.parentNode?.replaceChild(wrapper, emailInput);
    wrapper.appendChild(emailInput);
    wrapper.appendChild(this.button);
  }

  get isSkipifyLayerEnabled() {
    return Boolean(this.store.getState().flags?.skipifyLayer);
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
