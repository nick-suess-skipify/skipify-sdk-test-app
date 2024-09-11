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
  skipifyLightActive = false;
  checkoutUrl: string;
  simpleCheckoutUrl: string;

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

  async resetIframe() {
    if (this.skipifyLightActive) {
      this.messenger.launchLightBaseIframe(this.simpleCheckoutUrl)
    } else {
      this.messenger.launchBaseIframe(this.checkoutUrl);
    }
  }

  async launchBaseIframe() {
    this.messenger.launchBaseIframe(this.checkoutUrl);
  }

  async enableSkipifyLight() {
    this.skipifyLightActive = true;
    this.messenger.launchLightBaseIframe(this.simpleCheckoutUrl)
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
    this.getFlags();

    // Notify already mounted components
    Object.values(this.buttons).forEach(button => {
      if (button.frame && button.frame.contentWindow) {
        button.frame.contentWindow.postMessage({
          name: MESSAGE_NAMES.MERCHANT_PUBLIC_INFO_FETCHED,
          merchant: merchantPublicData
        }, "*")
      }
    })
  }

  async getFlags() {
    if (!this.config.merchantId) {
      throw new Error('Merchant data not available');
    }
    this.launchdarkly = await LaunchDarkly.getInstance(this.config.merchantId);
    this.skipifyLightFlag = await this.launchdarkly.getVariation(FeatureFlags.skipifyLight, false);

    if (this.skipifyLightFlag && this.merchant?.streamlinedFlowEligible) {
      this.enableSkipifyLight()
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
