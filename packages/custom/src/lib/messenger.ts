import {
    MESSAGE_NAMES,
    SkipifyCheckoutUrl,
    SimpleCheckoutUrl,
    SkipifyClassNames,
    SKIPIFY_ANALYTICS_CONST,
    SDKOrigin,
} from '@checkout-sdk/shared/lib/constants';
import {
    launchHiddenIframe,
    hideIframe,
    changeIframeHeight,
    getBaseIframe,
    displayIframe,
    showIframe,
} from '@checkout-sdk/shared/lib/utils/iframe';
import CustomSDK from './custom';
import { approvalEventMapper } from './data/eventMapper';
import { Button } from './button/button';

export class Messenger {
    iframe: HTMLIFrameElement | null = null;
    listenerReady = false;
    activeCheckoutId: string | null = null;
    activeCheckoutSuccess = false;
    resumableIframeHidden = false;

    constructor(private sdk: CustomSDK) {
        window.addEventListener('message', (e) => this.handleIframeMessage(e));
        this.requestDeviceId();
    }

    handleIframeMessage(event: MessageEvent) {
        const { data, origin } = event;

        if (![SDKOrigin, SkipifyCheckoutUrl, SimpleCheckoutUrl].includes(origin) || !data?.name) {
            return;
        }
        switch (data.name) {
            case MESSAGE_NAMES.LISTENER_READY:
                return this.handleListenerReady(event);
            case MESSAGE_NAMES.CLOSE_IFRAME:
                return this.listenerCloseIframe(event);
            case MESSAGE_NAMES.RESIZE_CONTAINER:
                return this.listenerIframeHeightChange(event);
            case MESSAGE_NAMES.CHECKOUT_BUTTON_TRIGGERED:
                return this.listenerCheckoutButtonTriggered(data);
            case MESSAGE_NAMES.CHECKOUT_BUTTON_READY:
                return this.listenerCheckoutButtonReady(data);
            case MESSAGE_NAMES.DISPLAY_IFRAME:
                return this.listenerDisplayIframe();
            case MESSAGE_NAMES.ORDER_COMPLETED:
                return this.listenerOrderCompleted(event);
            case MESSAGE_NAMES.RESET_ANALYTICS_TTL:
                return this.listenerResetAnalyticsTtl();
            default:
                return;
        }
    }

    handleListenerReady(event: MessageEvent) {
        this.listenerReady = true;
        this.setButtonVisibility(true);
    }

    setButtonVisibility(isVisible: boolean) {
        const opacity = isVisible ? '1' : '0.5';
        Object.values(this.sdk.buttons).forEach((button) => {
            if (button.frame) {
                button.frame.style.opacity = opacity;
            }
        });
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
                    skipifySessionId: this.sdk.skipifyEvents.getSessionId(), // override iframe's skipify session id
                };
            } else if (buttonListener) {
                payload = {
                    email,
                    phone: this.sdk.buttons[listenerId].options?.phone,
                    cart: { merchantReference: buttonListener.merchantRef },
                    skipifySessionId: this.sdk.skipifyEvents.getSessionId(), // override iframe's skipify session id
                };
            }
            this.iframe.contentWindow?.postMessage(
                {
                    name: MESSAGE_NAMES.REQUEST_LOOKUP_DATA,
                    payload,
                },
                SkipifyCheckoutUrl,
            );
        }
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

    listenerCheckoutButtonReady(data: { id: string }) {
        const { id: buttonId } = data;

        if (!buttonId) {
            return;
        }
        // Notify CustomSDK that the button is ready
        if (this.sdk.onButtonReady) {
            this.sdk.onButtonReady(buttonId);
        }
    }

    listenerCheckoutButtonTriggered(data: { id: string }) {
        if (data.id) {
            const iframe = getBaseIframe();
            const clickedButton = this.sdk.buttons[data.id];

            if (!iframe || !clickedButton || (!this.listenerReady && !this.sdk.skipifyLightActive)) {
                return;
            }

            const orderData: any = {
                cart: { merchantReference: clickedButton.merchantRef },
                email: clickedButton.options?.email,
                phone: clickedButton.options?.phone,
                skipifySessionId: this.sdk.skipifyEvents.getSessionId(), // override iframe's skipify session id
            };

            if (this.resumableIframeHidden) {
                // Display the iframe if we have one hidden from closing resumable button flow
                showIframe();
                this.resumableIframeHidden = false;

                iframe.contentWindow?.postMessage(
                    {
                        name: MESSAGE_NAMES.RESUME_ORDER,
                        payload: orderData,
                    },
                    SkipifyCheckoutUrl,
                );
                return;
            }

            this.activeCheckoutId = data.id;

            // Skipify simple flow
            if (this.sdk.skipifyLightActive && clickedButton.options?.total) {
                orderData.cart.total = clickedButton.options?.total;
                iframe.contentWindow?.postMessage(
                    {
                        name: MESSAGE_NAMES.CREATE_ORDER,
                        payload: orderData,
                    },
                    SimpleCheckoutUrl,
                );
            } else {
                // Regular checkout flow
                iframe.contentWindow?.postMessage(
                    {
                        name: MESSAGE_NAMES.CREATE_ORDER,
                        payload: orderData,
                    },
                    SkipifyCheckoutUrl,
                );
            }

            if (clickedButton.options?.onClick) {
                clickedButton.options.onClick(clickedButton.merchantRef);
            }
        }
    }

    async listenerCloseIframe(event: MessageEvent) {
        let activeCheckout = null;
        const orderCompleted = this.activeCheckoutSuccess;

        if (this.activeCheckoutId) {
            activeCheckout = this.getCurrentCheckout(this.activeCheckoutId);

            // Trigger onClose UI callback if defined
            if (activeCheckout?.options?.onClose) {
                activeCheckout.options.onClose(activeCheckout.merchantRef, orderCompleted);
            }
        }

        this.activeCheckoutSuccess = false;
        await hideIframe();

        const isButtonCheckout = activeCheckout instanceof Button;
        const canResumeIframe =
            isButtonCheckout &&
            !orderCompleted &&
            Object.keys(this.sdk.buttons).length === 1 &&
            !this.sdk.skipifyLightActive;

        // Set resumableIframeHidden for specific button flow
        if (canResumeIframe) {
            this.resumableIframeHidden = true;
        } else if (isButtonCheckout && !this.sdk.skipifyLightActive) {
            this.setButtonVisibility(false); // Mute buttons again while SDK is reinitializing
        }

        // We only want to hide for button flow - otherwise reset
        if (event.data.payload?.reload || !canResumeIframe) {
            this.resumableIframeHidden = false;
            this.activeCheckoutId = null;

            // Give some time for the close animation to be shown
            setTimeout(() => {
                this.sdk.resetIframe();
            }, 500);
        }
    }

    listenerOrderCompleted(event: MessageEvent) {
        const { payload } = event.data;
        const mappedPayload = approvalEventMapper(payload);
        if (this.activeCheckoutId) {
            this.activeCheckoutSuccess = true;
            // Trigger onApprove UI callback
            const activeCheckout = this.getCurrentCheckout(this.activeCheckoutId);
            if (activeCheckout && activeCheckout.options?.onApprove) {
                activeCheckout.options?.onApprove(activeCheckout.merchantRef, mappedPayload);
            }
        }
    }

    listenerResetAnalyticsTtl() {
        this.sdk.ttlStorage.updateExpiry(SKIPIFY_ANALYTICS_CONST.LOCAL_STORAGE_KEY, SKIPIFY_ANALYTICS_CONST.TTL);
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
            return this.sdk.buttons[checkoutId];
        } else if (this.sdk.emailListeners[checkoutId]) {
            return this.sdk.emailListeners[checkoutId];
        }
        return null;
    }
}
