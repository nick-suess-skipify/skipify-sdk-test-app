import EmbeddedComponentsSDK from './embedded-components';
import { ConfigType } from './config';

describe('EmbeddedComponentsSDK', () => {
  const mockConfig: ConfigType = {
    merchantId: 'test-merchant-id',
  };

  let sdk: EmbeddedComponentsSDK;

  beforeEach(() => {
    sdk = new EmbeddedComponentsSDK(mockConfig);
  });

  it('should initialize with the correct config', () => {
    expect(sdk.config.merchantId).toBe(mockConfig.merchantId);
  });
});
