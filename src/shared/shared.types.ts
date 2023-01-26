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

export interface SkipifyAuthUser {
  transactionId: string;
  isPhoneRequired: boolean;
}
export interface SkipifyTestMode {
  enabled: boolean;
}

export type EnrollmentDataType = {
  email: string;
  phone?: string;
};
