import { MESSAGE_NAMES, SkipifyCheckoutUrl } from "@checkout-sdk/shared/lib/constants";
import { ShopperType } from "./embedded-components.types";
import { SkipifyError } from "./error";
import { launchHiddenIframe } from "./iframe";

export class Messenger {
    iframe: HTMLIFrameElement | null = null;
    listenerReady = false;

    // return promises
    lookupPromiseResolve: ((data: any) => void) | null = null;
    lookupPromiseReject: ((error: any) => void) | null = null;

    constructor() {
        window.addEventListener('message', (e) => this.handleIframeMessage(e));
    }

    handleIframeMessage(event: MessageEvent) {
        const { data, origin } = event;

        if (origin != SkipifyCheckoutUrl || !data) {
            return;
        }

        switch (data.name) {
            case MESSAGE_NAMES.LISTENER_READY:
                return this.handleListenerReady();
            case MESSAGE_NAMES.LOOKUP_RESPONSE:
                return this.handleLookupResponse(event);
            case MESSAGE_NAMES.LOOKUP_ERROR:
                return this.handleLookupError(event);
            case MESSAGE_NAMES.DEVICE_ID:
                return this.handleDeviceId(event);
            default:
                return;
        }
    }

    launchBaseIframe(iframeSrc: string) {
        const baseIframe = launchHiddenIframe(iframeSrc);
        this.iframe = baseIframe;
    }

    handleListenerReady() {
        this.listenerReady = true;
        // this.requestDeviceId(); // TODO add Iframe support to deviceId
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

        return new Promise((resolve, reject) => {
            this.lookupPromiseResolve = resolve;
            this.lookupPromiseReject = reject;

            this.iframe?.contentWindow?.postMessage(
                {
                    name: MESSAGE_NAMES.REQUEST_LOOKUP_DATA,
                    payload,
                },
                SkipifyCheckoutUrl
            );
        });
    }
}
