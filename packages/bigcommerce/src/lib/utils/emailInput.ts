import { SkipifyClassNames } from '@checkout-sdk/shared';

interface OwnProps {
  node: HTMLElement;
  setUserEmail: (email: string) => void;
  passwordInputId: string;
  resetIframe: () => void;
}

type Props = OwnProps;

export class EmailInput {
  node: HTMLElement;
  passwordInputId: string;
  setUserEmail: (email: string) => void;
  resetIframe: () => void;

  constructor({ node, setUserEmail, passwordInputId, resetIframe }: Props) {
    this.node = node;
    this.passwordInputId = passwordInputId;
    this.setUserEmail = setUserEmail;
    this.resetIframe = resetIframe;
    this.start();
  }

  start() {
    this.node.classList.add(SkipifyClassNames.emailInput);
    this.node.addEventListener('blur', (e) => this.handleInput(e));
    this.node.addEventListener('change', () => this.onChange());
  }

  handleInput(e: FocusEvent) {
    // We don't want to interrupt their login flow
    if (document.getElementById(this.passwordInputId)) return;

    const emailValue = (e.target as HTMLInputElement).value;
    this.setUserEmail(emailValue);
  }

  onChange() {
    this.resetIframe();
  }
}
