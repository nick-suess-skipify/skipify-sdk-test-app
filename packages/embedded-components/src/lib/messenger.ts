import {
    MESSAGE_NAMES,
    SkipifyCheckoutUrl,
    COMPONENT_LISTENER_IDS,
    SkipifyElementIds,
    SKIPIFY_ANALYTICS_CONST,
    SDKOrigin,
} from '@checkout-sdk/shared/lib/constants';
import {
    CarouselErrorResponseType,
    CarouselResponseType,
    DeviceIdResponseType,
    ShopperType,
} from './embedded-components.types';
import { SkipifyError } from './error';
import { launchHiddenIframe, launchIframe, positionIframeInOverlay, removeUI } from './iframe';
import { AuthenticationResponseType, LookupResponseType } from './embedded-components.types';
import { log } from '@checkout-sdk/shared/lib/utils/log';
import EmbeddedComponentsSDK from './embedded-components';

interface Props {
    sdk: EmbeddedComponentsSDK;
}

export class Messenger {
    iframe: HTMLIFrameElement | null = null;
    authIframe: HTMLIFrameElement | null = null;
    clickToPayIframe: HTMLIFrameElement | null = null;
    listenerReady = false;
    authData: { lookupData: any; options?: { phone?: string; displayMode?: string; sendOtp?: boolean } } | null = null;
    sdk: EmbeddedComponentsSDK;

    // return promises
    lookupPromiseResolve: ((data: any) => void) | null = null;
    lookupPromiseReject: ((error: any) => void) | null = null;

    // auth promises
    authPromiseResolve: ((data: AuthenticationResponseType) => void) | null = null;
    authPromiseReject: ((error: { error: { message: string } }) => void) | null = null;

    // Carousel component
    carouselIframe: HTMLIFrameElement | null = null;
    carouselContainer: HTMLElement | null = null;
    carouselData: {
        skipifySessionId: string;
        lookupData?: LookupResponseType;
        authenticationResult?: AuthenticationResponseType;
        options?: {
            phone?: string;
            amount: number;
            sendOtp?: boolean;
            displayMode?: string;
            config?: {
                theme?: string;
                fontFamily?: string;
                fontSize?: string;
                inputFieldSize?: string;
            };
        };
    } | null = null;

    carouselPromiseResolve: ((data: CarouselResponseType) => void) | null = null;
    carouselPromiseReject: ((error: { error: { message: string } }) => void) | null = null;

    // device id promise
    deviceIdPromiseResolve: ((data: DeviceIdResponseType) => void) | null = null;

    constructor({ sdk }: Props) {
        this.sdk = sdk;
        window.addEventListener('message', (e) => this.handleIframeMessage(e));
    }

    handleIframeMessage(event: MessageEvent) {
        const { data, origin } = event;

        if (![SDKOrigin, SkipifyCheckoutUrl].includes(origin) || !data?.name) {
            return;
        }

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
            case MESSAGE_NAMES.CAROUSEL_COMPONENT_SUCCESS:
                return this.handleCarouselSelect(event);
            case MESSAGE_NAMES.CAROUSEL_COMPONENT_ERROR:
                return this.handleCarouselError(event);
            case MESSAGE_NAMES.RESET_ANALYTICS_TTL:
                return this.listenerResetAnalyticsTtl();
            case MESSAGE_NAMES.CTP_ACTION:
                return this.handleCtpAction(event);
            case MESSAGE_NAMES.CTP_ACTION_RESPONSE:
                return this.handleCtpActionResponse(event);
            case MESSAGE_NAMES.CTP_STATE_UPDATE:
                return this.handleCtpStateUpdate(event);
            case MESSAGE_NAMES.CTP_INITIAL_STATE:
                return this.handleCtpInitialState(event);
            case MESSAGE_NAMES.CTP_CHECKOUT_DIALOG:
                return this.handleCtpCheckoutDialog(event);
            default:
                return;
        }
    }

    // CTP Message Handlers

    /**
     * Forwards a message to the Click-to-Pay iframe
     */
    private forwardToClickToPayIframe(event: MessageEvent, logMessage?: string) {
        if (logMessage) {
            log(logMessage, event);
        }

        if (!this.clickToPayIframe?.contentWindow) {
            return;
        }

        this.clickToPayIframe.contentWindow.postMessage(event.data, SkipifyCheckoutUrl);
    }

    /**
     * Forwards a message to all local iframes (lookup, auth, carousel)
     */
    private forwardToAllLocalIframes(event: MessageEvent, logMessage?: string) {
        if (logMessage) {
            log(logMessage, event);
        }

        const localIframes = [
            { iframe: this.iframe, name: 'lookup' },
            { iframe: this.authIframe, name: 'auth' },
            { iframe: this.carouselIframe, name: 'carousel' }
        ];

        localIframes.forEach(({ iframe }) => {
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(event.data, SkipifyCheckoutUrl);
            }
        });
    }

    /**
     * Sets iframe styles for dialog open/close states
     */
    private setClickToPayDialogStyles(isOpen: boolean) {
        if (!this.clickToPayIframe) {
            return;
        }

        const styles = isOpen ? {
            display: 'block',
            visibility: 'visible',
            pointerEvents: 'auto',
            height: '100vh',
            width: '100vw',
            position: 'fixed',
            top: '0',
            left: '0',
            zIndex: '9999',
            border: 'none',
            backgroundColor: 'transparent'
        } : {
            visibility: 'hidden',
            pointerEvents: 'none',
            height: '0',
            width: '0',
            position: 'absolute',
            top: '0',
            left: '0',
            zIndex: '0',
            border: 'none',
            backgroundColor: 'transparent'
        };

        Object.assign(this.clickToPayIframe.style, styles);
    }

    private setOverlayStyles(isOpen: boolean) {
        const overlay = document.getElementById(SkipifyElementIds.overlay);
        if (!overlay) {
            return;
        }

        // Prevent multiple overlays from being shown when the CTP dialog is opened/closed
        // CTP dialog overlay open -> Skipify overlay hidden
        // CTP dialog overlay closed -> Skipify overlay visible
        const styles = isOpen ? {
            visibility: 'hidden',
        } : {
            visibility: 'visible',
        };

        Object.assign(overlay.style, styles);
    }

    handleCtpAction(event: MessageEvent) {
        this.forwardToClickToPayIframe(event);
    }

    handleCtpActionResponse(event: MessageEvent) {
        this.forwardToAllLocalIframes(event);
    }

    handleCtpStateUpdate(event: MessageEvent) {
        this.forwardToAllLocalIframes(event);
    }

    handleCtpInitialState(event: MessageEvent) {
        this.forwardToClickToPayIframe(event);
    }

    handleCtpCheckoutDialog(event: MessageEvent) {
        const { dialogOpen } = event.data;

        if (typeof dialogOpen !== 'boolean') {
            log('Invalid dialog state received:', event.data);
            return;
        }

        // Sometimes CTP sdk changes the body scroll position when the dialog is opened/closed
        if (!dialogOpen && this.carouselContainer && this.carouselData?.options?.displayMode === 'overlay') {
            this.carouselContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        this.setClickToPayDialogStyles(dialogOpen);
        this.setOverlayStyles(dialogOpen);
    }

    launchBaseIframe(iframeSrc: string) {
        const baseIframe = launchHiddenIframe(iframeSrc);
        this.iframe = baseIframe;
    }

    launchClickToPayIframe(iframeSrc: string) {
        const clickToPayIframe = launchHiddenIframe(iframeSrc, SkipifyElementIds.clickToPayIframe);
        this.clickToPayIframe = clickToPayIframe;
    }

    handleListenerReady(event: MessageEvent) {
        this.listenerReady = true;
        this.requestDeviceId(); // immediately request device id from iframe after iframe is initialized

        this.sdk.processLookupQueue();

        if (event.data.payload?.id === COMPONENT_LISTENER_IDS.AUTH_COMPONENT) {
            this.handleAuthListenerReady();
        } else if (event.data.payload?.id === COMPONENT_LISTENER_IDS.CAROUSEL_COMPONENT) {
            this.handleCarouselListenerReady();
        }
    }

    async requestDeviceId() {
        if (!this.iframe) return null;

        if (this.sdk.deviceId) {
            return { deviceId: this.sdk.deviceId };
        }

        const message = {
            name: MESSAGE_NAMES.REQUEST_DEVICE_ID,
        };
        log('Sending message:', message);
        this.iframe.contentWindow?.postMessage(message, SkipifyCheckoutUrl);

        return new Promise((resolve) => {
            this.deviceIdPromiseResolve = resolve;
        });
    }

    handleDeviceId(event: MessageEvent<{ payload: { deviceId: string } }>) {
        this.sdk.deviceId = event.data.payload.deviceId;
        if (this.deviceIdPromiseResolve) {
            this.deviceIdPromiseResolve(event.data.payload);
            this.deviceIdPromiseResolve = null;
        }
    }

    handleLookupResponse(event: MessageEvent) {
        if (this.lookupPromiseResolve) {
            this.lookupPromiseResolve(event.data.payload);
            this.clearLookupPromises();
        }
    }

    handleLookupError(event: MessageEvent) {
        if (this.lookupPromiseReject) {
            const error = new SkipifyError(event.data.payload);
            if (error.contains('404')) {
                error.error.message = 'Shopper not found';
            }

            this.lookupPromiseReject(error);
            this.clearLookupPromises();
        }
    }

    clearLookupPromises() {
        this.lookupPromiseResolve = null;
        this.lookupPromiseReject = null;
    }

    async lookup(shopper: ShopperType, options?: { skipifySessionId: string }) {
        if (!this.iframe) {
            return Promise.reject(new SkipifyError('Iframe is not available.'));
        }

        const payload = shopper.email
            ? { email: shopper.email, phone: shopper.phone, skipifySessionId: options?.skipifySessionId, deviceId: this.sdk.deviceId }
            : { skipifySessionId: options?.skipifySessionId, deviceId: this.sdk.deviceId };

        const message = {
            name: shopper.email ? MESSAGE_NAMES.REQUEST_LOOKUP_DATA : MESSAGE_NAMES.LOOKUP_BY_FINGERPRINT,
            payload,
        };

        return new Promise((resolve, reject) => {
            this.lookupPromiseResolve = resolve;
            this.lookupPromiseReject = reject;

            log('Sending message:', message);
            this.iframe?.contentWindow?.postMessage(message, SkipifyCheckoutUrl);
        });
    }

    handleReposition() {
        positionIframeInOverlay();
    }

    handleCloseIframe(event: MessageEvent) {
        if (this.authIframe && event.data.payload.id === COMPONENT_LISTENER_IDS.AUTH_COMPONENT) {
            this.handleCloseAuthIframe();
        }
        if (this.carouselIframe && event.data.payload.id === COMPONENT_LISTENER_IDS.CAROUSEL_COMPONENT) {
            this.handleCloseCarouselIframe();
        }
        removeUI();
    }

    // Auth component

    launchAuthIframe(
        iframeSrc: string,
        container: HTMLElement,
        authData: {
            skipifySessionId: string;
            lookupData: LookupResponseType;
            options?: {
                phone?: string;
                sendOtp?: boolean;
                displayMode?: string;
                config?: { theme?: string; fontFamily?: string; fontSize?: string; inputFieldSize?: string };
            };
        },
    ) {
        this.authIframe = launchIframe(
            iframeSrc,
            SkipifyElementIds.authIframe,
            container,
            authData.options?.displayMode,
        );
        this.authData = authData;

        window.addEventListener('scroll', this.handleReposition);
        window.addEventListener('resize', this.handleReposition);
    }

    handleAuthListenerReady() {
        if (this.authIframe && this.authData) {
            const message = {
                name: MESSAGE_NAMES.RECEIVE_COMPONENT_LOOKUP_DATA,
                payload: { ...this.authData, deviceId: this.sdk.deviceId },
            };
            log('Sending message:', message);
            this.authIframe.contentWindow?.postMessage(message, SkipifyCheckoutUrl);
        }
    }

    handleAuthSuccess(event: MessageEvent) {
        if (this.authPromiseResolve) {
            this.authPromiseResolve(event.data.payload);
        }
    }

    handleAuthError(event: MessageEvent) {
        if (this.authPromiseReject) {
            this.authPromiseReject(event.data.payload);
        }
    }

    clearAuthPromises() {
        this.authPromiseResolve = null;
        this.authPromiseReject = null;
    }

    handleResize(event: MessageEvent) {
        if (this.authIframe && event.data.payload.id === COMPONENT_LISTENER_IDS.AUTH_COMPONENT) {
            this.authIframe.style.height = `${event.data.payload.height}px`;
        } else if (this.carouselIframe && event.data.payload.id === COMPONENT_LISTENER_IDS.CAROUSEL_COMPONENT) {
            this.carouselIframe.style.height = `${event.data.payload.height}px`;
        } else if (this.carouselIframe && event.data.payload.id === COMPONENT_LISTENER_IDS.AUTH_COMPONENT) {
            // This is to handle auth + carousel combo iframe resize message
            this.carouselIframe.style.height = `${event.data.payload.height}px`;
        }
    }

    onAuthenticationSuccess(callback: (data: AuthenticationResponseType) => void) {
        this.authPromiseResolve = callback;
    }

    onAuthenticationError(callback: (error: { error: { message: string } }) => void) {
        this.authPromiseReject = callback;
    }

    handleCloseAuthIframe() {
        // Simply remove the auth iframe for now
        // as currently we have no valid use cases for reusing the iframe
        if (this.authIframe) {
            this.authIframe.remove();
            this.authIframe = null;
        }
        this.clearAuthPromises();
        window.removeEventListener('scroll', this.handleReposition);
        window.removeEventListener('resize', this.handleReposition);
    }

    listenerResetAnalyticsTtl() {
        this.sdk.ttlStorage.updateExpiry(SKIPIFY_ANALYTICS_CONST.LOCAL_STORAGE_KEY, SKIPIFY_ANALYTICS_CONST.TTL);
    }

    // Carousel component

    launchCarouselIframe(iframeSrc: string, container: HTMLElement, carouselData: typeof this.carouselData) {
        this.carouselIframe = launchIframe(
            iframeSrc,
            SkipifyElementIds.carouselIframe,
            container,
            carouselData?.options?.displayMode,
        );
        this.carouselData = carouselData;
        this.carouselContainer = container;

        if (carouselData?.options?.displayMode === 'overlay') {
            window.addEventListener('scroll', this.handleReposition);
            window.addEventListener('resize', this.handleReposition);
        }
    }

    handleCarouselListenerReady() {
        if (this.carouselIframe && this.carouselData) {
            const message = {
                name: MESSAGE_NAMES.RECEIVE_COMPONENT_CAROUSEL_DATA,
                payload: { ...this.carouselData, deviceId: this.sdk.deviceId },
            };
            log('Sending message:', message);
            this.carouselIframe.contentWindow?.postMessage(message, SkipifyCheckoutUrl);
        }
    }

    onCarouselSelect(callback: (data: CarouselResponseType) => void) {
        this.carouselPromiseResolve = callback;
    }

    onCarouselError(callback: (error: CarouselErrorResponseType) => void) {
        this.carouselPromiseReject = callback;
    }

    handleCarouselSelect(event: MessageEvent) {
        if (this.carouselPromiseResolve) {
            this.carouselPromiseResolve(event.data.payload);
        }
    }

    handleCarouselError(event: MessageEvent) {
        if (this.carouselPromiseReject) {
            this.carouselPromiseReject(event.data.payload);
        }
    }

    clearCarouselPromises() {
        this.carouselPromiseResolve = null;
        this.carouselPromiseReject = null;
    }

    handleCloseCarouselIframe() {
        if (this.carouselIframe) {
            this.carouselIframe.remove();
            this.carouselIframe = null;
        }
        this.clearCarouselPromises();
        window.removeEventListener('scroll', this.handleReposition);
        window.removeEventListener('resize', this.handleReposition);
    }
}
