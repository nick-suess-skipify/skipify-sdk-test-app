export interface AbstractSDK {
  processDOM(): void;
  processEmailInput(): void;
  processCheckoutCompleted(): void;
  processEnrollmentCheckbox(): void;
}
