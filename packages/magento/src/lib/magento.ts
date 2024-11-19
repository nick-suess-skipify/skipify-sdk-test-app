import {
  AbstractSDK,
  Base,
} from "@checkout-sdk/shared";


interface OwnProps {
  merchantId?: string;
}

type Props = OwnProps;

export class MagentoSDK extends Base implements AbstractSDK {

  constructor({ merchantId }: Props = {}) {
    super(merchantId);

    this.platform = "magento";

  }

  processEmailInput() {
    // TODO
  }

  processCheckoutCompleted(): void {
    // TODO
  }

  processEnrollmentCheckbox(): void {
    // TODO
  }
}

export default new MagentoSDK();
