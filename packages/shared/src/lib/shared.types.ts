export type ShippingAddressType = {
  /** Street address */
  address1: string;
  /** Additional address info (eg apt #) */
  address2?: string;
  /** City where the address is located */
  city: string;
  /** Given name of the owner of the address */
  firstName: string;
  /** Surname of the owner of the address */
  lastName: string;
  /** State where the address is located */
  state: string;
  /** 5 digit + optional 4 digit extension postal code of the address */
  zipCode: string;
  /** Phone number related with the specific address */
  phoneNumber?: string;
};

export type UserEnrollmentInformationType = {
  email: string;
  phone?: string;
  shippingAddress?: ShippingAddressType;
};

export interface AbstractSDK {
  processDOM(): void;
  processEmailInput(): void;
  processCheckoutCompleted(): void;
  processEnrollmentCheckbox(): void;
  getUserEnrollmentInformation(): Promise<UserEnrollmentInformationType | null>;
}

export type MerchantType = {
  checkoutTestMode: boolean;
  streamlinedFlowEligible: boolean;
  urls: string[];
  merchantId: string;
  branding: { displayName: string };
  cobranding?: { logoSrc?: string };
  topLevelMerchantId?: string;
};

export type LookupUserType = {
  email: string;
  phone?: string;
  cart: {
    items: unknown;
  };
  amplitudeSessionId?: number;
}
