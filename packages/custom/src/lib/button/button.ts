import { SdkUrl } from '@checkout-sdk/shared/lib/constants';
import { nanoid } from 'nanoid'
import { Config, AdditionalOptions, MerchantOptions } from '../config';

function isValidHexColor(colorHex: string): boolean {
    return /^#([0-9A-Fa-f]{3}){1,2}$/.test(colorHex); // accept #fff or #ffffff
}

function isValidLogoPlacement(placement: string): boolean {
    return placement === 'inside' || placement === 'below';
}

function isValidButtonLabel(label: string): boolean {
    return label === 'Buy Now' || label === 'Pay Now';
}



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
        checkoutButtonFrame.style.height = '75px';
        checkoutButtonFrame.style.maxWidth = '100%';

        const paramsObj: any = { id: this.id, date: new Date().getTime().toString() }

        if (this.merchantOptions?.cobrandedLogo) {
            paramsObj.cobrandedLogo = this.merchantOptions?.cobrandedLogo
        }

        if (this.options?.textColor && isValidHexColor(this.options.textColor)) {
            paramsObj.textColor = this.options.textColor
        }

        if (this.options?.bgColor && isValidHexColor(this.options.bgColor)) {
            paramsObj.bgColor = this.options.bgColor;
        }

        if (this.options?.bgHoverColor && isValidHexColor(this.options.bgHoverColor)) {
            paramsObj.bgHoverColor = this.options.bgHoverColor;
        }

        if (this.options?.logoPlacement && isValidLogoPlacement(this.options.logoPlacement)) {
            paramsObj.logoPlacement = this.options.logoPlacement;
        }

        if (this.options?.buttonLabel && isValidButtonLabel(this.options.buttonLabel)) {
            paramsObj.buttonLabel = this.options.buttonLabel;
        }

        const params = new URLSearchParams(paramsObj);

        const checkoutButtonUrl = `${SdkUrl}/shared/components/iframe_checkoutButton.html?${params.toString()}`;
        checkoutButtonFrame.src = checkoutButtonUrl;

        this.frame = checkoutButtonFrame;
        wrapperEl.appendChild(checkoutButtonFrame);

        elem.append(wrapperEl);
    }
}
