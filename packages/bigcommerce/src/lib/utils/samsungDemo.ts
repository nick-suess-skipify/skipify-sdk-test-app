/**
 * A samsung demo for button checkout + device lookup
 * For demo purpose, it will use a pre-saved device id from localstorage for device lookup.
 * A samsung branded checkout flow will start when user press checkout button on cart page.
 */

import { log, MESSAGE_NAMES, Messenger } from '@checkout-sdk/shared';
export class SamsungDemo {
    private static STORAGE_KEY = 'skipify_force_device_id';
    private static PARAM_ADD = 'forceDeviceId';
    private static PARAM_REMOVE = 'removeForceDeviceId';
    private static CHECKOUT_BUTTON_SELECTOR = '.cart-actions .button--primary';
    private static EVENT_LISTENER_CLASS = 'sk-samsung-demo-btn';
    private static CART_URL_REGEX = /\/cart/;
    private static SHOW_BUTTON_TIMEOUT = 3000;

    private messenger: Messenger;
    public checkoutButton: HTMLElement | null = null;

    constructor(messenger: Messenger) {
        this.messenger = messenger;
        this.initialize();
    }

    private initialize() {
        this.handleDeviceIdQueryParameters();
        log('SamsungDemo: initialized');
    }

    /**
     * Handles setting or deleting forced device id using query parameter
     *
     * To force a specific device ID, append the following query parameter to the URL:
     *
     * Example: https://example.com/cart.php?forceDeviceId=12345
     *
     * To remove the forced device ID, append this query parameter:
     *
     * Example: https://example.com/cart.php?removeForceDeviceId=true
     * */

    private handleDeviceIdQueryParameters() {
        const queryParams = new URLSearchParams(window.location.search);
        const forceDeviceId = queryParams.get(SamsungDemo.PARAM_ADD);
        const removeForceDeviceId = queryParams.get(SamsungDemo.PARAM_REMOVE);

        if (forceDeviceId) {
            localStorage.setItem(SamsungDemo.STORAGE_KEY, forceDeviceId);
            log('SamsungDemo: Force Device ID set to:', forceDeviceId);
        }

        if (removeForceDeviceId) {
            localStorage.removeItem(SamsungDemo.STORAGE_KEY);
            log('SamsungDemo: Force Device ID removed');
        }
    }

    // Check if the Samsung demo can be shown based, we only want to show it on cart page for now.
    public canShowSamsungDemo() {
        return SamsungDemo.CART_URL_REGEX.test(window.location.href);
    }

    // Check if the checkout button exists, and set up necessary event listeners
    public setupButton() {
        log('SamsungDemo: Flag enabled, setup checkout button...');

        this.checkoutButton = document.querySelector(SamsungDemo.CHECKOUT_BUTTON_SELECTOR);

        if (this.checkoutButton) {
            log('SamsungDemo: Checkout button found, set to hidden and add event listener...');

            // Hide the button initially by setting visibility to hidden
            this.checkoutButton.style.visibility = 'hidden';

            // Setup event listener for click events if not already done
            if (!this.checkoutButton.classList.contains(SamsungDemo.EVENT_LISTENER_CLASS)) {
                this.checkoutButton.addEventListener('click', (e) => {
                    e.preventDefault(); // prevent the original functionality of checkout button
                    this.messenger.createOrder();
                });

                // Add a class to indicate that the event listener has been added
                this.checkoutButton.classList.add(SamsungDemo.EVENT_LISTENER_CLASS);
            }

            this.showButtonAfterMessageOrTimeout();
        } else {
            log(`SamsungDemo: Checkout button with querySelector ${SamsungDemo.CHECKOUT_BUTTON_SELECTOR} not found`);
        }
    }

    private showCheckoutButton(reason: string) {
        if (this.checkoutButton) {
            this.checkoutButton.style.visibility = 'visible';
            log(`SamsungDemo: Checkout button shown due to ${reason}`);
        }
    }

    //Un-hide checkout button when lookup is done or timeout
    //This is to address a problem user press the button too early before lookup is done
    private showButtonAfterMessageOrTimeout() {
        const showCheckoutButton = this.showCheckoutButton.bind(this);

        const timeoutId = setTimeout(() => showCheckoutButton('timeout'), SamsungDemo.SHOW_BUTTON_TIMEOUT);

        // Listen for lookup result message from iframe
        window.addEventListener('message', function (event) {
            if (event.data && event.data.name === MESSAGE_NAMES.LOOKUP_BY_FINGERPRINT_RESULT) {
                clearTimeout(timeoutId);
                showCheckoutButton('button ready');
            }
        });
    }
}
