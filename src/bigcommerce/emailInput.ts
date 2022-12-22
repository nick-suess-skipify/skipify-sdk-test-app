import { SkipifyClassNames } from "../shared";

interface OwnProps {
  node: HTMLElement;
  setUserEmail: (email: string) => void;
}

type Props = OwnProps;

export class EmailInput {
  node: HTMLElement;
  setUserEmail: (email: string) => void;

  constructor({ node, setUserEmail }: Props) {
    this.node = node;
    this.start();
    this.setUserEmail = setUserEmail;
  }

  start() {
    this.node.classList.add(SkipifyClassNames.emailInput);
    this.node.addEventListener("blur", (e) => this.handleInput(e));
  }

  handleInput(e: FocusEvent) {
    const emailValue = (e.target as HTMLInputElement).value;
    console.log(emailValue);
    alert(`-- Email input blur: ${emailValue}`);
    this.setUserEmail(emailValue);
  }
}
