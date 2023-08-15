import { MESSAGE_NAMES, SkipifyCheckoutUrl } from '@checkout-sdk/shared/lib/constants';
import {
  launchHiddenIframe,
  closeIframe,
  changeIframeHeight,
  getBaseIframe,
} from '@checkout-sdk/shared/lib/utils/iframe';

export class Messenger {
  iframe: HTMLIFrameElement | null = null;
  buttonCheckoutCallback: (() => any) | null = null;

  constructor() {
    window.addEventListener('message', (e) => this.handleIframeMessage(e));
  }

  handleIframeMessage(event: MessageEvent) {
    const { data, origin } = event;

    if (!data) {
      return;
    }

    switch (data.name) {
      case MESSAGE_NAMES.CLOSE_IFRAME:
        return this.listenerCloseIframe();
      case MESSAGE_NAMES.RESIZE_CONTAINER:
        return this.listenerIframeHeightChange(event);
      case MESSAGE_NAMES.CHECKOUT_BUTTON_TRIGGERED:
        return this.listenerCheckoutButtonTriggered(event);
      default:
        return;
    }
  }

  listenerCheckoutButtonTriggered(event: MessageEvent) {
    if (this.buttonCheckoutCallback) {
      const checkoutData = this.buttonCheckoutCallback();
      console.log(checkoutData);

      const iframe = getBaseIframe();
      if (iframe) {
        iframe.contentWindow?.postMessage(
          {
            name: MESSAGE_NAMES.CREATE_ORDER,
            payload: { cart: { items: checkoutData } },
          },
          SkipifyCheckoutUrl
        );
      }
    }
  }

  listenerCloseIframe() {
    closeIframe();
  }

  listenerIframeHeightChange(event: MessageEvent) {
    const { payload } = event.data;

    if (!payload.height) {
      return;
    }

    changeIframeHeight(payload.height);
  }

  launchBaseIframe(iframeSrc: string) {
    const baseIframe = launchHiddenIframe(iframeSrc);
    if (baseIframe) {
      this.iframe = baseIframe;
    }
  }
}
