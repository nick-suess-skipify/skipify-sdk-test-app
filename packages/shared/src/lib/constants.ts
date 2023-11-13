import { environment } from '../environments/environment';

export const SDKVersion = environment.SDK_VERSION;

export const IFRAME_ORIGIN = environment.IFRAME_ORIGIN;

export const MerchantServiceUrl = environment.MERCHANT_SERVICE_URL;
export const SdkUrl = environment.SDK_URL;
export const SkipifyCheckoutUrl = environment.SKIPIFY_CHECKOUT_URL;

export const AmplitudeApiKey = environment.AMPLITUDE_API_KEY;

export const SkipifyClassNames = {
  emailInput: '_SKIPIFY_email_input',
  loggedInCustomer: '_SKIPIFY_logged_in_customer',
  paymentButton: '_SKIPIFY_payment_button',
  enrollmentIframe: '_SKIPIFY_enrollment_iframe',
  body: '_SKIPIFY_body',
  skipifyV2: '_SKIPIFY_V2',
  hiding: '_SKIPIFY_hiding',
};

export const SkipifyElementIds = {
  iframe: '_SKIPIFY_iframe',
  iframeArrow: '_SKIPIFY_iframe_arrow',
  overlay: '_SKIPIFY_overlay',
  enrollmentCheckbox: '_SKIPIFY_enrollment_checkbox',
  container: '_SKIPIFY_container',
  checkButton: '_SKIPIFY_check_button',
  emailWrapper: '_SKIPIFY_email_wrapper',
  v2Checkbox: '_SKIPIFY_v2_checkbox',
};

/**
 * These definitions come from the Shakira code-- but they could be shared as part of a library to reduce redundancy
 */
const MESSAGE_NAME_PREFIX = '@skipify';
export const MESSAGE_NAMES = {
  // Inbound
  INIT: `${MESSAGE_NAME_PREFIX}/init`,
  GET_ENROLLMENT_INFO: `${MESSAGE_NAME_PREFIX}/get-enrollment-info`,
  CLOSE_IFRAME: `${MESSAGE_NAME_PREFIX}/close-iframe`,
  RESIZE_CONTAINER: `${MESSAGE_NAME_PREFIX}/resize-container`,
  LOOKUP_ERROR: `${MESSAGE_NAME_PREFIX}/lookup-error`,
  DISPLAY_IFRAME: `${MESSAGE_NAME_PREFIX}/display-iframe`,
  ENROLLMENT_ELIGIBLE: `${MESSAGE_NAME_PREFIX}/enrollment-eligible`,
  ORDER_COMPLETED: `${MESSAGE_NAME_PREFIX}/order-completed`,
  DEVICE_ID: `${MESSAGE_NAME_PREFIX}/device-id`,
  // Outbound
  REQUEST_LOOKUP_DATA: `${MESSAGE_NAME_PREFIX}/request-lookup-data`,
  ENROLLMENT_INFO_RECEIVED: `${MESSAGE_NAME_PREFIX}/enrollment-info`,
  CREATE_ORDER: `${MESSAGE_NAME_PREFIX}/create-order`,
  REQUEST_DEVICE_ID: `${MESSAGE_NAME_PREFIX}/request-device-id`,
  SET_SKIPIFY_VERSION: `${MESSAGE_NAME_PREFIX}/set-skipify-version`,
  // Internal
  ENROLLMENT_VALUE_CHANGED: `${MESSAGE_NAME_PREFIX}/enrollment-checkbox-changed`,
  CHECKOUT_BUTTON_TRIGGERED: `${MESSAGE_NAME_PREFIX}/checkout-button-triggered`,
} as const;

declare global {
  interface Window {
    BigCommerceSDK: any;
    CustomSDK: any;
    skipify: any;
  }
}
