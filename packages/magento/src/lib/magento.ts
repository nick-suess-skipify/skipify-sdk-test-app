import {
    AbstractSDK,
    Base,
    SkipifyClassNames,
    PlatformCartType,
    isEmailValid,
    insertLoadingStateElement,
    SkipifyElementIds,
    UserEnrollmentInformationType,
    ShippingAddressType,
} from '@checkout-sdk/shared';
import { CheckoutCompleted, EmailInput, EnrollmentCheckbox } from '@checkout-sdk/shared/classes';
import { MagentoStoreFrontApi } from './utils/storeFrontApi';

interface OwnProps {
    merchantId?: string;
}

type Props = OwnProps;

export class MagentoSDK extends Base implements AbstractSDK {
    /**
     * Attributes that can be customizable on SDK instantiation.
     * Default values are assigned based on default Magento themes.
     */
    emailInputId = 'customer-email';
    emailInputSelector = '';
    paymentFormId = 'co-payment-form';
    paymentFormSelector = '';
    orderPaymentUrlMatch = /^.*\/checkout\/.*payment.*$/;
    orderConfirmationUrlMatch = /^.*\/checkout\/.*success.*$/;

    /**
     * Child classes that implements specific business logic.
     */
    emailInput: EmailInput | null = null;
    enrollmentCheckbox: EnrollmentCheckbox | null = null;
    checkoutCompleted: CheckoutCompleted | null = null;

    storeFrontApi: MagentoStoreFrontApi;
    isHyva = false;
    hasStoredAddress = false;

    constructor({ merchantId }: Props = {}) {
        super(merchantId);
        this.platform = 'magento';
        this.detectHyvaTheme();
        this.storeFrontApi = new MagentoStoreFrontApi({ isHyva: this.isHyva });
    }

    override processDOM() {
        this.processEmailInput();
        this.processEnrollmentCheckbox();
        this.storeUserShippingAddress();
        this.processCheckoutCompleted();
    }

    detectHyvaTheme() {
        this.isHyva = Boolean((window as any).Alpine); // Hyvä replaces Magento's default frontend stack with Alpine.js and Tailwind CSS
        if (this.isHyva) {
            this.emailInputSelector = 'input[type="email"]';
            this.paymentFormSelector = '.nav-main';
        }
    }

    processEmailInput() {
        const emailInputElem = (
            this.emailInputSelector
                ? document.querySelector(this.emailInputSelector)
                : document.getElementById(this.emailInputId)
        ) as HTMLInputElement | null;

        if (!emailInputElem) {
            return;
        }

        if (emailInputElem?.classList.contains(SkipifyClassNames.emailInput)) {
            return;
        }

        const sizeOffset = this.isHyva ? 4 : 2;
        const buttonCustomStyles: any = {
            width: `${emailInputElem.offsetHeight - sizeOffset}px`,
            height: `${emailInputElem.offsetHeight - sizeOffset}px`,
            top: this.isHyva ? '2px' : '1px',
            borderRadius: this.isHyva ? '4px' : '1px',
        };
        if (!this.isHyva) {
            buttonCustomStyles.right = `${
                (emailInputElem.parentElement?.offsetWidth || 0) - emailInputElem.offsetWidth + 1
            }px`;
        }
        this.insertButton(emailInputElem, buttonCustomStyles);

        if (emailInputElem?.value && isEmailValid(emailInputElem?.value)) {
            this.setUserLookupData(emailInputElem?.value, undefined, true);
        }

        this.emailInput = new EmailInput({
            node: emailInputElem,
            setUserEmail: (email) => this.setUserLookupData(email, undefined, true),
            resetIframe: () => {
                this.messenger.closeIframe(true);
            },
        });

        insertLoadingStateElement(emailInputElem, {
            ...buttonCustomStyles,
            transform: 'none',
        });
    }

    processCheckoutCompleted(): void {
        if (!this.orderConfirmationUrlMatch || !this.merchantId) return;

        const { enrollmentCheckboxValue, userEmail, eligible } = this.store.getState();

        const urlMatches = this.orderConfirmationUrlMatch.test(window.location.href);
        if (urlMatches && enrollmentCheckboxValue && userEmail && eligible) {
            this.checkoutCompleted = new CheckoutCompleted({
                launchEnrollmentIframe: () => this.launchEnrollmentIframe(),
            });
        }
    }

    storeUserShippingAddress() {
        if (!this.orderPaymentUrlMatch || this.isHyva || this.hasStoredAddress) {
            return;
        }

        const urlMatches = this.orderPaymentUrlMatch.test(window.location.href);
        if (urlMatches) {
            this.storeFrontApi.getUserShippingAddress().then((address) => {
                if (!address) return;

                const userShippingAddress: ShippingAddressType = {
                    address1: address.street[0],
                    city: address.city,
                    state: address.regionCode,
                    zipCode: address.postcode,
                    firstName: address.firstname,
                    lastName: address.lastname,
                };

                if (address.street[1]) {
                    userShippingAddress.address2 = address.street[1];
                }

                this.hasStoredAddress = true;
                this.store.setState({
                    userShippingAddress,
                    userPhone: address.telephone,
                });
            });
        }
    }

    override async getUserEnrollmentInformation(): Promise<UserEnrollmentInformationType | null> {
        const { userEmail, eligible, userShippingAddress, userPhone } = this.store.getState();
        if (!userEmail || !eligible) {
            return null;
        }

        const enrollmentData: UserEnrollmentInformationType = {
            email: userEmail,
        };

        if (userShippingAddress) {
            enrollmentData.shippingAddress = userShippingAddress;
        }

        if (userPhone) {
            enrollmentData.phone = userPhone;
        }

        return enrollmentData;
    }

    processEnrollmentCheckbox(): void {
        const paymentForm = (
            this.paymentFormSelector
                ? document.querySelector(this.paymentFormSelector)
                : document.getElementById(this.paymentFormId)
        ) as HTMLElement | null;

        const enrollmentCheckboxElem = document.getElementById(SkipifyElementIds.enrollmentCheckbox);

        if (!paymentForm || enrollmentCheckboxElem) {
            return;
        }

        this.setEnrollmentCheckboxValue(true);

        const { eligible, userEmail } = this.store.getState();

        if (!userEmail || !eligible) {
            return;
        }

        this.enrollmentCheckbox = new EnrollmentCheckbox({
            node: paymentForm as HTMLElement,
            insertionType: 'append',
            customStyles: this.isHyva ? { marginTop: '24px' } : {},
        });
    }

    isCheckoutOrCartPage(): boolean {
        const bodyClass = document.body.className;
        return (
            window.location.pathname.includes('checkout') ||
            window.location.pathname.includes('cart') ||
            bodyClass.includes('checkout-index-index') ||
            bodyClass.includes('cart-index-index') ||
            bodyClass.includes('hyva_checkout-index-index')
        );
    }

    override async getCartData(): Promise<PlatformCartType> {
        if (!this.isCheckoutOrCartPage()) {
            return null;
        }

        const userCart = await this.storeFrontApi.getUserCart();

        if (!userCart) {
            return null;
        }

        return { items: userCart.items, cartId: userCart.data_id };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override async handleOrderCompleted(_externalOrderId: string) {
        this.skipifyCheckoutCompleted = true;
        this.reset(); // Reset the store after the order is completed
        this.storeFrontApi.clearCart();
    }

    override canShowIframe(): boolean {
        return true;
    }

    override shouldInitialize() {
        return this.isCheckoutOrCartPage();
    }
}

// Factory function for creating an instance
export function createMagentoSDK(): MagentoSDK | null {
    try {
        return new MagentoSDK();
    } catch (error) {
        return null; // Fail silently
    }
}

const magentoSDK = createMagentoSDK();
export default magentoSDK;
