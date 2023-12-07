import { SkipifyClassNames } from "@checkout-sdk/shared";

interface OwnProps {
  node: HTMLElement;
  setUserEmail: (email: string) => void;
  onChange: () => void;
}

type Props = OwnProps;

export class EmailInput {
  node: HTMLElement;
  setUserEmail: (email: string) => void;
  onChange: () => void;

  constructor({ node, setUserEmail,onChange }: Props) {
    this.node = node;
    this.setUserEmail = setUserEmail;
    this.onChange = onChange;
    this.start();
  }

  start() {
    this.node.classList.add(SkipifyClassNames.emailInput);
    this.node.addEventListener("blur", (e) => this.handleInput(e));
    this.node.addEventListener('change', () => this.onChange());
  }

  handleInput(e: FocusEvent) {
    const emailValue = (e.target as HTMLInputElement).value;
    this.setUserEmail(emailValue);
  }
}
