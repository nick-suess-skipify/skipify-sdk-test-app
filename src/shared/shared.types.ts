export interface AbstractSDK {
  processDOM(): void;
  processEmailInput(): void;
  processPaymentButton(): void;
  processEnrollmentCheckbox(): void;
}

export interface SkipifyAuthUser {
  transactionId: string;
  isPhoneRequired: boolean;
}

export interface SkipifyCapturedUser {
  transactionId: string;
  isNewUser: boolean;
  email: string;
}
