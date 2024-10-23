export type ShopperType = {
    email: string,
    phone?: string
};

export type LookupResponseType = {
    challengeId: string,
    flags: {
        phoneRequired: boolean,
        potentialPaymentMethods: boolean,
        usePrefilledPhoneAvailable: boolean
    },
    metadata?: {
        maskedEmail?: string,
        maskedPhone?: string,
    },
    defaults?: {
        maskedChannel?: string,
        destination?: string,
    }
};

export type SkipifyErrorType = {
    message: string
}
