/**
 * @jest-environment jsdom
 */
import fetch from 'jest-fetch-mock';

import { EmailInput } from './utils/emailInput';
jest.mock('./utils/emailInput', () => ({
  EmailInput: jest.fn(),
}));
import BigCommerceSDK from './bigcommerce';

const fakeMerchant = {
  checkoutTestMode: false,
  urls: [],
  merchantId: 'fake-merchant-id',
  branding: {
    displayName: 'fake merchant name',
  },
};

describe('BigCommerceSDK', () => {
  let getElemSpy: any;
  beforeAll(() => {
    fetch.enableMocks();
    getElemSpy = jest.spyOn(document, 'getElementById');
  });

  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockResponseOnce(JSON.stringify({ data: fakeMerchant, ok: true }));
  });

  describe('constructor', () => {
    describe('processEmailInput', () => {
      it('should do nothing with no email input element', () => {
        getElemSpy.mockReturnValueOnce(undefined);

        const bcSDK = new BigCommerceSDK({
          emailInputId: 'does-not-exist',
          paymentButtonId: 'does-not-exist-either',
          merchantId: 'fake-merchant-id',
        });

        expect(EmailInput).not.toBeCalled();
      });

      it('should construct the EmailInput', () => {
        document.body.innerHTML = '<div></div>';
        const mockEmailInput = document.createElement('input');
        mockEmailInput.id = 'email-input';
        getElemSpy.mockReturnValueOnce(mockEmailInput);

        const bcSDK = new BigCommerceSDK({
          emailInputId: 'email-input',
          paymentButtonId: 'does-not-exist',
          merchantId: 'fake-merchant-id',
        });

        expect(EmailInput).toBeCalledWith(expect.objectContaining({
          node: mockEmailInput,
        }));
      });
    });
  });
});
