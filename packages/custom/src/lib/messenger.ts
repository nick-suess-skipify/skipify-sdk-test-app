import {
  MESSAGE_NAMES,
  SkipifyCheckoutUrl,
  SimpleCheckoutUrl,
  SkipifyClassNames
} from "@checkout-sdk/shared/lib/constants";
import {
  launchHiddenIframe,
  hideIframe,
  changeIframeHeight,
  getBaseIframe,
  displayIframe,
} from '@checkout-sdk/shared/lib/utils/iframe';
import CustomSDK from './custom';
import {approvalEventMapper} from './data/eventMapper';
import { Button } from './button/button';

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
    const buttonListener = this.sdk.buttons[listenerId];
    if (this.iframe && (emailListener || buttonListener)) {
      this.activeCheckoutId = listenerId;
      let payload;
      if (emailListener) {
        payload = {
          email,
          cart: { merchantReference: emailListener.merchantRef },
        };
      } else if (buttonListener) {
        payload = {
          email,
          phone: this.sdk.buttons[listenerId].options?.phone,
          cart: { merchantReference: buttonListener.merchantRef },
        };
      }
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
        const orderData: any = { 
          cart: { merchantReference: clickedButton.merchantRef },
          email: clickedButton.options?.email, 
          phone: clickedButton.options?.phone
        }

        // Skipify simple flow
        if (this.sdk.skipifyLightActive && clickedButton.options?.total) {
          orderData.cart.total = clickedButton.options?.total
          iframe.contentWindow?.postMessage(
            {
              name: MESSAGE_NAMES.CREATE_ORDER,
              payload: orderData,
            },
            SimpleCheckoutUrl
          );
        } else {
          // Regular checkout flow
          iframe.contentWindow?.postMessage(
            {
              name: MESSAGE_NAMES.CREATE_ORDER,
              payload: orderData,
            },
            SkipifyCheckoutUrl
          );
        }
      }
    }
  }

  async listenerCloseIframe() {
    if (this.activeCheckoutId) {
      // Trigger onClose UI callback
      const activeCheckout = this.getCurrentCheckout(this.activeCheckoutId)
      if (activeCheckout && activeCheckout.options?.onClose) {
        activeCheckout.options?.onClose(activeCheckout.merchantRef, this.activeCheckoutSuccess)
      }
    }
    this.activeCheckoutId = null;
    this.activeCheckoutSuccess = false;

    await hideIframe();
    // Give some time for the close animation to be shown
    setTimeout(() => {
      this.sdk.resetIframe();
    }, 500)
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

  launchLightBaseIframe(iframeSrc: string) {
    const baseIframe = launchHiddenIframe(iframeSrc, false);
    if (baseIframe) {
      this.iframe = baseIframe;
      //IDCH-184: Force layer style floating iframe for light/simple
      this.iframe?.classList.add(SkipifyClassNames.skipifyV2);
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
