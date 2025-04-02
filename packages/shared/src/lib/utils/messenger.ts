import { Base } from '../base';
import {
    MESSAGE_NAMES,
    SkipifyElementIds,
    SkipifyClassNames,
    SkipifyCheckoutUrl,
    SKIPIFY_ANALYTICS_CONST,
    SDKOrigin,
} from '../constants';
import { getContainer, launchHiddenIframe, displayIframe, hideIframe, changeIframeHeight } from './iframe';
import { UserEnrollmentInformationType, PlatformCartType } from '../shared.types';
import {
    hideLoader,
    log,
    removeCheckmarkButton,
    showExpandIcon,
    showCheckIcon,
    showCheckmarkButton,
    EventType,
    EventPropertiesMap,
} from '../../lib';

interface Props {
    base: Base;
}

export class Messenger {
    iframe: HTMLIFrameElement | null = null;
    iframeHeight = 0;
    base: Base;
    userToLookup: { email: string; phone?: string; cartData: PlatformCartType } | null = null;
    prevUserEmail: string | null = null;
    userRecognizedByDeviceId: boolean | null = null;
    hasIframeReloaded = false;

    constructor({ base }: Props) {
        this.base = base;
        window.addEventListener('message', (e) => this.handleIframeMessage(e));
    }

    handleIframeMessage(event: MessageEvent) {
        const { data, origin } = event;

        if (![SDKOrigin, SkipifyCheckoutUrl].includes(origin) || !data?.name) {
            return;
        }

        log('Received message from iframe', {
            name: data?.name,
            payload: data?.payload,
        });

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
            case MESSAGE_NAMES.CLEAR_ORDER:
                return this.clearOid();
            case MESSAGE_NAMES.SEND_LD_FLAGS:
                return this.setFlags(event);
            case MESSAGE_NAMES.LOOKUP_BY_FINGERPRINT_RESULT:
                return this.handleDeviceIdLookupResult(event);
            case MESSAGE_NAMES.RESET_ANALYTICS_TTL:
                return this.listenerResetAnalyticsTtl();
            default:
                return;
        }
    }

    handleDeviceIdLookupResult(event: MessageEvent) {
        this.userRecognizedByDeviceId = event.data.payload.customerDeviceRecognized;
    }
    // The launchIframe function will create the iframe and overlay elements,
    // and then append them to the body. They will be hidden by default.
    launchBaseIframe(iframeSrc: string) {
        let wrapperElem;
        if (this.base.isSkipifyEmbedEnabled) {
            wrapperElem = this.base.getEmbedContainer();
        }

        const baseIframe = launchHiddenIframe(iframeSrc, this.base.hasInitializedIframe, wrapperElem);
        if (baseIframe) {
            this.iframe = baseIframe;
        }
    }

    listenerResetAnalyticsTtl() {
        this.base.ttlStorage.updateExpiry(SKIPIFY_ANALYTICS_CONST.LOCAL_STORAGE_KEY, SKIPIFY_ANALYTICS_CONST.TTL);
    }

    // This function launches the enrollment iframe, it also replaces the current lookup Iframe
    launchEnrollmentIframe(iframeSrc: string) {
        const existingIframe = document.getElementById(SkipifyElementIds.iframe);
        const existingContainer = document.getElementById(SkipifyElementIds.overlay);

        if (existingIframe && existingContainer) {
            // If already an enrollment iframe, just skip
            if (existingIframe.classList.contains(SkipifyClassNames.enrollmentIframe)) {
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

    requestDeviceId() {
        if (this.iframe) {
            this.iframe.contentWindow?.postMessage(
                {
                    name: MESSAGE_NAMES.REQUEST_DEVICE_ID,
                },
                SkipifyCheckoutUrl,
            );
        }
    }

    trackEvent<T extends EventType>(type: T, event_properties?: EventPropertiesMap[T]) {
        if (this.iframe) {
            this.iframe.contentWindow?.postMessage(
                {
                    name: MESSAGE_NAMES.TRACK_EVENT,
                    payload: {
                        type,
                        event_properties,
                    },
                },
                SkipifyCheckoutUrl,
            );
        }
    }

    hasEmailBeenLookedUp(email: string): boolean {
        return email === this.prevUserEmail;
    }

    lookupUser(email: string, phone?: string, cart?: PlatformCartType) {
        if (!cart) {
            return;
        }
        if (this.hasEmailBeenLookedUp(email)) {
            // Prevent lookup racing condition and sending multiple lookup requests on input blur
            return;
        }
        if (this.iframe) {
            this.prevUserEmail = email;
            const payload: any = {
                email,
                cart: { items: cart.items, cartId: cart.cartId },
                skipifySessionId: this.base.skipifyEvents.getSessionId(), // override iframe's skipify session id
            };

            if (phone) {
                payload.phone = phone;
            }

            log('Posting lookup data to iframe', {
                name: MESSAGE_NAMES.REQUEST_LOOKUP_DATA,
                payload,
            });

            this.iframe.contentWindow?.postMessage(
                {
                    name: MESSAGE_NAMES.REQUEST_LOOKUP_DATA,
                    payload,
                },
                SkipifyCheckoutUrl,
            );
        }
    }

    /**
     * Trying to lookup a user by the device fingerprint
     * We pull cart data from the this.base.getCartData upon the call of this method
     */
    async lookupByFingerprint(useButtonCheckout = false) {
        const cart = await this.base.getCartData();
        // if user has been recognized, we don't keed to send the request again
        if (cart && this.iframe && !this.userRecognizedByDeviceId && !this.hasIframeReloaded) {
            const payload = {
                skipifySessionId: this.base.skipifyEvents.getSessionId(), // override iframe's skipify session id
                cart: { items: cart.items, cartId: cart.cartId },
                buttonCheckout: useButtonCheckout ? true : undefined,
            };

            log('Posting lookup by fingerprint data to iframe', {
                name: MESSAGE_NAMES.LOOKUP_BY_FINGERPRINT,
                payload,
            });

            this.iframe.contentWindow?.postMessage(
                {
                    name: MESSAGE_NAMES.LOOKUP_BY_FINGERPRINT,
                    payload,
                },
                SkipifyCheckoutUrl,
            );
        }
    }

    // for samsung demo, send create order directly to iframe
    async createOrder() {
        const cart = await this.base.getCartData();
        if (cart && this.iframe) {
            const payload = {
                cart: {
                    items: cart.items,
                    cartId: cart.cartId,
                },
            };

            log('Posting create-order message to iframe', {
                name: MESSAGE_NAMES.CREATE_ORDER,
                payload,
            });

            this.iframe.contentWindow?.postMessage(
                {
                    name: MESSAGE_NAMES.CREATE_ORDER,
                    payload,
                },
                SkipifyCheckoutUrl,
            );
        }
    }

    positionListener = () => {
        this.base.positionIframe();
    };

    listenerDisplayIframe() {
        displayIframe();
        this.base.onIframeDisplay();

        const activeElement = document.activeElement;
        if (
            activeElement?.classList.contains(SkipifyClassNames.emailInput) &&
            activeElement instanceof HTMLInputElement
        ) {
            activeElement.blur();
        }
        if (this.base.isSkipifyLayerEnabled) {
            // Skipify Layer
            if (this.base.button) {
                showCheckIcon();
                this.base.button.style.display = 'flex';
            }
            window.removeEventListener('resize', this.positionListener);
            window.addEventListener('resize', this.positionListener);
            window.removeEventListener('scroll', this.positionListener);
            window.addEventListener('scroll', this.positionListener);
            this.base.positionIframe(true);
        } else {
            // Skipify v1
            this.resetIframeStyles();
            window.removeEventListener('resize', this.positionListener);
            window.removeEventListener('scroll', this.positionListener);
        }
        this.base.setHasInitializedIframe(false);
        this.base.setSkipifyResumable(true);
        this.clearUserToLookup();
    }

    listenerEnrollmentEligible() {
        this.base.store.setState({
            eligible: true,
        });
        // Parallelogram logic
        hideLoader();
        this.clearUserToLookup();
    }

    listenerLookupError() {
        // Parallelogram logic
        hideLoader();
        this.closeIframe(true);
    }

    listenerOrderCompleted(event: MessageEvent) {
        const { orderId } = event.data.payload;
        this.base.handleOrderCompleted(orderId);
    }

    closeIframe(reload: boolean) {
        if (this.base.skipifyCheckoutCompleted) {
            this.base.skipifyCheckoutCompleted = false;
            window.location.replace(`/`);
        }

        this.base.onIframeClose(this.base.skipifyCheckoutCompleted);

        if (reload) {
            this.hasIframeReloaded = true;
            this.resetIframe();
        } else {
            if (this.iframe) {
                this.iframe.style.height = '0';
            }
            hideIframe();
            if (this.base.isSkipifyLayerEnabled) {
                showExpandIcon(this.base.shouldDisplayOnTop);
            }
            this.prevUserEmail = null;
            this.clearUserToLookup();
        }
    }

    resetIframeStyles() {
        if (this.iframe?.style.left) {
            this.iframe?.style.removeProperty('left');
            this.iframe?.style.removeProperty('transform');
            this.iframe?.style.removeProperty('maxHeight');
            const arrowIframe = document.getElementById(SkipifyElementIds.iframeArrow);
            if (arrowIframe) {
                arrowIframe.style.display = 'none';
            }
        }
    }

    resetIframe() {
        hideIframe();
        this.base.setHasInitializedIframe(false);
        this.base.setSkipifyResumable(false);
        if (this.base.button) this.base.button.style.display = 'none';
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

        if (!this.base.canShowIframe()) return;
        this.requestDeviceId(); // immediately request device id from iframe after iframe is initialized
        if (this.userToLookup) {
            const { email, phone, cartData } = this.userToLookup;
            this.lookupUser(email, phone, cartData);
        } else {
            // Since we do not have a user to lookup by email, try to lookup by device
            // We will pull a cart from the base
            this.lookupByFingerprint(this.base.useButtonCheckout);
        }
        //Enable checkmarkhtml if present
        showCheckmarkButton();
    }

    // Set up listener for the "get enrollment data" signal
    // This is a request-response, meaning that we receive a signal from the iframe,
    // and then we send a response back.
    async listenerEnrollmentInfo(event: MessageEvent) {
        const enrollmentData: UserEnrollmentInformationType | null = await this.base.getUserEnrollmentInformation();

        if (!enrollmentData) {
            // An error occurred while fetching user information, not sending anything will trigger the iframe to close
            console.error('-- Error getting enrollment information');
            return;
        }

        this.base.reset();

        const payload = {
            ...enrollmentData,
            skipifySessionId: this.base.skipifyEvents.getSessionId(), // override iframe's skipify session id, so it can stay at the same session even user refreshes the page
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

    async clearOid() {
        localStorage.removeItem('ORDER_DATA');
        //Remove button if present
        removeCheckmarkButton();
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

    addUserToLookup(email: string, phone?: string, cartData?: any) {
        this.userToLookup = { email, phone, cartData };
    }

    clearUserToLookup() {
        this.userToLookup = null;
    }

    listenerDeviceId(event: MessageEvent) {
        // we want to use the device id generated by the iframe (fingerprint js)
        const { deviceId } = event.data.payload;
        this.base.skipifyEvents.setDeviceId(deviceId);
    }

    restoreIframeHeight() {
        if (this.iframeHeight) {
            changeIframeHeight(this.iframeHeight);
        }
    }

    setFlags(event: MessageEvent) {
        const { flags } = event.data.payload;
        if (flags) {
            this.base.store.setState({ flags });

            if (flags.skipifyLayer) {
                this.iframe?.classList.add(SkipifyClassNames.skipifyV2);
            } else {
                this.iframe?.classList.remove(SkipifyClassNames.skipifyV2);
            }

            if (flags.samsungDemo) {
                this.iframe?.classList.add(SkipifyClassNames.samsungDemo);
            } else {
                this.iframe?.classList.remove(SkipifyClassNames.samsungDemo);
            }
        }
    }
}
