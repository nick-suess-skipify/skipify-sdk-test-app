import { SkipifyCheckoutUrl, SdkUrl } from '@checkout-sdk/shared/lib/constants';
import { Config } from './config';
import { Messenger } from './messenger';

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
    this.messenger = new Messenger();
    this.start();
  }

  start() {
    this.launchBaseIframe();
  }

  async launchBaseIframe() {
    this.messenger.launchBaseIframe(`${SkipifyCheckoutUrl}/embed/${this.config.merchantId}/lookup`);
  }

  checkoutButton(elem: HTMLElement, createOrder: () => any) {
    const wrapperEl = document.createElement('div');

    const checkoutButtonFrame = document.createElement('iframe');
    checkoutButtonFrame.style.border = 'none';
    checkoutButtonFrame.style.cursor = 'pointer';
    checkoutButtonFrame.style.height = '54px';
    const checkoutButtonUrl = `${SdkUrl}/shared/components/iframe_checkoutButton.html?date=${new Date().getTime()}`;
    checkoutButtonFrame.src = checkoutButtonUrl;

    this.messenger.buttonCheckoutCallback = createOrder;
    wrapperEl.appendChild(checkoutButtonFrame);

    elem.append(wrapperEl);
  }
}

window.CustomSDK = CustomSDK;

export default CustomSDK;
