import { SkipifyClassNames } from '@checkout-sdk/shared';
import debounce, { DebouncedFunction } from 'debounce';

type EmailInputOptions = {
  /**
   * Configuration option for when changes to the email field get submitted.
   * onBlur: when the user tabs out of the field
   * onChange: when the input is changed
   */
  mode?: 'onBlur' | 'onChange';

  /** Time in ms for debouncing the email submission event onChange. */
  debounceTime?: number;
};

interface OwnProps {
  node: HTMLInputElement;
  options?: EmailInputOptions;
  setUserEmail: (email: string) => void;
}

type EmailInputEventHandler = (e: Event) => void;

type Props = OwnProps;

export class EmailInput {
  node: HTMLInputElement;
  setUserEmail: (email: string) => void;
  private options;
  //** This can be used to cancel/immediately flush debounce if necessary */
  private _debounceController?: DebouncedFunction<EmailInputEventHandler>;

  constructor({
    node,
    setUserEmail,
    // Assume that desired default behavior is debounce.
    options = { mode: 'onChange', debounceTime: 400 },
  }: Props) {
    this.node = node;
    this.setUserEmail = setUserEmail;
    this.options = options;
    this.start();
  }

  /**
   * Based on the options provided, set the given event handler on an HTML input element.
   *
   * @param node Node to attach the event listener to.
   * @param handler Event listener function.
   * @param options Options object to change the behavior of the listener.
   * @returns A controller to the function if the function is debounced.
   */
  private setEventListener(
    node: HTMLInputElement,
    handler: EmailInputEventHandler,
    options: EmailInputOptions
  ): DebouncedFunction<EmailInputEventHandler> | undefined {
    const boundHandler = handler.bind(this);

    const dt = options.debounceTime || 300;
    let controllerFunction:
      | DebouncedFunction<EmailInputEventHandler>
      | undefined;

    switch (options.mode) {
      case 'onBlur':
        node.addEventListener('blur', boundHandler);
        break;
      default:
      case 'onChange':
        controllerFunction = debounce(boundHandler, dt);
        node.addEventListener('input', controllerFunction);
        break;
    }

    return controllerFunction;
  }

  start() {
    this.node.classList.add(SkipifyClassNames.emailInput);
    this._debounceController = this.setEventListener(
      this.node,
      this.handleInput,
      this.options
    );
  }

  handleInput(e: Event) {
    if (!e.target || !(e.target instanceof HTMLInputElement)) {
      throw Error(
        'Invalid target. Email input field must be an HTMLInputElement.'
      );
    }

    const emailValue = e.target.value;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      this.setUserEmail(emailValue);
    }
  }
}
