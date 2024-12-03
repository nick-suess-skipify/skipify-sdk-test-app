import { MerchantServiceUrl, SKIPIFY_ANALYTICS_CONST } from "../constants";
import { MerchantType } from "../shared.types";

interface OwnProps {
  merchantId: string | null;
  analyticsSessionId?: string;
}

type Props = OwnProps;

export class SkipifyApi {
  merchantId: string | null;
  private readonly analyticsSessionId?: string;

  constructor({ merchantId, analyticsSessionId }: Props) {
    this.merchantId = merchantId;
    this.analyticsSessionId = analyticsSessionId;
  }

  async getMerchant(): Promise<MerchantType> {
    const response = await fetch(
      `${MerchantServiceUrl}/v1/merchants/${this.merchantId}/public`,
      {
        headers: {
          "Cache-Control": "public, default, max-age=5000",
          ...(this.analyticsSessionId ? {[SKIPIFY_ANALYTICS_CONST.HEADER_NAME]: this.analyticsSessionId} : {}),
        },
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

    if (this.analyticsSessionId) {
      myHeaders.append(SKIPIFY_ANALYTICS_CONST.HEADER_NAME, this.analyticsSessionId);
    }

    const raw = JSON.stringify({
      email,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
    };

    const response = await fetch(
      `${MerchantServiceUrl}/v1/merchants/${this.merchantId}/check-email-whitelist`,
      requestOptions
    );

    return response.ok;
  }
}
