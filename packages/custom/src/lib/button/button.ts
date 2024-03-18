import { SkipifyCheckoutUrl, SdkUrl } from '@checkout-sdk/shared/lib/constants';
import { nanoid } from 'nanoid'
import { Config } from '../config';

export class Button {
    id: string;
    constructor(private config: Config, public merchantRef: string) {
        this.id = nanoid();
    }

    public render(elem: HTMLElement) {
        const wrapperEl = document.createElement('div');
        const checkoutButtonFrame = document.createElement('iframe');
        checkoutButtonFrame.style.border = 'none';
        checkoutButtonFrame.style.cursor = 'pointer';
        checkoutButtonFrame.style.height = '54px';
        checkoutButtonFrame.style.width = '100%';
        const checkoutButtonUrl = `${SdkUrl}/shared/components/iframe_checkoutButton.html?id=${this.id}&date=${new Date().getTime()}`;
        checkoutButtonFrame.src = checkoutButtonUrl;

        wrapperEl.appendChild(checkoutButtonFrame);

        elem.append(wrapperEl);
    }
}
