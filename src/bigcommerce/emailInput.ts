import { SkipifyClassNames } from "../shared";

interface OwnProps {
  node: HTMLElement;
}

type Props = OwnProps;

export class EmailInput {
  node: HTMLElement;
  value: string | null = null;

  constructor({ node }: Props) {
    this.node = node;
    this.start();
  }

  start() {
    this.node.classList.add(SkipifyClassNames.emailInput);
    this.node.addEventListener("blur", (e) => this.handleInput(e));
  }

  handleInput(e: FocusEvent) {
    const emailValue = (e.target as HTMLInputElement).value;
    console.log(emailValue);
    alert(`-- Email input blur: ${emailValue}`);
    this.value = emailValue;
  }
}
