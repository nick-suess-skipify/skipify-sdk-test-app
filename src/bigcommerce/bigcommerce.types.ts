export type BigCommerceLineItem = {
  id?: string;
  variant_id: number;
  product_id: number;
  sku?: string;
};

export type BigCommerceCart = Record<string, unknown> & {
  id: string;
  email: string;
  lineItems: {
    physicalItems: [BigCommerceLineItem];
    digitalItems: [BigCommerceLineItem];
  };
};
