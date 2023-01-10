import { Base } from "../base";
import { IFRAME_ORIGIN, MESSAGE_NAMES, SkipifyElementIds } from "../constants";
import { UserEnrollmentInformationType } from "../shared.types";

interface Props {
  base: Base;
}

export class Messenger {
  iframeSource: Window | null = null;
  isIframeOpen = true;
  base: Base;
  // clearCartCallback: () => Promise<void>;
  // reset;
  // setEnrollmentCheckboxValue;
  // setHasInitializedIframe;
  // setHasLaunchedIframe;
  // getUserEnrollmentInformation;

  constructor({ base }: Props) {
    this.base = base;
    window.addEventListener("message", (e) => this.handleIframeMessage(e));
  }

  handleIframeMessage(event: MessageEvent) {
    const { data, origin } = event;

    // TODO Add back origin check once we have SDK components origins defined
    // if (origin != IFRAME_ORIGIN || !data)
    if (!data) {
      return;
    }

    switch (data.name) {
      case MESSAGE_NAMES.INIT:
        return this.listenerInit(event);
      case MESSAGE_NAMES.GET_ENROLLMENT_INFO:
        return this.listenerEnrollmentInfo(event);
      case MESSAGE_NAMES.CLOSE_IFRAME:
        return this.listenerCloseIframe();
      case MESSAGE_NAMES.RESIZE_CONTAINER:
        return this.listenerIframeHeightChange(event);
      case MESSAGE_NAMES.ENROLLMENT_VALUE_CHANGED:
        return this.listenerEnrollmentValue(event);
      case MESSAGE_NAMES.CLEAR_CART:
        return this.listenerClearCart();
      default:
        return;
    }
  }

  // The launchIframe function will create the iframe and overlay elements,
  // and then append them to the body. They will be hidden by default and will
  // be shown when the iframe sends the INIT message.
  launchIframe(iframeSrc: string) {
    this.base.setHasLaunchedIframe(true);
    const existingOverlay = document.getElementById(SkipifyElementIds.overlay);
    const existingIframe = document.getElementById(SkipifyElementIds.iframe);

    if (existingOverlay && existingIframe) {
      return;
    }

    const overlayEl = document.createElement("div");
    overlayEl.id = SkipifyElementIds.overlay;
    overlayEl.style.display = "block";

    const iframeEl = document.createElement("iframe");
    iframeEl.id = SkipifyElementIds.iframe;
    iframeEl.src = iframeSrc;
    iframeEl.style.display = "block";
    overlayEl.appendChild(iframeEl);

    document.body.appendChild(overlayEl);
  }

  // This is the listener for the INIT message from the iframe.
  // Once we receive this message, we can start sending messages to the iframe source that we stored.
  listenerInit(event: MessageEvent) {
    this.base.setHasInitializedIframe(true);
    this.iframeSource = event.source as Window;

    const iframeEl = document.getElementById(SkipifyElementIds.iframe);
    const overlayEl = document.getElementById(SkipifyElementIds.overlay);

    if (iframeEl && overlayEl) {
      iframeEl.style.display = "block";
      overlayEl.style.display = "block";

      // Added a setTimeout here to ensure that the opacity transition is applied
      setTimeout(() => {
        overlayEl.style.opacity = "1";
      }, 10);
    }
  }

  // Set up listener for the "get enrollment data" signal
  // This is a request-response, meaning that we receive a signal from the iframe,
  // and then we send a response back.
  async listenerEnrollmentInfo(event: MessageEvent) {
    const enrollmentData = await this.base.getUserEnrollmentInformation();

    if (!enrollmentData) {
      // An error occurred while fetching user information, not sending anything will trigger the iframe to close
      return;
    }

    event.ports[0]?.postMessage({
      payload: enrollmentData,
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
  listenerCloseIframe() {
    const overlayEl = document.getElementById(SkipifyElementIds.overlay);

    if (overlayEl) {
      document.body.removeChild(overlayEl);
    }

    this.isIframeOpen = false;
    this.base.reset();
  }

  listenerIframeHeightChange(event: MessageEvent) {
    const iframeEl = document.getElementById(SkipifyElementIds.iframe);

    const { payload } = event.data;

    if (!iframeEl || !payload.height) {
      return;
    }

    iframeEl.style.height = `${payload.height}px`;
  }

  async listenerClearCart(): Promise<void> {
    return this.base.clearCart();
  }
}
