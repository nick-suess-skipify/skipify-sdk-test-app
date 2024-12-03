import { environment } from '../environments/environment';

export const SDKVersion = environment.SDK_VERSION;
export enum FeatureFlags {
  skipifyLight = 'UseSkipifyLight',
  routerV2 = 'useCheckoutAppRouter'
}
export type FeatureFlagsType = {
  [FeatureFlags.skipifyLight]: boolean,
  [FeatureFlags.routerV2]: boolean
}
export const DefaultFeatureFlags = {
  [FeatureFlags.skipifyLight]: false,
  [FeatureFlags.routerV2]: false
}

export const IFRAME_ORIGIN = environment.IFRAME_ORIGIN;

export const MerchantServiceUrl = environment.MERCHANT_SERVICE_URL;
export const SdkUrl = environment.SDK_URL;
export const SkipifyCheckoutUrl = environment.SKIPIFY_CHECKOUT_URL;
export const SimpleCheckoutUrl = environment.SIMPLE_CHECKOUT_URL;

export const LaunchDarklyConfig = {
  clientSideId: environment.LAUNCHDARKLY_CLIENT_SIDE_ID,
  context: (merchantId: string) => ({
    kind: "merchant",
    key: merchantId,
  })
}


export const SkipifyClassNames = {
  emailInput: '_SKIPIFY_email_input',
  loggedInCustomer: '_SKIPIFY_logged_in_customer',
  paymentButton: '_SKIPIFY_payment_button',
  enrollmentIframe: '_SKIPIFY_enrollment_iframe',
  body: '_SKIPIFY_body',
  embedBody: '_SKIPIFY_embed_body',
  skipifyV2: '_SKIPIFY_V2',
  skipifyEmbed: '_SKIPIFY_embed',
  hiding: '_SKIPIFY_hiding',
  samsungDemo: '_SAMSUNG_DEMO',
  embedOverlay: '_SKIPIFY_embed_overlay',
  embedOverlayWrapper: '_SKIPIFY_embed_overlay_wrapper',

  // classes for components sdk
  componentOverlayIframe: '_SKIPIFY_component_overlay_iframe' // class for component iframe when displayMode is overlay
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
  loadingParallelogram: '_SKIPIFY_Loader',

  // ids for components sdk
  authIframe: '_SKIPIFY_auth_iframe',
  carouselIframe: '_SKIPIFY_carousel_iframe'
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
  RESUMABLE_ORDER_ID: `${MESSAGE_NAME_PREFIX}/resumable-order-id`,
  ORDER_ID: `${MESSAGE_NAME_PREFIX}/order-id`,
  CLEAR_ORDER: `${MESSAGE_NAME_PREFIX}/clear-order`,
  ASK_FOR_ORDER_ID: `${MESSAGE_NAME_PREFIX}/request-order-id`,
  SEND_LD_FLAGS: `${MESSAGE_NAME_PREFIX}/send-ld-flags`,
  LOOKUP_BY_FINGERPRINT_RESULT: `${MESSAGE_NAME_PREFIX}/lookup-by-fingerprint-result`,
  TRACK_EVENT: `${MESSAGE_NAME_PREFIX}/track-event`,
  LISTENER_READY: `${MESSAGE_NAME_PREFIX}/listener-ready`,
  LOOKUP_RESPONSE: `${MESSAGE_NAME_PREFIX}/shoppers-lookup-response`,
  
  AUTH_COMPONENT_SUCCESS: `${MESSAGE_NAME_PREFIX}/auth-component-success`, // auth component
  AUTH_COMPONENT_ERROR: `${MESSAGE_NAME_PREFIX}/auth-component-error`, // auth component

  CAROUSEL_COMPONENT_SUCCESS: `${MESSAGE_NAME_PREFIX}/carousel-component-success`, // carousel component
  CAROUSEL_COMPONENT_ERROR: `${MESSAGE_NAME_PREFIX}/carousel-component-error`, // carousel component

  // Outbound
  REQUEST_LOOKUP_DATA: `${MESSAGE_NAME_PREFIX}/request-lookup-data`,
  ENROLLMENT_INFO_RECEIVED: `${MESSAGE_NAME_PREFIX}/enrollment-info`,
  CREATE_ORDER: `${MESSAGE_NAME_PREFIX}/create-order`,
  REQUEST_DEVICE_ID: `${MESSAGE_NAME_PREFIX}/request-device-id`,
  RECEIVE_ORDER_ID: `${MESSAGE_NAME_PREFIX}/receive-order-id`,
  LOOKUP_BY_FINGERPRINT: `${MESSAGE_NAME_PREFIX}/lookup-by-fingerprint`,


  RECEIVE_COMPONENT_LOOKUP_DATA: `${MESSAGE_NAME_PREFIX}/receive-auth-component-data`, // auth component
  RECEIVE_COMPONENT_CAROUSEL_DATA: `${MESSAGE_NAME_PREFIX}/receive-carousel-component-data`, // carousel component

  // Internal
  ENROLLMENT_VALUE_CHANGED: `${MESSAGE_NAME_PREFIX}/enrollment-checkbox-changed`,
  CHECKOUT_BUTTON_TRIGGERED: `${MESSAGE_NAME_PREFIX}/checkout-button-triggered`,
  CHECKOUT_BUTTON_READY: `${MESSAGE_NAME_PREFIX}/checkout-button-ready`,
  MERCHANT_PUBLIC_INFO_FETCHED: `${MESSAGE_NAME_PREFIX}/merchant-public-info-fetched`,
} as const;

export const COMPONENT_LISTENER_IDS = {
  AUTH_COMPONENT: 'auth-component',
  LOOKUP_COMPONENT: 'lookup-component',
  CAROUSEL_COMPONENT: 'carousel-component'
} as const;

export const SKIPIFY_ANALYTICS_CONST = {
  HEADER_NAME: 'x-amplitude-session-id',
  SESSION_STORAGE_KEY: "asid",
} as const;

declare global {
  interface Window {
    BigCommerceSDK: any;
    CustomSDK: any;
    skipify: any;
    MagentoSDK: any;
  }
}
