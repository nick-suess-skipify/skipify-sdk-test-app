import { MESSAGE_NAMES, SkipifyCheckoutUrl, COMPONENT_LISTENER_IDS, SkipifyElementIds } from "@checkout-sdk/shared/lib/constants";
import { ShopperType } from "./embedded-components.types";
import { SkipifyError } from "./error";
import { launchHiddenIframe, launchIframe } from "./iframe";
import { AuthenticationResultType, LookupResponseType } from "./embedded-components.types";
import { log } from "@checkout-sdk/shared/lib/utils/log";

export class Messenger {
    iframe: HTMLIFrameElement | null = null;
    authIframe: HTMLIFrameElement | null = null;
    listenerReady = false;
    authData: { lookupData: any; options?: { phone?: string } } | null = null;

    // return promises
    lookupPromiseResolve: ((data: any) => void) | null = null;
    lookupPromiseReject: ((error: any) => void) | null = null;

    // auth promises
    authPromiseResolve: ((data: any) => void) | null = null;
    authPromiseReject: ((error: any) => void) | null = null;

    onAuthSuccessCallback: ((data: AuthenticationResultType) => void) | null = null;

    constructor() {
        window.addEventListener('message', (e) => this.handleIframeMessage(e));
    }

    handleIframeMessage(event: MessageEvent) {
        const { data, origin } = event;

        if (origin != SkipifyCheckoutUrl || !data) {
            return;
        }

        log('Received message:', data);

        switch (data.name) {
            case MESSAGE_NAMES.LISTENER_READY:
                return this.handleListenerReady(event);
            case MESSAGE_NAMES.LOOKUP_RESPONSE:
                return this.handleLookupResponse(event);
            case MESSAGE_NAMES.LOOKUP_ERROR:
                return this.handleLookupError(event);
            case MESSAGE_NAMES.DEVICE_ID:
                return this.handleDeviceId(event);
            case MESSAGE_NAMES.AUTH_COMPONENT_SUCCESS:
                return this.handleAuthSuccess(event);
            case MESSAGE_NAMES.AUTH_COMPONENT_ERROR:
                return this.handleAuthError(event);
            case MESSAGE_NAMES.RESIZE_CONTAINER:
                return this.handleResize(event);
            case MESSAGE_NAMES.CLOSE_IFRAME:
                return this.handleCloseIframe(event);
            default:
                return;
        }
    }

    launchBaseIframe(iframeSrc: string) {
        const baseIframe = launchHiddenIframe(iframeSrc);
        this.iframe = baseIframe;
    }

    handleListenerReady(event: MessageEvent) {
        this.listenerReady = true;
        // this.requestDeviceId(); // TODO add Iframe support to deviceId

        if (event.data.payload?.id === COMPONENT_LISTENER_IDS.AUTH_COMPONENT) {
            this.handleAuthListenerReady();
        }
    }

    requestDeviceId() {
        if (this.iframe) {
            const message = {
                name: MESSAGE_NAMES.REQUEST_DEVICE_ID,
            };
            log('Sending message:', message);
            this.iframe.contentWindow?.postMessage(message, SkipifyCheckoutUrl);
        }
    }

    handleDeviceId(event: MessageEvent) {
        // TODO add Iframe support to deviceId
    }

    handleLookupResponse(event: MessageEvent) {
        if (this.lookupPromiseResolve) {
            this.lookupPromiseResolve(event.data.payload);
            this.clearLookupPromises();
        }
    }

    handleLookupError(event: MessageEvent) {
        if (this.lookupPromiseReject) {
            this.lookupPromiseReject(new SkipifyError(event.data.payload));
            this.clearLookupPromises();
        }
    }

    clearLookupPromises() {
        this.lookupPromiseResolve = null;
        this.lookupPromiseReject = null;
    }

    async lookup(shopper: ShopperType) {
        if (!this.iframe) {
            return Promise.reject(new SkipifyError('Iframe is not available.'))
        }

        const payload = { email: shopper.email, phone: shopper.phone }
        const message = {
            name: MESSAGE_NAMES.REQUEST_LOOKUP_DATA,
            payload,
        };
        
        return new Promise((resolve, reject) => {
            this.lookupPromiseResolve = resolve;
            this.lookupPromiseReject = reject;

            log('Sending message:', message);
            this.iframe?.contentWindow?.postMessage(message, SkipifyCheckoutUrl);
        });
    }

    // Auth component

    launchAuthIframe(iframeSrc: string, container: HTMLElement, authData: { lookupData: LookupResponseType; options?: { phone?: string; sendOtp?: boolean } }) {
        this.authIframe = launchIframe(iframeSrc, SkipifyElementIds.authIframe, container);
        this.authData = authData;
    }

    handleAuthListenerReady() {
        if (this.authIframe && this.authData) {
            const message = {
                name: MESSAGE_NAMES.RECEIVE_COMPONENT_LOOKUP_DATA,
                payload: this.authData,
            };
            log('Sending message:', message);
            this.authIframe.contentWindow?.postMessage(message, SkipifyCheckoutUrl);
        }
    }

    handleAuthSuccess(event: MessageEvent) {
        const authResult: AuthenticationResultType = event.data.payload;
        if (this.onAuthSuccessCallback) {
            this.onAuthSuccessCallback(authResult);
        }
    }

    handleAuthError(event: MessageEvent) {
        if (this.authPromiseReject) {
            this.authPromiseReject(new SkipifyError(event.data.payload.error));
            this.clearAuthPromises();
        }
    }

    handleResize(event: MessageEvent) {
        if (this.authIframe && event.data.payload.id === COMPONENT_LISTENER_IDS.AUTH_COMPONENT) {
            this.authIframe.style.height = `${event.data.payload.height}px`;
        }
    }

    clearAuthPromises() {
        this.authPromiseResolve = null;
        this.authPromiseReject = null;
    }

    onAuthenticationSuccess(callback: (data: AuthenticationResultType) => void) {
        this.onAuthSuccessCallback = callback;
    }

    onAuthenticationError(callback: (error: any) => void) {
        this.authPromiseReject = callback;
    }

    handleCloseIframe(event: MessageEvent) {
        if (this.authIframe && event.data.payload.id === COMPONENT_LISTENER_IDS.AUTH_COMPONENT) {
            this.handleCloseAuthIframe();
        }
    }

    handleCloseAuthIframe() {
        // Simply remove the auth iframe for now
        // as currently we have no valid use cases for reusing the iframe
        if (this.authIframe) {
            this.authIframe.remove();
            this.authIframe = null;
        }
    }
}
