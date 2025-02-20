export enum FlowType {
    egc = 'shakira_expedited_guest_checkout',
    button = 'shakira_button_checkout',
    enrollment = 'shakira_guest_enrollment',
}

export type EventType = 'fe_enrollment_unchecked';

export type Event<T extends EventType> = {
    event_type: T;
    event_properties?: EventPropertiesMap[T];
};

type BaseEventProperties = {
    flow_type: FlowType;
    merchant_id: string | null;
    merchant_name?: string;
    merchant_industry?: string;
    subtotal?: number;
    total?: number;
    user_id: string;
    email: string;
};

// Map event types to their corresponding properties
export type EventPropertiesMap = {
    fe_enrollment_unchecked: BaseEventProperties;
};
