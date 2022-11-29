export interface AbstractSDK {
  processDOM(): void;
  processEmailInput(): void;
  processPaymentButton(): void;
  processEnrollmentCheckbox(): void;
}
