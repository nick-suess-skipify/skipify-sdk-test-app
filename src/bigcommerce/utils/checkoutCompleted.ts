import { Messenger, SkipifyCheckoutUrl } from "../../shared";

type Props = {
  messenger: Messenger;
  merchantId: string;
};

export class CheckoutCompleted {
  messenger;
  merchantId;

  constructor({ messenger, merchantId }: Props) {
    this.messenger = messenger;
    this.merchantId = merchantId;
    this.start();
  }

  start() {
    this.messenger.goToEnrollment();
  }
}
