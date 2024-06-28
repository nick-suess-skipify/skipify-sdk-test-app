function removeProperties(obj:any, properties: string[]) {
    if (obj) {
        properties.forEach(prop => {
            if (Object.prototype.hasOwnProperty.call(obj,prop)) {
                delete obj[prop];
            }
        });
    }
    return obj;
}

export function approvalEventMapper(input:any) {
    const paymentMethodPropertiesToRemove = ['address', 'addressId', 'externalId', 'isDefault', 'needsCvv', 'nickName'];
    const billingAddressPropertiesToRemove = ['externalId', 'isDefaultShipping'];
    const shippingAddressPropertiesToRemove = ['externalId', 'phoneNumber', 'isDefaultShipping'];

    const paymentMethod = removeProperties(
        input.customerInfo?.paymentMethod ? { ...input.customerInfo.paymentMethod } : undefined,
        paymentMethodPropertiesToRemove
    );

    const billingAddress = removeProperties(
        input.billingInfo ? { ...input.billingInfo } : undefined,
        billingAddressPropertiesToRemove
    );

    const shippingAddress = removeProperties(
        input.shippingInfo ? { ...input.shippingInfo } : undefined,
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
            Value: input.taxes,
            uom: "USD" // Assuming uom stands for Unit of Measure and it's USD for currency
        }
    };
}