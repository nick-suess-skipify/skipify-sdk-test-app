import { hideLoader, isEmailValid, showLoader } from '../utils';
import { SkipifyClassNames } from '../constants';
import debounce, { DebouncedFunction } from 'debounce';

type EmailInputOptions = {
    mode?: 'onBlur' | 'onChange';
    debounceTime?: number;
};

type EmailInputEventHandler = (e: Event) => void;

interface OwnProps {
    node: HTMLInputElement;
    options?: EmailInputOptions;
    setUserEmail: (email: string) => void;
    passwordInputId?: string;
    resetIframe: () => void;
}

type Props = OwnProps;

export class EmailInput {
    node: HTMLInputElement;
    passwordInputId?: string;
    setUserEmail: (email: string) => void;
    resetIframe: () => void;
    private readonly options;
    private _debounceController?: DebouncedFunction<EmailInputEventHandler>;
    private loadingTimeout?: ReturnType<typeof setTimeout>;

    constructor({
        node,
        setUserEmail,
        passwordInputId,
        resetIframe,
        options = { mode: 'onChange', debounceTime: 400 },
    }: Props) {
        this.node = node;
        this.passwordInputId = passwordInputId;
        this.options = options;
        this.setUserEmail = setUserEmail;
        this.resetIframe = resetIframe;
        this.start();
    }

    private setEventListener(
        node: HTMLInputElement,
        handler: EmailInputEventHandler,
        options: EmailInputOptions,
    ): DebouncedFunction<EmailInputEventHandler> | undefined {
        const boundHandler = handler.bind(this);
        const debounceTime = options.debounceTime || 300;

        let debouncedHandler: DebouncedFunction<EmailInputEventHandler> | undefined;

        if (options.mode === 'onBlur') {
            node.addEventListener('blur', boundHandler);
        } else if (options.mode === 'onChange') {
            debouncedHandler = debounce(boundHandler, debounceTime);
            node.addEventListener('input', (e) => {
                showLoader();
                debouncedHandler?.(e);
            });
        }

        return debouncedHandler;
    }

    start() {
        this.node.classList.add(SkipifyClassNames.emailInput);
        this._debounceController = this.setEventListener(this.node, this.handleInput, this.options);
    }

    handleInput(e: Event) {
        // Check if the password input element exists and return early if it does
        if (this.passwordInputId && document.getElementById(this.passwordInputId)) return;

        // Ensure the event target is a valid HTMLInputElement
        const target = e.target as HTMLInputElement;
        if (!target) {
            throw new Error('Invalid target. Email input field must be an HTMLInputElement.');
        }

        const emailValue = target.value;

        // Clear any existing timeout to reset the loader timer
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
        }

        // Check if the email is valid
        if (isEmailValid(emailValue)) {
            this.resetIframe();
            this.setUserEmail(emailValue);
        } else {
            // Show loader for 3 seconds if the email is not valid
            this.loadingTimeout = setTimeout(() => {
                hideLoader();
            }, 3000);
        }
    }
}
