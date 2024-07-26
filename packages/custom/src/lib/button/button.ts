import { SdkUrl } from '@checkout-sdk/shared/lib/constants';
import { nanoid } from 'nanoid'
import { Config, AdditionalOptions, MerchantOptions } from '../config';

export class Button {
    id: string;
    frame: HTMLIFrameElement | null = null;
    constructor(private config: Config, public merchantRef: string, public options?: AdditionalOptions, public merchantOptions?: MerchantOptions) {
        this.id = nanoid();
    }

    public render(elem: HTMLElement) {
        const wrapperEl = document.createElement('div');
        const checkoutButtonFrame = document.createElement('iframe');
        checkoutButtonFrame.style.border = 'none';
        checkoutButtonFrame.style.cursor = 'pointer';
        checkoutButtonFrame.style.height = '54px';
        checkoutButtonFrame.style.width = '100%';

        const paramsObj: any = { id: this.id, date: new Date().getTime().toString() }

        if (this.merchantOptions?.cobrandedLogo) {
            paramsObj.cobrandedLogo = this.merchantOptions?.cobrandedLogo
        }

        if (this.options?.textColor) {
            paramsObj.textColor = this.options.textColor
        }
        const params = new URLSearchParams(paramsObj);

        const checkoutButtonUrl = `${SdkUrl}/shared/components/iframe_checkoutButton.html?${params.toString()}`;
        checkoutButtonFrame.src = checkoutButtonUrl;

        this.frame = checkoutButtonFrame;
        wrapperEl.appendChild(checkoutButtonFrame);

        elem.append(wrapperEl);
    }
}
