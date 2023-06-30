import { Base } from "../base";
import {
  IFRAME_ORIGIN,
  MESSAGE_NAMES,
  SkipifyElementIds,
  SkipifyClassNames,
  SkipifyCheckoutUrl,
} from "../constants";
import { UserEnrollmentInformationType } from "../shared.types";

interface Props {
  base: Base;
}

export class Messenger {
  iframe: HTMLIFrameElement | null = null;
  base: Base;
  userToLookup: { email: string; cartData: any } | null = null;
  prevUserEmail: string | null = null;

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
        return this.listenerInit();
      case MESSAGE_NAMES.GET_ENROLLMENT_INFO:
        return this.listenerEnrollmentInfo(event);
      case MESSAGE_NAMES.CLOSE_IFRAME:
        return this.listenerCloseIframe();
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
      default:
        return;
    }
  }

  getContainer() {
    const overlayEl = document.createElement("div");
    overlayEl.id = SkipifyElementIds.overlay;
    overlayEl.style.display = "none";
    overlayEl.style.opacity = "0";

    document.body.appendChild(overlayEl);
    return overlayEl;
  }

  // The launchIframe function will create the iframe and overlay elements,
  // and then append them to the body. They will be hidden by default.
  launchBaseIframe(iframeSrc: string) {
    const existingIframe = document.getElementById(SkipifyElementIds.iframe);
    const existingContainer = document.getElementById(
      SkipifyElementIds.overlay
    );

    if (existingIframe) {
      return;
    }

    let containerEl = existingContainer;
    if (!existingContainer) {
      containerEl = this.getContainer() as HTMLElement;
    }

    const iframeEl = document.createElement("iframe");
    iframeEl.style.border = "none";
    iframeEl.id = SkipifyElementIds.iframe;
    iframeEl.src = iframeSrc;
    this.iframe = iframeEl;

    containerEl?.appendChild(iframeEl);
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

    let containerEl = existingContainer;
    if (!existingContainer) {
      containerEl = this.getContainer() as HTMLElement;
    }

    const iframeEl = document.createElement("iframe");
    iframeEl.style.border = "none";
    iframeEl.id = SkipifyElementIds.iframe;
    iframeEl.classList.add(SkipifyClassNames.enrollmentIframe);
    iframeEl.src = iframeSrc;
    this.iframe = iframeEl;

    containerEl?.appendChild(iframeEl);

    this.displayIframe();
  }

  lookupUser(email: string, cart?: any) {
    if (email === this.prevUserEmail) {
      // Prevent lookup racing condition and sending multiple lookup requests on input blur
      return;
    }
    const iframe = document.getElementById(
      SkipifyElementIds.iframe
    ) as HTMLIFrameElement;
    if (iframe) {
      this.prevUserEmail = email;
      iframe.contentWindow?.postMessage(
        {
          name: MESSAGE_NAMES.REQUEST_LOOKUP_DATA,
          payload: { email, cart },
        },
        SkipifyCheckoutUrl
      );
    }
  }

  displayIframe() {
    // Track sdk initiation
    this.base.trackSdkInitiated();

    const existingOverlay = document.getElementById(SkipifyElementIds.overlay);

    if (existingOverlay) {
      document.body.classList.add(SkipifyClassNames.body);
      existingOverlay.style.display = "block";

      // Added a setTimeout here to ensure that the opacity transition is applied
      setTimeout(() => {
        existingOverlay.style.opacity = "1";
      }, 10);
    }
  }

  listenerDisplayIframe() {
    this.displayIframe();
    this.clearUserToLookup();
  }

  listenerEnrollmentEligible() {
    this.base.store.setState({
      eligible: true,
    });
    this.clearUserToLookup();
  }

  listenerLookupError() {
    this.closeIframe();
  }

  listenerOrderCompleted(event: MessageEvent) {
    const { orderId } = event.data.payload;
    this.base.handleOrderCompleted(orderId);
  }

  closeIframe() {
    if (this.base.skipifyCheckoutCompleted) {
      this.base.skipifyCheckoutCompleted = false;
      window.location.assign(`/`);
    }
    const overlayEl = document.getElementById(SkipifyElementIds.overlay);

    if (overlayEl) {
      document.body.removeChild(overlayEl);
    }

    this.base.setHasInitializedIframe(false);
    this.prevUserEmail = null;

    document.body.classList.remove(SkipifyClassNames.body);
    this.base.reset();
    this.base.launchBaseIframe();
    this.clearUserToLookup();
  }

  // This is the listener for the INIT message from the iframe.
  // Once we receive this message, we can start sending messages to the iframe source that we stored.
  listenerInit() {
    this.base.setHasInitializedIframe(true);
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
      console.error("-- Error getting enrollment information");
      return;
    }

    this.base.reset();

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
    this.closeIframe();
  }

  listenerIframeHeightChange(event: MessageEvent) {
    const iframeEl = document.getElementById(SkipifyElementIds.iframe);

    const { payload } = event.data;

    if (!iframeEl || !payload.height) {
      return;
    }

    iframeEl.style.height = `${payload.height}px`;
  }

  addUserToLookup(email: string, cartData: any) {
    this.userToLookup = { email, cartData };
  }

  clearUserToLookup() {
    this.userToLookup = null;
  }
}
