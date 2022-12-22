import { IFRAME_ORIGIN, MESSAGE_NAMES, SkipifyElementIds } from "./constants";

interface Props {
  clearCartCallback: () => Promise<void>;
  setEnrollmentCheckboxValue: (value: boolean) => void;
}

export class Messenger {
  iframeSource: Window | null = null;
  isIframeOpen = true;
  clearCartCallback: () => Promise<void>;
  setEnrollmentCheckboxValue;

  constructor({ clearCartCallback, setEnrollmentCheckboxValue }: Props) {
    this.setEnrollmentCheckboxValue = setEnrollmentCheckboxValue;
    this.clearCartCallback = clearCartCallback;
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
    const existingOverlay = document.getElementById(SkipifyElementIds.overlay);
    const existingIframe = document.getElementById(SkipifyElementIds.iframe);

    if (existingOverlay && existingIframe) {
      existingOverlay.style.display = "block";
      existingIframe.style.display = "block";
      return;
    }

    const overlayEl = document.createElement("div");
    overlayEl.id = SkipifyElementIds.overlay;
    overlayEl.style.display = "none";

    const iframeEl = document.createElement("iframe");
    iframeEl.id = SkipifyElementIds.iframe;
    iframeEl.src = iframeSrc;
    iframeEl.style.display = "none";
    overlayEl.appendChild(iframeEl);

    document.body.appendChild(overlayEl);
  }

  // This is the listener for the INIT message from the iframe.
  // Once we receive this message, we can start sending messages to the iframe source that we stored.
  listenerInit(event: MessageEvent) {
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
  listenerEnrollmentInfo(event: MessageEvent) {
    event.ports[0]?.postMessage({
      // TODO: This is where we would send the enrollment data to the iframe.
      // This should be fetched properly
      payload: { email: "captured@email.com", phone: "1234567890" },
      name: MESSAGE_NAMES.ENROLLMENT_INFO_RECEIVED,
    });
  }

  /**
   * Set up listener for when changing enrollment checkbox value from inside our enrollment checkbox Iframe
   */
  listenerEnrollmentValue(event: MessageEvent) {
    const { value } = event.data;
    this.setEnrollmentCheckboxValue(value);
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
    return this.clearCartCallback();
  }
}
