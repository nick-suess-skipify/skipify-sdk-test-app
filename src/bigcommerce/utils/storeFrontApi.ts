type BigCommerceLineItem = {
  id?: string;
  variant_id: number;
  product_id: number;
  sku?: string;
};

type BigCommerceCart = Record<string, unknown> & {
  id: string;
  email: string;
  lineItems: {
    physicalItems: [BigCommerceLineItem];
    digitalItems: [BigCommerceLineItem];
  };
};

export class BigCommerceStoreFrontApi {
  private getStoreFrontUrl(path: string) {
    return `/api/storefront/${path}`;
  }

  async getUserCart(): Promise<BigCommerceCart | null> {
    const response = await fetch(this.getStoreFrontUrl("carts"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get carts");
    }

    const carts = (await response.json()) as BigCommerceCart[];
    return carts.length > 0 ? carts[0] : null;
  }

  async deleteCart(cartId: string) {
    await fetch(this.getStoreFrontUrl(`carts/${cartId}`), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getOrder(orderId: string) {
    const response = await fetch(this.getStoreFrontUrl(`orders/${orderId}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const order = await response.json();
    return order;
  }
}
