import { SkipifyApi } from "./api";
import { IFRAME_ORIGIN, MESSAGE_NAMES, SkipifyElementIds } from "./constants";

export class Base {
  merchantId: string | null = null;
  merchant: any; // TODO Map all data we need from MMs
  observer: MutationObserver;
  api: SkipifyApi;
  iframeSource: Window | null;
  isIframeOpen: boolean;

  constructor() {
    /**
     * Get Merchant Id from script query params, if not present script will fail
     */
    this.getMerchantIdFromQuery();

    /**
     * All outside requests are handled by the SkipifyApi class
     */
    this.api = new SkipifyApi({ merchantId: this.merchantId });
    this.getMerchantFromApi();

    /**
     * Mutation observer used to enable Skipify features on checkout
     */
    this.observer = this.makeMutationObserver();
    this.iframeSource = null;
    this.isIframeOpen = true;
    this.start();
  }

  getMerchantIdFromQuery() {
    const scriptSrc = (document.currentScript as any).src;

    if (scriptSrc) {
      const queryParams = new URLSearchParams(new URL(scriptSrc).search);
      const merchantId = queryParams.get("merchantId");
      if (!merchantId) {
        throw new Error("Skipify SDK should be loaded with a MerchantId");
      }
      this.merchantId = merchantId;
    }
  }

  async getMerchantFromApi() {
    const merchantFromApi = await this.api.getMerchant();
    this.merchant = merchantFromApi;
  }

  start() {
    this.processDOM();
    this.observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    window.addEventListener("message", (e) => this.handleIframeMessage(e));
  }

  makeMutationObserver() {
    return new MutationObserver(() => {
      this.processDOM();
    });
  }

  processDOM() {
    console.warn("-- processDom should be overwritten by platform class");
  }

  handleIframeMessage(event: MessageEvent) {
    const { data, origin } = event;
    if (origin !== IFRAME_ORIGIN || !data) {
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
      default:
        return;
    }
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
}
