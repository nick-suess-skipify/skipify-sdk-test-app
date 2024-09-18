import { SkipifyCheckoutUrl, SDKVersion, MESSAGE_NAMES, SimpleCheckoutUrl, FeatureFlags } from '@checkout-sdk/shared/lib/constants';
import { SkipifyApi, MerchantType } from '@checkout-sdk/shared';
import { Config, AdditionalOptions, MerchantOptions } from './config';
import { Messenger } from './messenger';
import { Button } from './button/button';
import { EmailListener } from './emailListener/emailListener';

import '@checkout-sdk/shared/lib/styles';
import { LaunchDarkly } from '@checkout-sdk/shared';

/*
 * This is the SDK for merchants
 * - on custom platforms
 * - or who want more flexibility and customization options
 *
 */

class CustomSDK {
  // Config
  config: Config;
  merchant: MerchantType | null = null;
  //  Helper classes
  messenger: Messenger;
  api: SkipifyApi;
  launchdarkly: LaunchDarkly | null = null;
  // Components
  buttons: Record<string, Button> = {};
  emailListeners: Record<string, EmailListener> = {};
  //  Internal
  skipifyLightFlag = false;
  routerV2Flag = false;
  skipifyLightActive = false;
  checkoutUrl: string;
  simpleCheckoutUrl: string;
  // Pending queue for button IDs
  pendingButtonIds: Record<string, boolean> = {};
  constructor(config: any) {
    // Validate initialization configs
    this.config = new Config(config);

    // Checkout Urls
    this.checkoutUrl = `${SkipifyCheckoutUrl}/embed/${this.config.merchantId}/lookup`
    this.simpleCheckoutUrl = `${SimpleCheckoutUrl}/embed/${this.config.merchantId}`

    // Initial setup
    this.messenger = new Messenger(this);
    this.api = new SkipifyApi({ merchantId: this.config.merchantId });
    this.start();
  }

  // Static var to store SDK version
  static version = SDKVersion

  start() {
    this.launchBaseIframe();
    this.getMerchant();
  }

  onButtonReady(buttonId: string): void {

    if (!this.merchant) {
      this.pendingButtonIds[buttonId] = true;
      return;
    }

    this.sendMerchantInfoToButton(buttonId);
  }

  private sendMerchantInfoToButton(buttonId: string): void {
    const contentWindow = this.buttons[buttonId]?.frame?.contentWindow;
    if (contentWindow) {
      contentWindow.postMessage({
        name: MESSAGE_NAMES.MERCHANT_PUBLIC_INFO_FETCHED,
        merchant: this.merchant
      }, "*");
    }
  }

  private processPendingButtons() {
    const pendingIds = Object.keys(this.pendingButtonIds);
    if (pendingIds.length === 0) {
      return;
    }

    pendingIds.forEach(buttonId => {
      this.sendMerchantInfoToButton(buttonId);
      delete this.pendingButtonIds[buttonId];
    });
  }



  async resetIframe() {
    if (this.skipifyLightActive) {
      this.messenger.launchLightBaseIframe(this.simpleCheckoutUrl)
    } else {
      this.messenger.launchBaseIframe(this.checkoutUrl);
    }
  }

  async launchBaseIframe() {
    await this.handleRouterFlag();
    this.messenger.launchBaseIframe(this.checkoutUrl);
  }

  async enableSkipifyLight() {
    this.skipifyLightActive = true;
    this.messenger.launchLightBaseIframe(this.simpleCheckoutUrl)
  }

  enableRouterV2() {
    this.checkoutUrl = `${SkipifyCheckoutUrl}/v2/embed/${this.config.merchantId}/lookup`;
  }

  async getMerchant() {
    let merchantPublicData;
    try {
      merchantPublicData = await this.api.getMerchant();
    } catch (e) {
      throw new Error(`Unable to retrieve merchant ${e}`);
    }
    this.merchant = merchantPublicData;
    // We only get the flags after merchant data is available
    this.handleSkipifyLightFlag();

    // Process any pending buttons that has not received merchant info
    this.processPendingButtons();
  }

  async getFlags(flagType: FeatureFlags) {
    if (!this.config.merchantId) {
      throw new Error('Merchant data not available');
    }
    
    this.launchdarkly = await LaunchDarkly.getInstance(this.config.merchantId);
    
    const flagValue = await this.launchdarkly.getVariation(flagType, false);
    return flagValue;
  }
  
  async handleRouterFlag() {
    const routerV2Flag = await this.getFlags(FeatureFlags.routerV2);
    if (routerV2Flag) {
      this.enableRouterV2();
    }
  }
  
  async handleSkipifyLightFlag() {
    const skipifyLightFlag = await this.getFlags(FeatureFlags.skipifyLight);
    if (skipifyLightFlag && this.merchant?.streamlinedFlowEligible) {
      this.enableSkipifyLight();
    }
  }

  async lookupUser(email: string, listenerId: string) {
    this.messenger.lookupUser(email, listenerId)
  }

  public button(merchantRef: string, buttonOptions?: AdditionalOptions) {
    const merchantOptions: MerchantOptions = {};

    if (this.merchant?.cobranding?.logoSrc) {
      merchantOptions.cobrandedLogo = this.merchant?.cobranding?.logoSrc
    }

    if (this.merchant?.cobranding?.buttonTheme) {
      merchantOptions.cobrandedButtonTheme = this.merchant?.cobranding?.buttonTheme
    }

    const createdButton = new Button(this.config, merchantRef, buttonOptions, merchantOptions);
    this.buttons[createdButton.id] = createdButton;
    return createdButton;
  }

  public email(merchantRef: string, emailOptions?: AdditionalOptions) {
    const createdEmailListener = new EmailListener(this.config, merchantRef, (email, listenerId) => this.lookupUser(email, listenerId), emailOptions)
    this.emailListeners[createdEmailListener.id] = createdEmailListener;
    return createdEmailListener;
  }
}

window.skipify = CustomSDK;

export default CustomSDK;
