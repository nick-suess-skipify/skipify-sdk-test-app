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
