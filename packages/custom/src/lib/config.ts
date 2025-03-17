const requiredProperties = ['merchantId'];

export class Config {
    merchantId: string | null = null;

    constructor(props: { merchantId: string } & any) {
        requiredProperties.forEach((key) => {
            if (props && props[key]) {
                this[key as keyof Config] = props[key];
            } else {
                throw new Error(`missing required property: '${key}'`);
            }
        });
    }
}

export type AdditionalOptions = {
    onClose?: (merchantRef: string, success: boolean) => void;
    onApprove?: (merchantRef: string, data?: any) => void;
    onClick?: (merchantRef: string) => void;
    total?: number;
    textColor?: string;
    bgColor?: string;
    bgHoverColor?: string;
    email?: string;
    phone?: string;
    logoPlacement?: 'inside' | 'below';
    buttonLabel?: 'Buy Now' | 'Pay Now';
};

export type MerchantOptions = {
    cobrandedLogo?: string;
};
