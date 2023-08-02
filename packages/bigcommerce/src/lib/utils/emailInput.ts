import { SkipifyClassNames } from "@checkout-sdk/shared";

interface OwnProps {
  node: HTMLElement;
  setUserEmail: (email: string) => void;
  passwordInputId: string;
}

type Props = OwnProps;

export class EmailInput {
  node: HTMLElement;
  passwordInputId: string;
  setUserEmail: (email: string) => void;

  constructor({ node, setUserEmail, passwordInputId }: Props) {
    this.node = node;
    this.passwordInputId = passwordInputId;
    this.setUserEmail = setUserEmail;
    this.start();
  }

  start() {
    this.node.classList.add(SkipifyClassNames.emailInput);
    this.node.addEventListener("blur", (e) => this.handleInput(e));
  }

  handleInput(e: FocusEvent) {
    // We don't want to interrupt their login flow
    if (document.getElementById(this.passwordInputId)) return;

    const emailValue = (e.target as HTMLInputElement).value;
    this.setUserEmail(emailValue);
  }
}
