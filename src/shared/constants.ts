export const mode = process.env.NODE_ENV as
  | "development"
  | "staging"
  | "production";

export const SkipifyClassNames = {
  emailInput: "_SKIPIFY_email_input",
  paymentButton: "_SKIPIFY_payment_button",
  enrollmentCheckbox: "_SKIPIFY_enrollment_checkbox",
};
