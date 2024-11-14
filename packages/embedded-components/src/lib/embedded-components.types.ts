export type ShopperType = {
    email: string,
    phone?: string
};

export type LookupResponseType = {
    challengeId: string,
    flags: {
        phoneRequired: boolean,
        potentialPaymentMethods: boolean,
        partnerProvidedPhone: boolean
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

export type AuthenticationResultType = {
    shopperId: string,
    sessionId: string
};

export type AuthenticationErrorType = {
  error: {
    message: string;
  };
}
export type AuthenticationOptionsType = {
    onSuccess: (results: AuthenticationResultType) => void,
    onError: (error: AuthenticationErrorType) => void,
    phone?: string,
    sendOtp?: boolean
};

export type SkipifyErrorType = {
    message: string
}
