import { SkipifyClassNames, hideLoader, showLoader } from '@checkout-sdk/shared';
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
    resetIframe: () => void;
}

type EmailInputEventHandler = (e: Event) => void;

type Props = OwnProps;

export class EmailInput {
    node: HTMLInputElement;
    setUserEmail: (email: string) => void;
    resetIframe: () => void;
    private options;
    //** This can be used to cancel/immediately flush debounce if necessary */
    private _debounceController?: DebouncedFunction<EmailInputEventHandler>;
    private loadingTimeout?: number;

    constructor({
        node,
        setUserEmail,
        resetIframe,
        // Assume that desired default behavior is debounce.
        options = { mode: 'onChange', debounceTime: 400 },
    }: Props) {
        this.node = node;
        this.setUserEmail = setUserEmail;
        this.options = options;
        this.start();
        this.resetIframe = resetIframe;
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
        options: EmailInputOptions,
    ): DebouncedFunction<EmailInputEventHandler> | undefined {
        const boundHandler = handler.bind(this);

        const dt = options.debounceTime || 300;
        let controllerFunction: DebouncedFunction<EmailInputEventHandler> | undefined;

        switch (options.mode) {
            case 'onBlur':
                node.addEventListener('blur', boundHandler);
                break;
            default:
            case 'onChange':
                controllerFunction = debounce(boundHandler, dt);
                node.addEventListener('input', (e) => {
                    // Show loader immediately on any input event
                    showLoader();
                    // Execute the debounced handler for processing email
                    controllerFunction?.(e);
                });
                break;
        }

        return controllerFunction;
    }

    start() {
        this.node.classList.add(SkipifyClassNames.emailInput);
        this._debounceController = this.setEventListener(this.node, this.handleInput, this.options);
    }

    handleInput(e: Event) {
        if (!e.target || !(e.target instanceof HTMLInputElement)) {
            throw Error('Invalid target. Email input field must be an HTMLInputElement.');
        }
        let shouldDissappear = true;
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
        }

        const emailValue = e.target.value;
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            // When setting a new email we should reset Everything
            this.resetIframe();
            this.setUserEmail(emailValue);
            // This is because we want to show the loader from when we have a correct email until lookup data comes through
            shouldDissappear = false;
        }

        // This will need to be tested - how long until we clear the parallelogram
        if (shouldDissappear) {
            this.loadingTimeout = setTimeout(() => {
                hideLoader();
            }, 3000) as unknown as number;
        }
    }
}
