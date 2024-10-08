import { SkipifyApi } from '@checkout-sdk/shared/lib/utils/api';
import { SDKVersion, SkipifyCheckoutUrl } from "@checkout-sdk/shared/lib/constants";
import { MerchantType } from '@checkout-sdk/shared/lib/shared.types'; // Import styles, likely will not use shared styles
import { log } from '@checkout-sdk/shared/lib/utils/log';

import './styles/index.css'; // Most likely will not use shared styles because iframes are significantly different

import { Config, ConfigType } from './config';

class EmbeddedComponentsSDK {
  // Config
  config: Config;
  
  merchant: MerchantType | null = null;
  //
  // //  Helper classes
  api: SkipifyApi;
  //
  // //  Internal
  checkoutUrl: string;

  constructor(config: ConfigType) {
    // Validate initialization configs
    this.config = new Config(config);

    // Checkout Urls
    this.checkoutUrl = `${SkipifyCheckoutUrl}/embed/${this.config.merchantId}/lookup`

    this.api = new SkipifyApi({ merchantId: this.config.merchantId });
    this.start();
  }

  // Static var to store SDK version
  static version = SDKVersion

  start() {
    log('Embedded Components SDK Started', { version: EmbeddedComponentsSDK.version, merchantId: this.config.merchantId});
  }


}

window.skipify = EmbeddedComponentsSDK;

export default EmbeddedComponentsSDK;
