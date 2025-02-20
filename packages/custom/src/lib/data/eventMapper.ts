import { FeeUnit, FeeTypeEnum, Unit } from '@checkout-sdk/shared';

function removeProperties<T extends object>(obj: T | undefined, properties: (keyof T)[]): Partial<T> | undefined {
    if (obj) {
        properties.forEach((prop) => {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                delete obj[prop];
            }
        });
    }
    return obj;
}

function mapAddress(address: any) {
    return address
        ? { ...address, countryCode: address.country, localityCode: address.state, zipCode: address.zip }
        : undefined;
}

export function approvalEventMapper(input: any) {
    const paymentMethodPropertiesToRemove = ['address', 'addressId', 'externalId', 'isDefault', 'needsCvv', 'nickName'];
    const billingAddressPropertiesToRemove = ['externalId', 'isDefaultShipping', 'country', 'state', 'zip'];
    const shippingAddressPropertiesToRemove = [
        'externalId',
        'phoneNumber',
        'isDefaultShipping',
        'country',
        'state',
        'zip',
    ];

    const paymentMethod = removeProperties(
        input.customerInfo?.paymentMethod ? { ...input.customerInfo.paymentMethod } : undefined,
        paymentMethodPropertiesToRemove,
    );

    const billingAddress = removeProperties(mapAddress(input.billingInfo), billingAddressPropertiesToRemove);

    const shippingAddress = removeProperties(mapAddress(input.shippingInfo), shippingAddressPropertiesToRemove);

    const fees: FeeUnit[] = [];
    if (input.fees && Array.isArray(input.fees) && input.fees.length > 0) {
        input.fees.forEach((fee: { feeType: keyof typeof FeeTypeEnum; uom: string; value: number }) => {
            fees.push({
                type: fee.feeType,
                value: fee.value,
                uom: fee.uom,
            });
        });
    }

    let tipAmount: Unit = { value: 0, uom: 'USD' };
    if (input.tip) {
        tipAmount = input.tip;
    }

    return {
        merchantReference: input.orderId,
        customerInfo: {
            email: input.customerInfo?.email,
            paymentMethod: paymentMethod,
            phoneNumber: input.customerInfo?.phoneNumber,
        },
        shippingAddress: shippingAddress,
        billingAddress: billingAddress,
        shippingOptions: {
            id: input.shippingMethod?.externalId,
            optionName: input.shippingMethod?.name,
            defaultFee: input.shippingMethod?.price,
        },
        taxDetails: {
            value: input.taxes,
            uom: 'USD',
        },
        total: input.total,
        fees,
        tipAmount,
    };
}
