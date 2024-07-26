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
  total?: number;
  textColor?: string;
  email?: string;
  phone?: string;
}

export type MerchantOptions = {
  cobrandedLogo?: string,
}
