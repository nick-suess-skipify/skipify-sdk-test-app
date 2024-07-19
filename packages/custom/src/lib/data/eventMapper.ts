function removeProperties<T extends object>(obj: T | undefined, properties: (keyof T)[]): Partial<T> | undefined {
    if (obj) {
        properties.forEach(prop => {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                delete obj[prop];
            }
        });
    }
    return obj;
}

function mapAddress(address: any) {
    return address ? { ...address, countryCode: address.country, localityCode: address.state, zipCode: address.zip } : undefined;
}

export function approvalEventMapper(input: any) {
    const paymentMethodPropertiesToRemove = ['address', 'addressId', 'externalId', 'isDefault', 'needsCvv', 'nickName'];
    const billingAddressPropertiesToRemove = ['externalId', 'isDefaultShipping', 'country', 'state', 'zip'];
    const shippingAddressPropertiesToRemove = ['externalId', 'phoneNumber', 'isDefaultShipping', 'country', 'state', 'zip'];

    const paymentMethod = removeProperties(
        input.customerInfo?.paymentMethod ? { ...input.customerInfo.paymentMethod } : undefined,
        paymentMethodPropertiesToRemove
    );

    const billingAddress = removeProperties(
        mapAddress(input.billingInfo),
        billingAddressPropertiesToRemove
    );

    const shippingAddress = removeProperties(
        mapAddress(input.shippingInfo),
        shippingAddressPropertiesToRemove
    );

    return {
        merchantReference: input.orderId,
        customerInfo: {
            email: input.customerInfo?.email,
            paymentMethod: paymentMethod,
            phoneNumber: input.customerInfo?.phoneNumber
        },
        shippingAddress: shippingAddress,
        billingAddress: billingAddress,
        shippingOptions: {
            id: input.shippingMethod?.externalId,
            optionName: input.shippingMethod?.name,
            defaultFee: input.shippingMethod?.price
        },
        taxDetails: {
            value: input.taxes,
            uom: "USD" // Assuming uom stands for Unit of Measure and it's USD for currency
        }
    };
}