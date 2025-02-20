import { mock } from 'jest-mock-extended';
import EmbeddedComponentsSDK from './embedded-components';
import { Messenger } from './messenger';
import { ConfigType } from './config';
import { SkipifyError } from './error';
import { LookupResponseType } from './embedded-components.types';

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

    describe('lookup', () => {
        let mockMessenger: Messenger;
        const mockLookupResponse: LookupResponseType = {
            challengeId: 'challenge-id',
            flags: {
                phoneRequired: false,
                potentialPaymentMethods: true,
                partnerProvidedPhone: true,
            },
        };

        beforeEach(() => {
            mockMessenger = mock<Messenger>();
            sdk.messenger = mockMessenger;
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return SkipifyError if schema validation fails', async () => {
            const result: any = await sdk.lookup({ email: '123' });
            expect(result).toBeInstanceOf(SkipifyError);
        });

        it('should validate empty email', async () => {
            const result: any = await sdk.lookup({ email: '' });
            expect(result).toBeInstanceOf(SkipifyError);
            expect(result.error.message).toBe('Invalid email');
        });

        it('should validate wrong email format', async () => {
            const result: any = await sdk.lookup({ email: 'mywrongemail@....' });
            expect(result).toBeInstanceOf(SkipifyError);
            expect(result.error.message).toBe('Invalid email');
        });

        it('should validate wrong phone format', async () => {
            const result: any = await sdk.lookup({ email: 'm@m.com', phone: '123' });
            expect(result).toBeInstanceOf(SkipifyError);
            expect(result.error.message).toBe('Invalid phone number');
        });

        it('should queue lookup when listener not ready and process when ready', async () => {
            mockMessenger.listenerReady = false;
            mockMessenger.lookup = jest.fn().mockResolvedValueOnce(mockLookupResponse);

            const lookupPromise = sdk.lookup({ email: 'm@m.com' });

            mockMessenger.listenerReady = true;
            sdk.processLookupQueue();

            const result = await lookupPromise;
            expect(result).toEqual(mockLookupResponse);
        });

        it('should timeout if listener does not become ready', async () => {
            mockMessenger.listenerReady = false;
            const lookupPromise = sdk.lookup({ email: 'm@m.com' });

            jest.advanceTimersByTime(5000);

            const result = await lookupPromise;
            expect(result).toBeInstanceOf(SkipifyError);
            expect(result).toEqual(new SkipifyError('Iframe is not available. Please try again later.'));
        });

        it('should call messenger lookup', async () => {
            mockMessenger.lookup = jest.fn().mockResolvedValueOnce(mockLookupResponse);

            const result: any = await sdk.lookup({ email: 'm@m.com' });
            expect(result).toBeInstanceOf(Object);
            expect(result).toHaveProperty('challengeId');
            expect(result.challengeId).toBe('challenge-id');
        });
    });
});
