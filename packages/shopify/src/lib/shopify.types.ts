/**
 * window.Shopify global object
 */
export type ShopifyGlobalObject = {
    //yes, there are actually two different checkout objects
    //checkout is only for the final order complete page.
    checkout?: {
        order_id: string;
        billing_address: {
            address1: string;
            address2: string;
            city: string;
            company: null | string;
            country: string;
            country_code: string;
            first_name: string;
            id: number;
            last_name: string;
            phone: string;
            province: string;
            province_code: string;
            zip: string;
        };
        shipping_address: {
            address1: string;
            address2: string;
            city: string;
            company: null | string;
            country: string;
            country_code: string;
            first_name: string;
            id: number;
            last_name: string;
            phone: string;
            province: string;
            province_code: string;
            zip: string;
        };
        total_price: string; // in double format, need convert to number
        subtotal_price: string;
    };
    Checkout: {
        step: 'contact_information' | 'thank_you' | 'payment_method' | 'shipping_method';
        totalPrice: number;
        estimatedPrice: number; // this is the price before shipping and tax, equal to subtotal_price
    };
};

/**
 * @see https://shopify.dev/docs/api/ajax/reference/cart
 */
export type ShopifyCart = {
    items: ShopifyLineItem[];
};

/**
 * @see https://shopify.dev/docs/api/liquid/objects/line_item#line_item-properties
 */
export type ShopifyLineItem = {
    id: number;
    quantity: number;
    variant_id: number;
    product_id: number;
    sku: string;
    requires_shipping?: boolean;
};

/**
 * Mimic storefront api schema, we don't actually use storefront api.
 * @see https://github.com/SkipifyCheckout/ecom-connector/pull/228
 */
export type ShopifyLine = {
    quantity: number;
    merchandise: {
        id: string; // this is variant id
        product: {
            id: string; // this is product id
        };
    };
};
