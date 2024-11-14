import { z } from "zod";
import { SkipifyApi } from '@checkout-sdk/shared/lib/utils/api';
import { SDKVersion, SkipifyCheckoutUrl } from "@checkout-sdk/shared/lib/constants";
import { ShopperType, LookupResponseType, AuthenticationOptionsType, AuthenticationResultType, AuthenticationErrorType } from './embedded-components.types';
import { ShopperSchema, AuthenticationOptionsSchema, LookupResponseSchema } from './embedded-components.schemas';
import { MerchantType } from '@checkout-sdk/shared/lib/shared.types'; // Import styles, likely will not use shared styles
import { SkipifyError } from './error';
import { Messenger } from './messenger';

import './styles/index.css'; // Most likely will not use shared styles because iframes are significantly different

import { Config, ConfigType } from './config';

class EmbeddedComponentsSDK {
  // Config
  config: Config;

  merchant: MerchantType | null = null;

  //  Helper classes
  messenger: Messenger;
  api: SkipifyApi;

  //  Internal
  componentsUrl: string;

  constructor(config: ConfigType) {
    // Validate initialization configs
    this.config = new Config(config);

    // Checkout Urls
    this.componentsUrl = `${SkipifyCheckoutUrl}/components/${this.config.merchantId}/lookup`

    // Initial setup
    this.messenger = new Messenger();
    this.api = new SkipifyApi({ merchantId: this.config.merchantId });

    this.start();
  }

  // Static var to store SDK version
  static version = SDKVersion

  start() {
    this.launchBaseIframe();
  }

  launchBaseIframe() {
    this.messenger.launchBaseIframe(this.componentsUrl);
  }

  async lookup(shopper: ShopperType) {
    const schemaValidation = this.validateWithSchema(ShopperSchema, shopper);
    if (schemaValidation instanceof SkipifyError) {
      return schemaValidation;
    }

    if (!this.messenger.listenerReady) {
      return new SkipifyError('Iframe is not available. Please try again later.');
    }

    return this.messenger.lookup(shopper);
  }

  validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T | SkipifyError {
    try {
      return schema.parse(data);
    } catch (e) {
      if (e instanceof z.ZodError) {
        const firstErrorMessage = e.errors[0]?.message;
        return new SkipifyError(firstErrorMessage);
      }
      return new SkipifyError();
    }
  }

  authentication(lookupResult: LookupResponseType, options: AuthenticationOptionsType) {
    // Validate lookup result
    const lookupValidation = this.validateWithSchema(LookupResponseSchema, lookupResult);
    if (lookupValidation instanceof SkipifyError) {
        options.onError(lookupValidation);
        return;
    }

    // Validate options
    const optionsValidation = this.validateWithSchema(AuthenticationOptionsSchema, options);
    if (optionsValidation instanceof SkipifyError) {
        options.onError(optionsValidation);
        return;
    }

    const authUrl = `${SkipifyCheckoutUrl}/components/${this.config.merchantId}/authentication`;

    return {
        render: (containerId: string) => {
            if (!containerId) {
                options.onError(new SkipifyError('Container ID is required'));
                return;
            }

            const container = document.getElementById(containerId);
            if (!container) {
                options.onError(new SkipifyError(`Container with ID "${containerId}" not found`));
                return;
            }


            this.messenger.onAuthenticationSuccess((data: AuthenticationResultType) => {
                options.onSuccess(data);
            });

            this.messenger.onAuthenticationError((error: AuthenticationErrorType) => {
                options.onError(error);
            });

            // Launch authentication iframe
            this.messenger.launchAuthIframe(authUrl, container, {
                lookupData: lookupResult,
                options: {                 
                    phone: options.phone,
                    sendOtp: options.sendOtp ?? false
                }
            });
        }
    };
  }
}

window.skipify = EmbeddedComponentsSDK;

export default EmbeddedComponentsSDK;
