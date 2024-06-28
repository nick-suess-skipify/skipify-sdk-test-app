import {
  MESSAGE_NAMES,
  SkipifyCheckoutUrl,
} from '@checkout-sdk/shared/lib/constants';
import {
  launchHiddenIframe,
  hideIframe,
  changeIframeHeight,
  getBaseIframe,
  displayIframe,
} from '@checkout-sdk/shared/lib/utils/iframe';
import CustomSDK from './custom';
import {approvalEventMapper} from './data/eventMapper';

export class Messenger {
  iframe: HTMLIFrameElement | null = null;
  activeCheckoutId: string | null = null;
  activeCheckoutSuccess = false;

  constructor(private sdk: CustomSDK) {
    window.addEventListener('message', (e) => this.handleIframeMessage(e));
    this.requestDeviceId();
  }

  handleIframeMessage(event: MessageEvent) {
    const { data } = event;

    if (!data) {
      return;
    }

    switch (data.name) {
      case MESSAGE_NAMES.CLOSE_IFRAME:
        return this.listenerCloseIframe();
      case MESSAGE_NAMES.RESIZE_CONTAINER:
        return this.listenerIframeHeightChange(event);
      case MESSAGE_NAMES.CHECKOUT_BUTTON_TRIGGERED:
        return this.listenerCheckoutButtonTriggered(data);
      case MESSAGE_NAMES.DISPLAY_IFRAME:
        return this.listenerDisplayIframe();
      case MESSAGE_NAMES.ORDER_COMPLETED:
        return this.listenerOrderCompleted(event);
      default:
        return;
    }
  }

  lookupUser(email: string, listenerId: string) {
    const emailListener = this.sdk.emailListeners[listenerId];
    if (this.iframe && emailListener) {
      this.activeCheckoutId = listenerId;
      const payload = {
        email,
        cart: { merchantReference: emailListener.merchantRef },
      };

      this.iframe.contentWindow?.postMessage(
        {
          name: MESSAGE_NAMES.REQUEST_LOOKUP_DATA,
          payload,
        },
        SkipifyCheckoutUrl
      );
    }
  }

  requestDeviceId() {
    if (this.iframe) {
      this.iframe.contentWindow?.postMessage(
        {
          name: MESSAGE_NAMES.REQUEST_DEVICE_ID,
        },
        SkipifyCheckoutUrl
      );
    }
  }

  listenerCheckoutButtonTriggered(data: { id: string }) {
    if (data.id) {
      const iframe = getBaseIframe();
      const clickedButton = this.sdk.buttons[data.id];
      if (iframe && clickedButton) {
        this.activeCheckoutId = data.id;
        iframe.contentWindow?.postMessage(
          {
            name: MESSAGE_NAMES.CREATE_ORDER,
            payload: { cart: { merchantReference: clickedButton.merchantRef } },
          },
          SkipifyCheckoutUrl
        );
      }
    }
  }

  listenerCloseIframe() {
    if (this.activeCheckoutId) {
      // Trigger onClose UI callback
      const activeCheckout = this.getCurrentCheckout(this.activeCheckoutId)
      if (activeCheckout && activeCheckout.options?.onClose) {
        activeCheckout.options?.onClose(activeCheckout.merchantRef, this.activeCheckoutSuccess)
      }
    }
    this.activeCheckoutId = null;
    this.activeCheckoutSuccess = false;
    hideIframe();
    this.sdk.launchBaseIframe();
  }

  listenerOrderCompleted(event: MessageEvent) {
    const { payload } = event.data;
    const mappedPayload = approvalEventMapper(payload);
    if (this.activeCheckoutId) {
      this.activeCheckoutSuccess = true;
      // Trigger onApprove UI callback
      const activeCheckout = this.getCurrentCheckout(this.activeCheckoutId)
      if (activeCheckout && activeCheckout.options?.onApprove) {
        activeCheckout.options?.onApprove(activeCheckout.merchantRef, mappedPayload)
      }
    }
  }

  listenerDisplayIframe() {
    displayIframe();
  }

  listenerIframeHeightChange(event: MessageEvent) {
    const { payload } = event.data;

    if (!payload.height) {
      return;
    }

    changeIframeHeight(payload.height);
  }

  launchBaseIframe(iframeSrc: string) {
    const baseIframe = launchHiddenIframe(iframeSrc, false);
    if (baseIframe) {
      this.iframe = baseIframe;
    }
  }

  getCurrentCheckout(checkoutId: string) {
    if (this.sdk.buttons[checkoutId]) {
      return this.sdk.buttons[checkoutId]
    } else if (this.sdk.emailListeners[checkoutId]) {
      return this.sdk.emailListeners[checkoutId]
    }
    return null;
  }
}
