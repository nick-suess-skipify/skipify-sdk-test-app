import { SkipifyClassNames } from "../shared";

interface OwnProps {
  node: HTMLElement;
}

type Props = OwnProps;

export class PaymentButton {
  node: HTMLElement;
  constructor({ node }: Props) {
    this.node = node;
    this.start();
  }

  start() {
    this.node?.classList.add(SkipifyClassNames.paymentButton);

    this.node?.addEventListener("click", this.handleButton);
  }

  handleButton() {
    alert(`-- Payment button clicked`);
  }
}
