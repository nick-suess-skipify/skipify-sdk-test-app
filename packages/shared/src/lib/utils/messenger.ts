import { Base } from '../base';
import {
  IFRAME_ORIGIN,
  MESSAGE_NAMES,
  SkipifyElementIds,
  SkipifyClassNames,
  SkipifyCheckoutUrl,
} from '../constants';
import {
  getContainer,
  launchHiddenIframe,
  displayIframe,
  hideIframe,
  changeIframeHeight,
} from './iframe';
import { UserEnrollmentInformationType } from '../shared.types';
import { log } from '../../lib';

interface Props {
  base: Base;
}

export class Messenger {
  iframe: HTMLIFrameElement | null = null;
  iframeHeight = 0;
  base: Base;
  userToLookup: { email: string; cartData: unknown } | null = null;
  prevUserEmail: string | null = null;

  constructor({ base }: Props) {
    this.base = base;
    window.addEventListener('message', (e) => this.handleIframeMessage(e));
  }

  handleIframeMessage(event: MessageEvent) {
    const { data, origin } = event;

    if (origin?.match(/\.skipify\.com/) || origin === IFRAME_ORIGIN) {
      log('Received message from iframe', {
        name: data?.name,
        payload: data?.payload,
      });
    }

    // TODO Add back origin check once we have SDK components origins defined
    // if (origin != IFRAME_ORIGIN || !data)
    if (!data) {
      return;
    }

    switch (data.name) {
      case MESSAGE_NAMES.INIT:
        return this.listenerInit();
      case MESSAGE_NAMES.GET_ENROLLMENT_INFO:
        return this.listenerEnrollmentInfo(event);
      case MESSAGE_NAMES.CLOSE_IFRAME:
        return this.listenerCloseIframe(event);
      case MESSAGE_NAMES.RESIZE_CONTAINER:
        return this.listenerIframeHeightChange(event);
      case MESSAGE_NAMES.ENROLLMENT_VALUE_CHANGED:
        return this.listenerEnrollmentValue(event);
      case MESSAGE_NAMES.DISPLAY_IFRAME:
        return this.listenerDisplayIframe();
      case MESSAGE_NAMES.ENROLLMENT_ELIGIBLE:
        return this.listenerEnrollmentEligible();
      case MESSAGE_NAMES.LOOKUP_ERROR:
        return this.listenerLookupError();
      case MESSAGE_NAMES.ORDER_COMPLETED:
        return this.listenerOrderCompleted(event);
      case MESSAGE_NAMES.DEVICE_ID:
        return this.listenerDeviceId(event);
      default:
        return;
    }
  }

  // The launchIframe function will create the iframe and overlay elements,
  // and then append them to the body. They will be hidden by default.
  launchBaseIframe(iframeSrc: string) {
    const baseIframe = launchHiddenIframe(
      iframeSrc,
      this.base.hasInitializedIframe
    );
    if (baseIframe) {
      this.iframe = baseIframe;
    }
  }

  // This function launches the enrollment iframe, it also replaces the current lookup Iframe
  launchEnrollmentIframe(iframeSrc: string) {
    const existingIframe = document.getElementById(SkipifyElementIds.iframe);
    const existingContainer = document.getElementById(
      SkipifyElementIds.overlay
    );

    if (existingIframe && existingContainer) {
      // If already an enrollment iframe, just skip
      if (
        existingIframe.classList.contains(SkipifyClassNames.enrollmentIframe)
      ) {
        return;
      }
      existingContainer.removeChild(existingIframe);
    }

    const containerEl = existingContainer ?? getContainer();

    const iframeEl = document.createElement('iframe');
    iframeEl.allow = 'publickey-credentials-get *';
    iframeEl.style.border = 'none';
    iframeEl.id = SkipifyElementIds.iframe;
    iframeEl.classList.add(SkipifyClassNames.enrollmentIframe);
    iframeEl.src = iframeSrc;
    this.iframe = iframeEl;

    containerEl?.appendChild(iframeEl);

    displayIframe();
  }

  setSkipifyVersion(skipifyV2: boolean) {
    const iframe = document.getElementById(
      SkipifyElementIds.iframe
    ) as HTMLIFrameElement;
    if (iframe) {
      const payload = { skipifyV2 };

      log('Posting skipify v2 to iframe', {
        name: MESSAGE_NAMES.SET_SKIPIFY_VERSION,
        payload,
      });
      iframe.contentWindow?.postMessage(
        {
          name: MESSAGE_NAMES.SET_SKIPIFY_VERSION,
          payload,
        },
        SkipifyCheckoutUrl
      );

      if (skipifyV2) {
        this.iframe?.classList.add(SkipifyClassNames.skipifyV2);
      } else {
        this.iframe?.classList.remove(SkipifyClassNames.skipifyV2);
      }
    }
  }

  requestDeviceId() {
    const iframe = document.getElementById(
      SkipifyElementIds.iframe
    ) as HTMLIFrameElement;
    if (iframe) {
      iframe.contentWindow?.postMessage(
        {
          name: MESSAGE_NAMES.REQUEST_DEVICE_ID,
        },
        SkipifyCheckoutUrl
      );
    }
  }

  lookupUser(email: string, cart?: any) {
    if (email === this.prevUserEmail) {
      // Prevent lookup racing condition and sending multiple lookup requests on input blur
      return;
    }
    const iframe = document.getElementById(
      SkipifyElementIds.iframe
    ) as HTMLIFrameElement | null;
    if (iframe) {
      this.prevUserEmail = email;

      const payload = {
        email,
        cart: { items: cart },
        amplitudeSessionId: this.base.amplitude.getSessionId(), // override iframe's amplitude session id
      };

      log('Posting lookup data to iframe', {
        name: MESSAGE_NAMES.REQUEST_LOOKUP_DATA,
        payload,
      });

      iframe.contentWindow?.postMessage(
        {
          name: MESSAGE_NAMES.REQUEST_LOOKUP_DATA,
          payload,
        },
        SkipifyCheckoutUrl
      );
    }
  }

  listenerDisplayIframe() {
    if (this.base.skipifyV2Checkbox) {
      if (this.base.skipifyV2Checkbox.checked) {
        if (this.base.button) this.base.button.style.display = 'flex';
        this.base.positionIframe(true);
        window.addEventListener('resize', () => {
          this.base.positionIframe(true);
        });
        window.addEventListener('scroll', () => {
          this.base.positionIframe();
        });
      }
      //if we display the iframe, we aren't listening for version changes so disable the checkbox
      this.base.skipifyV2Checkbox.disabled = true;
    }
    displayIframe();
    this.base.setHasInitializedIframe(false);
    this.clearUserToLookup();
  }

  listenerEnrollmentEligible() {
    this.base.store.setState({
      eligible: true,
    });
    this.clearUserToLookup();
  }

  listenerLookupError() {
    this.closeIframe(true);
  }

  listenerOrderCompleted(event: MessageEvent) {
    const { orderId } = event.data.payload;
    this.base.handleOrderCompleted(orderId);
  }

  closeIframe(reload: boolean) {
    if (this.base.skipifyCheckoutCompleted) {
      this.base.skipifyCheckoutCompleted = false;
      window.location.assign(`/`);
    }

    if (reload) {
      this.resetIframe();
    } else {
      if (this.base.messenger.iframe) {
        this.base.messenger.iframe.style.height = '0';
      }
      hideIframe();
      this.prevUserEmail = null;
      this.clearUserToLookup();
    }
  }

  resetIframe() {
    hideIframe();
    this.base.setHasInitializedIframe(false);
    this.prevUserEmail = null;

    this.base.reset();
    this.base.launchBaseIframe();
    this.clearUserToLookup();
  }

  // This is the listener for the INIT message from the iframe.
  // Once we receive this message, we can start sending messages to the iframe source that we stored.
  listenerInit() {
    if (this.base.hasInitializedIframe) {
      return;
    }
    this.base.setHasInitializedIframe(true);
    this.setSkipifyVersion(localStorage.getItem('SKIPIFY_V2') === 'true');
    this.requestDeviceId(); // immediately request device id from iframe after iframe is initialized
    if (this.userToLookup) {
      const { email, cartData } = this.userToLookup;
      this.lookupUser(email, cartData);
    }
  }

  // Set up listener for the "get enrollment data" signal
  // This is a request-response, meaning that we receive a signal from the iframe,
  // and then we send a response back.
  async listenerEnrollmentInfo(event: MessageEvent) {
    const enrollmentData: UserEnrollmentInformationType | null =
      await this.base.getUserEnrollmentInformation();

    if (!enrollmentData) {
      // An error occurred while fetching user information, not sending anything will trigger the iframe to close
      console.error('-- Error getting enrollment information');
      return;
    }

    this.base.reset();

    const payload = {
      ...enrollmentData,
      amplitudeSessionId: this.base.amplitude.getSessionId(), // override iframe's amplitude session id, so it can stay at the same session even user refreshes the page
    };

    log('Posting enrollment data to iframe...', {
      name: MESSAGE_NAMES.ENROLLMENT_INFO_RECEIVED,
      payload,
    });

    event.ports[0]?.postMessage({
      payload,
      name: MESSAGE_NAMES.ENROLLMENT_INFO_RECEIVED,
    });
  }

  /**
   * Set up listener for when changing enrollment checkbox value from inside our enrollment checkbox Iframe
   */
  listenerEnrollmentValue(event: MessageEvent) {
    const { value } = event.data;
    this.base.setEnrollmentCheckboxValue(value);
  }

  // Set up listener for the "close iframe" signal
  // This is a one-way signal, meaning that we receive a signal from the iframe,
  // and then we do something in response.
  listenerCloseIframe(event: MessageEvent) {
    this.closeIframe(event.data.payload?.reload);
  }

  listenerIframeHeightChange(event: MessageEvent) {
    const { payload } = event.data;

    if (!payload.height) {
      return;
    }

    changeIframeHeight(payload.height);
    this.iframeHeight = payload.height;
  }

  addUserToLookup(email: string, cartData: any) {
    this.userToLookup = { email, cartData };
  }

  clearUserToLookup() {
    this.userToLookup = null;
  }

  listenerDeviceId(event: MessageEvent) {
    // we want to use the device id generated by the iframe (fingerprint js)
    const { deviceId } = event.data.payload;
    this.base.amplitude.setDeviceId(deviceId);
  }

  restoreIframeHeight() {
    if (this.iframeHeight) {
      changeIframeHeight(this.iframeHeight);
    }
  }
}
