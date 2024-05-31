import { SkipifyCheckoutUrl, SDKVersion, MESSAGE_NAMES } from '@checkout-sdk/shared/lib/constants';
import { SkipifyApi, MerchantType } from '@checkout-sdk/shared';
import { Config, AdditionalOptions, MerchantOptions } from './config';
import { Messenger } from './messenger';
import { Button } from './button/button';
import { EmailListener } from './emailListener/emailListener';

import '@checkout-sdk/shared/lib/styles';

/*
 * This is the SDK for merchants
 * - on custom platforms
 * - or who want more flexibility and customization options
 *
 */

class CustomSDK {
  config: Config;
  messenger: Messenger;
  api: SkipifyApi;
  merchant: MerchantType | null = null;
  buttons: Record<string, Button> = {};
  emailListeners: Record<string, EmailListener> = {};

  constructor(config: any) {
    this.config = new Config(config);
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

  async launchBaseIframe() {
    this.messenger.launchBaseIframe(
      `${SkipifyCheckoutUrl}/embed/${this.config.merchantId}/lookup`
    );
  }

  async getMerchant() {
    let merchantPublicData;
    try {
      merchantPublicData = await this.api.getMerchant();
    } catch (e) {
      throw new Error(`Unable to retrieve merchant ${e}`);
    }
    this.merchant = merchantPublicData;

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
