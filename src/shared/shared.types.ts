export type UserEnrollmentInformationType = {
  email: string;
  phone?: string;
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
  urls: string[];
  merchantId: string;
  branding: { displayName: string };
};
