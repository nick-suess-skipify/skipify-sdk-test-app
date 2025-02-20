import { approvalEventMapper } from './eventMapper';

describe('approvalEventMapper', () => {
    it('should map input data to the expected output', () => {
        const input = {
            orderId: 'dummy_order_id',
            customerInfo: {
                email: 'dummy@example.com',
                paymentMethod: {
                    address: {
                        address1: '123 Dummy St',
                        address2: null,
                        city: 'Dummyville',
                        country: 'US',
                        externalId: 'dummy_payment_address_id',
                        firstName: 'John',
                        lastName: 'Doe',
                        isDefaultShipping: true,
                        phoneNumber: '1234567890',
                        state: 'CA',
                        zip: '12345',
                    },
                    addressId: 'dummy_payment_address_id',
                    cardBrand: 'VISA',
                    expMonth: 12,
                    expYear: 29,
                    externalId: 'dummy_payment_method_id',
                    fullNameCard: 'John Doe',
                    isDefault: true,
                    last4CardNumber: '1111',
                    needsCvv: true,
                    nickName: null,
                },
                phoneNumber: '1234567890',
            },
            shippingInfo: {
                address1: '123 Dummy St',
                address2: null,
                city: 'Dummyville',
                country: 'US',
                externalId: 'dummy_shipping_address_id',
                firstName: 'John',
                lastName: 'Doe',
                isDefaultShipping: true,
                phoneNumber: '1234567890',
                state: 'CA',
                zip: '12345',
            },
            billingInfo: {
                address1: '123 Dummy St',
                address2: null,
                city: 'Dummyville',
                country: 'US',
                externalId: 'dummy_billing_address_id',
                firstName: 'John',
                lastName: 'Doe',
                isDefaultShipping: true,
                phoneNumber: '1234567890',
                state: 'CA',
                zip: '12345',
            },
            shippingMethod: {
                externalId: 'dummy_shipping_method_id',
                name: 'Dummy Shipping',
                price: 800,
            },
            taxes: 289,
            transactionDetails: {
                PspTransactionId: 'dummy_psp_transaction_id',
                pspRawResponse: 'dummy_psp_response',
            },
        };

        const expectedOutput = {
            merchantReference: 'dummy_order_id',
            customerInfo: {
                email: 'dummy@example.com',
                paymentMethod: {
                    cardBrand: 'VISA',
                    expMonth: 12,
                    expYear: 29,
                    fullNameCard: 'John Doe',
                    last4CardNumber: '1111',
                },
                phoneNumber: '1234567890',
            },
            shippingAddress: {
                address1: '123 Dummy St',
                address2: null,
                city: 'Dummyville',
                country: 'US',
                firstName: 'John',
                lastName: 'Doe',
                state: 'CA',
                zip: '12345',
            },
            billingAddress: {
                address1: '123 Dummy St',
                address2: null,
                city: 'Dummyville',
                country: 'US',
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '1234567890',
                state: 'CA',
                zip: '12345',
            },
            shippingOptions: {
                id: 'dummy_shipping_method_id',
                optionName: 'Dummy Shipping',
                defaultFee: 800,
            },
            taxDetails: {
                value: 289,
                uom: 'USD',
            },
        };

        const output = approvalEventMapper(input);

        expect(output).toEqual(expectedOutput);
    });

    it('should not break on missing input data', () => {
        const input = {
            orderId: '12345',
            customerInfo: {
                email: 'test@example.com',
                phoneNumber: '1234567890',
            },
            shippingInfo: {
                address1: '123 Main St',
                address2: 'Apt 4B',
                city: 'New York',
                country: 'USA',
                firstName: 'John',
                lastName: 'Doe',
                state: 'NY',
                zip: '12345',
            },
            billingInfo: {
                address1: '456 Elm St',
                address2: 'Suite 200',
                city: 'Los Angeles',
                country: 'USA',
                firstName: 'Jane',
                lastName: 'Smith',
                phoneNumber: '9876543210',
                state: 'CA',
                zip: '54321',
            },
            shippingMethod: {
                externalId: '1',
                name: 'Standard Shipping',
                price: 9.99,
            },
            taxes: 5.0,
        };

        const expectedOutput = {
            merchantReference: '12345',
            customerInfo: {
                email: 'test@example.com',
                phoneNumber: '1234567890',
            },
            shippingAddress: {
                address1: '123 Main St',
                address2: 'Apt 4B',
                city: 'New York',
                country: 'USA',
                firstName: 'John',
                lastName: 'Doe',
                state: 'NY',
                zip: '12345',
            },
            billingAddress: {
                address1: '456 Elm St',
                address2: 'Suite 200',
                city: 'Los Angeles',
                country: 'USA',
                firstName: 'Jane',
                lastName: 'Smith',
                phoneNumber: '9876543210',
                state: 'CA',
                zip: '54321',
            },
            shippingOptions: {
                id: '1',
                optionName: 'Standard Shipping',
                defaultFee: 9.99,
            },
            taxDetails: {
                value: 5.0,
                uom: 'USD',
            },
        };

        const output = approvalEventMapper(input);

        expect(output).toEqual(expectedOutput);
    });
});
