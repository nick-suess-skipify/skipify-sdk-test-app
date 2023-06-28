export const SDKVersion = import.meta.env.PACKAGE_VERSION;

export const IFRAME_ORIGIN = import.meta.env.VITE_IFRAME_ORIGIN;

export const MerchantServiceUrl = import.meta.env.VITE_MERCHANT_SERVICE_URL;
export const SdkUrl = import.meta.env.VITE_SDK_URL;
export const SkipifyCheckoutUrl = import.meta.env.VITE_SKIPIFY_CHECKOUT_URL;

export const SkipifyClassNames = {
  emailInput: "_SKIPIFY_email_input",
  loggedInCustomer: "_SKIPIFY_logged_in_customer",
  paymentButton: "_SKIPIFY_payment_button",
  enrollmentIframe: "_SKIPIFY_enrollment_iframe",
  body: "_SKIPIFY_body",
};

export const SkipifyElementIds = {
  iframe: "_SKIPIFY_iframe",
  overlay: "_SKIPIFY_overlay",
  enrollmentCheckbox: "_SKIPIFY_enrollment_checkbox",
  container: "_SKIPIFY_container",
};

/**
 * These definitions come from the Shakira code-- but they could be shared as part of a library to reduce redundancy
 */
const MESSAGE_NAME_PREFIX = "@skipify";
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
  // Outbound
  REQUEST_LOOKUP_DATA: `${MESSAGE_NAME_PREFIX}/request-lookup-data`,
  ENROLLMENT_INFO_RECEIVED: `${MESSAGE_NAME_PREFIX}/enrollment-info`,
  // Internal
  ENROLLMENT_VALUE_CHANGED: `${MESSAGE_NAME_PREFIX}/enrollment-checkbox-changed`,
} as const;
