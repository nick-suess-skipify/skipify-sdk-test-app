export enum FlowType {
  egc = "shakira_expedited_guest_checkout",
  button = "shakira_button_checkout",
  enrollment = "shakira_guest_enrollment",
}

export type BaseEventProperties = {
  flow_type: FlowType;
  merchant_id: string | null;
  merchant_name?: string;
  merchant_industry?: string;
  subtotal?: number;
  total?: number;
  user_id: string;
  email: string;
};

class EnrollmentUncheckedEvent {
  event_type = "fe_enrollment_unchecked";

  constructor(public event_properties?: BaseEventProperties) {
    this.event_properties = event_properties;
  }
}

export const Analytics = {
  enrollmentUncheckedEvent: EnrollmentUncheckedEvent,
};
