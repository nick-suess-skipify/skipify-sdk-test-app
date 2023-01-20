import { MerchantServiceUrl, AuthServiceUrl } from "../constants";
import { SkipifyAuthUser, SkipifyTestMode } from "../shared.types";

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
    return new Promise(function (resolve) {
      setTimeout(function () {
        return resolve({ enabled: true });
      }, 100);
    });

    // TODO: uncomment when integration is ready
    // const response = await fetch(
    //   `${MerchantServiceUrl}/v1/merchant-shops/${this.merchantId}/merchant-configurations?configName=checkout-test-mode`,
    //   {
    //     // TODO Uncomment cache control policy once merchant service cors rules are fixed
    //     // headers: {
    //     //   "Cache-Control": "public, default, max-age=5000",
    //     // },
    //   }
    // );

    // if (!response.ok) {
    //   return Promise.reject(response);
    // }
    // return await response.json();
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
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (email.endsWith("skipify.com")) {
          resolve({});
        } else {
          reject({});
        }
      }, 100);
    });

    // TODO: uncomment when integration is ready
    // const myHeaders = new Headers();
    // myHeaders.append("Content-Type", "application/json");

    // const raw = JSON.stringify({
    //   email,
    // });

    // const requestOptions = {
    //   method: "POST",
    //   headers: myHeaders,
    //   body: raw,
    // };

    // const response = await fetch(
    //   `${MerchantServiceUrl}/v1/merchant-shops/${this.merchantId}/check-email-whitelist`,
    //   requestOptions
    // );

    // if (!response.ok) {
    //   return Promise.reject(response);
    // }
    // return await response.json();
  }
}
