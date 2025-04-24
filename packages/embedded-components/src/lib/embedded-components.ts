import { z } from 'zod';
import { SkipifyApi } from '@checkout-sdk/shared/lib/utils/api';
import { SkipifyEvents } from '@checkout-sdk/shared/lib/utils/skipifyEvents';
import { SDKVersion, SKIPIFY_ANALYTICS_CONST, SkipifyCheckoutUrl } from '@checkout-sdk/shared/lib/constants';
import {
    ShopperType,
    LookupResponseType,
    AuthenticationOptionsType,
    AuthenticationResponseType,
    AuthenticationErrorType,
    CarouselOptionsType,
    CarouselResponseType,
} from './embedded-components.types';
import {
    ShopperSchema,
    AuthenticationOptionsSchema,
    LookupResponseSchema,
    AuthenticationResponseSchema,
    CarouselOptionsSchema,
} from './embedded-components.schemas';
import { MerchantType } from '@checkout-sdk/shared/lib/shared.types'; // Import styles, likely will not use shared styles
import { SkipifyError } from './error';
import { Messenger } from './messenger';
import { TTLStorage } from '@checkout-sdk/shared/lib/utils/ttlStorage';

import './styles/index.css'; // Most likely will not use shared styles because iframes are significantly different

import { Config, ConfigType } from './config';

class EmbeddedComponentsSDK {
    // Config
    config: Config;

    merchant: MerchantType | null = null;
    deviceId: string | undefined;

    //  Helper classes
    messenger: Messenger;
    api: SkipifyApi;
    skipifyEvents: SkipifyEvents;
    ttlStorage: TTLStorage;

    //  Internal
    componentsUrl: string;

    // Analytics session ID
    private readonly analyticsSessionId: string;

    private lookupQueue: {
        shopper: ShopperType;
        resolve: (value: unknown) => void;
        reject: (reason?: unknown) => void;
        timeoutId: NodeJS.Timeout;
    }[] = [];
    private readonly LOOKUP_TIMEOUT = 5000; // 5 seconds

    private static readonly VALIDATION_FAILED_RESPONSE = {
        render: /* Skip rendering due to validation failure */ () => null,
    } as const;

    constructor(config: ConfigType) {
        // Validate initialization configs
        this.config = new Config(config);

        // Checkout Urls
        this.componentsUrl = `${SkipifyCheckoutUrl}/components/${this.config.merchantId}/lookup`;

        // Initial setup
        this.messenger = new Messenger({ sdk: this });

        /* Recover or generate analytics session id */
        this.analyticsSessionId = Date.now().toString(10);
        this.ttlStorage = new TTLStorage();
        if (typeof window !== 'undefined') {
            const savedSessionId = this.ttlStorage.getItem<string>(SKIPIFY_ANALYTICS_CONST.LOCAL_STORAGE_KEY);
            this.analyticsSessionId = savedSessionId || this.analyticsSessionId;
            this.ttlStorage.setItem(
                SKIPIFY_ANALYTICS_CONST.LOCAL_STORAGE_KEY,
                this.analyticsSessionId,
                SKIPIFY_ANALYTICS_CONST.TTL,
            );
        }

        /**
         * SkipifyEvents implements analytic track requests
         */
        this.skipifyEvents = new SkipifyEvents();
        this.skipifyEvents.setSessionId(+this.analyticsSessionId);

        this.api = new SkipifyApi({ merchantId: this.config.merchantId, analyticsSessionId: this.analyticsSessionId });

        this.start();
    }

    // Static var to store SDK version
    static version = SDKVersion;

    start() {
        this.launchBaseIframe();
    }

    launchBaseIframe() {
        this.messenger.launchBaseIframe(this.componentsUrl);
    }

    async lookup(shopper: ShopperType = {}) {
        const schemaValidation = this.validateWithSchema(ShopperSchema, shopper);
        if (schemaValidation instanceof SkipifyError) {
            return schemaValidation;
        }

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.lookupQueue = this.lookupQueue.filter((item) => item.shopper !== shopper);
                reject(new SkipifyError('Iframe is not available. Please try again later.'));
            }, this.LOOKUP_TIMEOUT);

            this.lookupQueue.push({ shopper, resolve, reject, timeoutId });

            if (this.messenger.listenerReady) {
                this.processLookupQueue();
            }
        });
    }

    async processLookupQueue() {
        while (this.lookupQueue.length > 0) {
            const request = this.lookupQueue.shift();
            if (!request) continue;
            clearTimeout(request.timeoutId);

            try {
                const result = await this.messenger.lookup(request.shopper, {
                    skipifySessionId: this.analyticsSessionId,
                });
                request.resolve(result);
            } catch (error) {
                request.reject(error);
            }
        }
    }

    async getDeviceId() {
        return this.messenger.requestDeviceId();
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
            return EmbeddedComponentsSDK.VALIDATION_FAILED_RESPONSE;
        }

        // Validate options
        const optionsValidation = this.validateWithSchema(AuthenticationOptionsSchema, options);
        if (optionsValidation instanceof SkipifyError) {
            options.onError(optionsValidation);
            return EmbeddedComponentsSDK.VALIDATION_FAILED_RESPONSE;
        }

        const authUrl = `${SkipifyCheckoutUrl}/components/${this.config.merchantId}/authentication`;

        return {
            render: (element: HTMLElement) => {
                if (!element) {
                    options.onError(new SkipifyError(`Target element not found`));
                    return;
                }

                if (!(element instanceof HTMLElement)) {
                    options.onError(new SkipifyError(`Element must be a HTMLElement`));
                    return;
                }

                // Check if container is an input type when displayMode is 'overlay'
                if (options.displayMode === 'overlay' && !(element instanceof HTMLInputElement)) {
                    options.onError(new SkipifyError('Container must be an input element for overlay display mode'));
                    return;
                }

                this.messenger.onAuthenticationSuccess((data: AuthenticationResponseType) => {
                    options.onSuccess(data);
                });

                this.messenger.onAuthenticationError((error: AuthenticationErrorType) => {
                    options.onError(error);
                });

                // Launch authentication iframe
                this.messenger.launchAuthIframe(authUrl, element, {
                    skipifySessionId: this.analyticsSessionId,
                    lookupData: lookupResult,
                    options: {
                        phone: options.phone,
                        sendOtp: options.sendOtp ?? false,
                        displayMode: options.displayMode ?? 'embedded',
                        config: {
                            theme: options.config?.theme ?? 'light',
                            fontFamily: options.config?.fontFamily ?? 'default',
                            fontSize: options.config?.fontSize ?? 'medium',
                            inputFieldSize: options.config?.inputFieldSize ?? 'medium',
                        },
                    },
                });
            },
        };
    }

    carousel(data: LookupResponseType | AuthenticationResponseType, options: CarouselOptionsType) {
        // Validate data based on its type
        if ('sessionId' in data) {
            const authResultValidation = this.validateWithSchema(AuthenticationResponseSchema, data);
            if (authResultValidation instanceof SkipifyError) {
                options.onError(authResultValidation);
                return EmbeddedComponentsSDK.VALIDATION_FAILED_RESPONSE;
            }
        } else {
            const lookupValidation = this.validateWithSchema(LookupResponseSchema, data);
            if (lookupValidation instanceof SkipifyError) {
                options.onError(lookupValidation);
                return EmbeddedComponentsSDK.VALIDATION_FAILED_RESPONSE;
            }
        }

        // Validate options
        const optionsValidation = this.validateWithSchema(CarouselOptionsSchema, options);
        if (optionsValidation instanceof SkipifyError) {
            options.onError(optionsValidation);
            return EmbeddedComponentsSDK.VALIDATION_FAILED_RESPONSE;
        }

        const carouselUrl = `${SkipifyCheckoutUrl}/components/${this.config.merchantId}/carousel`;

        return {
            render: (container: HTMLElement) => {
                if (!container) {
                    options.onError({ error: { message: 'Target element not found' } });
                    return;
                }

                if (!(container instanceof HTMLElement)) {
                    options.onError(new SkipifyError(`Element must be a HTMLElement`));
                    return;
                }

                if (options.displayMode === 'overlay' && !(container instanceof HTMLInputElement)) {
                    options.onError(new SkipifyError('Container must be an input element for overlay display mode'));
                    return;
                }

                this.messenger.onCarouselSelect((data: CarouselResponseType) => {
                    options.onSelect(data);
                });

                this.messenger.onCarouselError((error: { error: { message: string } }) => {
                    options.onError(error);
                });

                // Launch carousel iframe with appropriate data
                this.messenger.launchCarouselIframe(carouselUrl, container, {
                    skipifySessionId: this.analyticsSessionId,
                    lookupData: 'sessionId' in data ? undefined : data,
                    authenticationResult: 'sessionId' in data ? data : undefined,
                    options: {
                        amount: options.amount,
                        phone: options.phone,
                        sendOtp: options.sendOtp ?? false,
                        displayMode: options.displayMode ?? 'embedded',
                        config: {
                            theme: options.config?.theme ?? 'light',
                            fontFamily: options.config?.fontFamily ?? 'default',
                            fontSize: options.config?.fontSize ?? 'medium',
                            inputFieldSize: options.config?.inputFieldSize ?? 'medium',
                        },
                    },
                });
            },
        };
    }
}

window.skipify = EmbeddedComponentsSDK;

export default EmbeddedComponentsSDK;
