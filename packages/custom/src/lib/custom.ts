import { SkipifyCheckoutUrl } from '@checkout-sdk/shared/lib/constants';
import { Config } from './config';
import { Messenger } from './messenger';
import { Button } from './button/button';

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

  constructor(config: any) {
    this.config = new Config(config);
    this.messenger = new Messenger(this);
    this.start();
  }

  start() {
    this.launchBaseIframe();
  }

  async launchBaseIframe() {
    this.messenger.launchBaseIframe(
      `${SkipifyCheckoutUrl}/embed/${this.config.merchantId}/lookup`
    );
  }

  public button(options: { createOrder: () => any }) {
    return new Button(this.config, this.messenger, options);
  }
}

window.skipify = CustomSDK;

export default CustomSDK;
