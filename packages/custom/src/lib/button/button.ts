import { SdkUrl } from '@checkout-sdk/shared/lib/constants';
import { nanoid } from 'nanoid';
import { sanitizePhoneNumber } from '@checkout-sdk/shared';
import CustomSDK from '../custom';
import { AdditionalOptions, MerchantOptions } from '../config';

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
    constructor(
        private sdk: CustomSDK,
        public merchantRef: string,
        public options: AdditionalOptions = {},
        public merchantOptions?: MerchantOptions,
    ) {
        this.id = nanoid();

        if (this.options.phone) {
            const sanitizedPhone = sanitizePhoneNumber(this.options.phone);
            this.options.phone = sanitizedPhone;
        }
    }

    public render(elem: HTMLElement) {
        const wrapperEl = document.createElement('div');
        const checkoutButtonFrame = document.createElement('iframe');
        checkoutButtonFrame.style.border = 'none';
        checkoutButtonFrame.style.height = '75px';
        checkoutButtonFrame.style.maxWidth = '100%';
        checkoutButtonFrame.style.width = '100%';

        const paramsObj: any = { id: this.id, date: new Date().getTime().toString() };

        if (this.merchantOptions?.cobrandedLogo) {
            paramsObj.cobrandedLogo = this.merchantOptions?.cobrandedLogo;
        }

        if (this.options?.textColor && isValidHexColor(this.options.textColor)) {
            paramsObj.textColor = this.options.textColor;
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

        if (!this.sdk.messenger.listenerReady) {
            checkoutButtonFrame.style.opacity = '0.5';
        }

        this.frame = checkoutButtonFrame;

        wrapperEl.appendChild(checkoutButtonFrame);

        elem.append(wrapperEl);
    }

    public setOptions(options: AdditionalOptions & { merchantReference: string }) {
        // Merge new options while ensuring validity
        if (options.textColor && isValidHexColor(options.textColor)) {
            this.options.textColor = options.textColor;
        }
        if (options.bgColor && isValidHexColor(options.bgColor)) {
            this.options.bgColor = options.bgColor;
        }
        if (options.bgHoverColor && isValidHexColor(options.bgHoverColor)) {
            this.options.bgHoverColor = options.bgHoverColor;
        }
        if (options.logoPlacement && isValidLogoPlacement(options.logoPlacement)) {
            this.options.logoPlacement = options.logoPlacement;
        }
        if (options.buttonLabel && isValidButtonLabel(options.buttonLabel)) {
            this.options.buttonLabel = options.buttonLabel;
        }
        if (options.email) {
            this.options.email = options.email;
        }
        if (options.phone) {
            this.options.phone = sanitizePhoneNumber(options.phone);
        }
        if (options.total !== undefined) {
            this.options.total = options.total;
        }
        if (options.onClose) {
            this.options.onClose = options.onClose;
        }
        if (options.onApprove) {
            this.options.onApprove = options.onApprove;
        }
        if (options.merchantReference) {
            this.merchantRef = options.merchantReference;
        }
    }
}
