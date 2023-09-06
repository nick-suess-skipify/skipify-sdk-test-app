import { SkipifyCheckoutUrl, SdkUrl } from '@checkout-sdk/shared/lib/constants';
import { Config } from '../config';
import { Messenger } from '../messenger';

export type ButtonOptions = {
    createOrder: () => any;
};

export class Button {
    constructor(private config: Config, private messenger: Messenger, private options: ButtonOptions) {}

    public render(elem: HTMLElement) {
        const wrapperEl = document.createElement('div');

        const checkoutButtonFrame = document.createElement('iframe');
        checkoutButtonFrame.style.border = 'none';
        checkoutButtonFrame.style.cursor = 'pointer';
        checkoutButtonFrame.style.height = '54px';
        checkoutButtonFrame.style.width = '100%';
        const checkoutButtonUrl = `${SdkUrl}/shared/components/iframe_checkoutButton.html?date=${new Date().getTime()}`;
        checkoutButtonFrame.src = checkoutButtonUrl;

        this.messenger.buttonCheckoutCallback = this.options.createOrder;
        wrapperEl.appendChild(checkoutButtonFrame);

        elem.append(wrapperEl);
    }
}
