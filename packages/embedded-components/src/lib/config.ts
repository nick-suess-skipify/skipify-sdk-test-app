export type ConfigType = {
  merchantId: string;
};

export class Config {
  merchantId: string | null = null;

  constructor(props: ConfigType) {
    if (!props.merchantId) {
      throw new Error('Missing required property: merchantId');
    }
    this.merchantId = props.merchantId;
  }
}
