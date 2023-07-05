import { AbstractSDK, Base } from "../shared";

class ShopifySDK extends Base implements AbstractSDK {
  processEmailInput(): void {
    console.log("Shopify - processEmailInput");
  }

  processCheckoutCompleted(): void {
    console.log("Shopify - processCheckoutCompleted");
  }

  processEnrollmentCheckbox(): void {
    console.log("Shopify - processEnrollmentCheckbox");
  }
}

export default new ShopifySDK();
