import { ShippingAddressType } from '@checkout-sdk/shared';

export type ShopperType = {
    email?: string;
    phone?: string;
};

export type LookupResponseType = {
    challengeId: string;
    flags: {
        phoneRequired: boolean;
        potentialPaymentMethods: boolean;
        partnerProvidedPhone: boolean;
    };
    metadata?: {
        maskedEmail?: string;
        maskedPhone?: string;
    };
    defaults?: {
        maskedChannel?: string;
        destination?: string;
    };
};

export type AuthenticationResponseType = {
    shopperId: string;
    sessionId: string;
};

export type AuthenticationErrorType = {
    error: {
        message: string;
    };
};
export type AuthenticationOptionsType = {
    onSuccess: (results: AuthenticationResponseType) => void;
    onError: (error: AuthenticationErrorType) => void;
    phone?: string;
    sendOtp?: boolean;
    displayMode?: 'embedded' | 'overlay';
    config?: {
        theme?: 'light' | 'dark';
        fontFamily?: 'serif' | 'sans-serif' | 'default';
        fontSize?: 'small' | 'medium' | 'large';
    };
};

export type SkipifyErrorType = {
    message: string;
};

export type CarouselResponseType = {
    paymentId: string | null;
    sessionId?: string;
    metadata?: {
        networkType?: string;
        expiryDate?: string;
        lastFour?: string;
    };
    address?: ShippingAddressType;
};

export type CarouselErrorResponseType = {
    error: {
        message: string;
    };
};

export type CarouselOptionsType = {
    onSelect: (results: CarouselResponseType) => void;
    onError: (error: CarouselErrorResponseType) => void;
    amount: number;
    phone?: string;
    sendOtp?: boolean;
    displayMode?: 'embedded' | 'overlay';
    config?: {
        theme?: 'light' | 'dark';
        fontFamily?: 'serif' | 'sans-serif' | 'default';
        fontSize?: 'small' | 'medium' | 'large';
    };
};

export type DeviceIdResponseType = {
    deviceId: string;
};
