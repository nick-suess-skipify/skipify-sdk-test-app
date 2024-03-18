import { SkipifyCheckoutUrl, SDKVersion } from '@checkout-sdk/shared/lib/constants';
import { Config } from './config';
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
  buttons: Record<string, Button> = {};
  emailListeners: Record<string, EmailListener> = {};

  constructor(config: any) {
    this.config = new Config(config);
    this.messenger = new Messenger(this);
    this.start();
  }

  // Static var to store SDK version
  static version = SDKVersion

  start() {
    this.launchBaseIframe();
  }

  async launchBaseIframe() {
    this.messenger.launchBaseIframe(
      `${SkipifyCheckoutUrl}/embed/${this.config.merchantId}/lookup`
    );
  }

  async lookupUser(email: string, listenerId: string) {
    this.messenger.lookupUser(email, listenerId)
  }

  public button(merchantRef: string) {
    const createdButton = new Button(this.config, merchantRef);
    this.buttons[createdButton.id] = createdButton;
    return createdButton;
  }

  public email(merchantRef: string) {
    const createdEmailListener = new EmailListener(this.config, merchantRef, (email, listenerId) => this.lookupUser(email, listenerId))
    this.emailListeners[createdEmailListener.id] = createdEmailListener;
    return createdEmailListener;
  }
}

window.skipify = CustomSDK;

export default CustomSDK;
