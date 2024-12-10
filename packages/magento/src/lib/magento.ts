import {
  AbstractSDK,
  Base,
  SkipifyClassNames,
  PlatformCartType,
  isEmailValid,
  insertLoadingStateElement
} from "@checkout-sdk/shared";
import { EmailInput } from "@checkout-sdk/shared/classes";
import { MagentoStoreFrontApi } from "./utils/storeFrontApi";

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


  /**
    * Child classes that implements specific business logic.
    */
  emailInput: EmailInput | null = null;

  storeFrontApi: MagentoStoreFrontApi;

  constructor({ merchantId }: Props = {}) {
    super(merchantId);

    this.platform = "magento";
    this.storeFrontApi = new MagentoStoreFrontApi();
  }

  override processDOM() {
    this.processEmailInput();
  }

  processEmailInput() {
    const emailInputElem = document.getElementById(this.emailInputId) as HTMLInputElement;

    if (!emailInputElem) {
      return;
    }

    if (emailInputElem?.classList.contains(SkipifyClassNames.emailInput)) {
      return;
    }

    const buttonCustomStyles = {
      width: `${emailInputElem.offsetHeight - 2}px`,
      height: `${emailInputElem.offsetHeight - 2}px`,
      right: `${(emailInputElem.parentElement?.offsetWidth || 0) - emailInputElem.offsetWidth + 1}px`,
      top: '1px',
      borderRadius: 0
    }
    this.insertButton(emailInputElem, buttonCustomStyles);

    if (emailInputElem?.value && isEmailValid(emailInputElem?.value)) {
      this.setUserLookupData(emailInputElem?.value, undefined, true)
    }

    this.emailInput = new EmailInput({
      node: emailInputElem,
      setUserEmail: (email) => this.setUserLookupData(email, undefined, true),
      resetIframe: () => {
        this.messenger.closeIframe(true)
      },
    });

    insertLoadingStateElement(emailInputElem, { ...buttonCustomStyles, transform: 'none' })
  }

  processCheckoutCompleted(): void {
    // TODO
  }

  processEnrollmentCheckbox(): void {
    // TODO
  }

  override async getCartData(): Promise<PlatformCartType> {
    const userCart = await this.storeFrontApi.getUserCart();
    if (!userCart) {
      return null;
    }

    return { items: userCart.items, cartId: userCart.data_id };
  }

  override canShowIframe(): boolean {
    return true;
  }
}

export default new MagentoSDK();
