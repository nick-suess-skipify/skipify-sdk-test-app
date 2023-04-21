import { MerchantServiceUrl } from "../constants";

interface OwnProps {
  merchantId: string | null;
}

type Props = OwnProps;

export class SkipifyApi {
  merchantId: string | null;

  constructor({ merchantId }: Props) {
    this.merchantId = merchantId;
  }

  async getMerchant() {
    const response = await fetch(
      `${MerchantServiceUrl}/v1/merchant-shops/${this.merchantId}`,
      {
        // TODO Uncomment cache control policy once merchant service cors rules are fixed
        // headers: {
        //   "Cache-Control": "public, default, max-age=5000",
        // },
      }
    );

    if (!response.ok) {
      return Promise.reject(response);
    }
    return await response.json();
  }

  async isEmailWhitelisted(email: string) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      email,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
    };

    const response = await fetch(
      `${MerchantServiceUrl}/v1/merchant-shops/${this.merchantId}/check-email-whitelist`,
      requestOptions
    );

    if (!response.ok) {
      return false;
    }
    return true;
  }
}
