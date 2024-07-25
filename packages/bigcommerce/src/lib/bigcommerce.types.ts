export type BigCommerceLineItem = {
  id?: string;
  variant_id: number;
  product_id: number;
  sku?: string;
};

export type BigCommerceCart = Record<string, unknown> & {
  id: string;
  email: string;
  customerId: number;
  lineItems: {
    physicalItems: [BigCommerceLineItem];
    digitalItems: [BigCommerceLineItem];
  };
};

export type BigCommerceAddress = {
  firstName: string;
  lastName: string;
  phone: string;
};

export type BigCommerceConsignment = {
  id: string;
  shippingAddress: BigCommerceAddress;
  address: BigCommerceAddress;
};

export type BigCommerceCheckout = Record<string, unknown> & {
  id: string;
  consignments: [BigCommerceConsignment]
};
