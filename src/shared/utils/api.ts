import { SkipifyAuthUser, SkipifyTestMode } from "../shared.types";
import {
  MerchantServiceUrl,
  AuthServiceUrl,
  OrderServiceUrl,
} from "../constants";

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

  async getMerchantTestModeStatus(): Promise<SkipifyTestMode> {
    const response = await fetch(
      `${MerchantServiceUrl}/v1/merchant-shops/${this.merchantId}/merchant-configurations?configName=checkout-test-mode`,
      {
        // TODO Uncomment cache control policy once merchant service cors rules are fixed
        // headers: {
        //   "Cache-Control": "public, default, max-age=5000",
        // },
      }
    );

    if (!response.ok) {
      return Promise.reject();
    }
    return await response.json();
  }

  async createOrder(cartData: any) {
    // TODO Remove order service mocks

    // const response = await fetch(
    //   `${OrderServiceUrl}/v1/create/${this.merchantId}`,
    //   {
    //     method: "POST",
    //     body: cartData ? JSON.stringify(cartData) : null,
    //   }
    // );

    // if (!response.ok) {
    //   return Promise.reject(response);
    // }
    // return await response.json();

    return {
      id: 2,
    };
  }

  async emailLookup(email: string): Promise<SkipifyAuthUser> {
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
      `${AuthServiceUrl}/v3/auth/lookup_user`,
      requestOptions
    );

    if (!response.ok) {
      return Promise.reject(response);
    }
    const { data } = await response.json();

    return data as SkipifyAuthUser;
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
