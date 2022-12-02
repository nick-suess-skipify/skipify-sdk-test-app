export const mode = process.env.NODE_ENV as
  | "development"
  | "staging"
  | "production";
export const IFRAME_ORIGIN = import.meta.env.VITE_IFRAME_ORIGIN;

export const SkipifyClassNames = {
  emailInput: "_SKIPIFY_email_input",
  paymentButton: "_SKIPIFY_payment_button",
  enrollmentCheckbox: "_SKIPIFY_enrollment_checkbox",
};

export const MerchantServiceUrl = import.meta.env.VITE_MERCHANT_SERVICE_URL;
export const SdkUrl = import.meta.env.VITE_SDK_URL;
export const SkipifyElementIds = {
  iframe: "_SKIPIFY_iframe",
};

/**
 * These definitions come from the Shakira code-- but they could be shared as part of a library to reduce redundancy
 */
const MESSAGE_NAME_PREFIX = "@skipify";
export const MESSAGE_NAMES = {
  // Outbound
  INIT: `${MESSAGE_NAME_PREFIX}/init`,
  GET_ENROLLMENT_INFO: `${MESSAGE_NAME_PREFIX}/get-enrollment-info`,
  CLOSE_IFRAME: `${MESSAGE_NAME_PREFIX}/close-iframe`,
  // Inbound
  ENROLLMENT_INFO_RECEIVED: `${MESSAGE_NAME_PREFIX}/enrollment-info`,
} as const;
