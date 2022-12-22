import { Messenger, SkipifyCheckoutUrl } from "../shared";

type Props = {
  setHasLaunchedIframe: (value: boolean) => void;
  messenger: Messenger;
  merchantId: string;
};

export class CheckoutCompleted {
  setHasLaunchedIframe;
  messenger;
  merchantId;

  constructor({ setHasLaunchedIframe, messenger, merchantId }: Props) {
    this.setHasLaunchedIframe = setHasLaunchedIframe;
    this.messenger = messenger;
    this.merchantId = merchantId;
    this.start();
  }

  start() {
    this.messenger.launchIframe(
      `${SkipifyCheckoutUrl}/embed/${this.merchantId}/enroll`
    );
  }
}
