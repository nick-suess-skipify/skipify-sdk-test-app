import { BigCommerceCart, BigCommerceCheckout } from "../bigcommerce.types";

export class BigCommerceStoreFrontApi {
  private getStoreFrontUrl(path: string) {
    return `/api/storefront/${path}`;
  }

  async getUserCart(): Promise<BigCommerceCart | null> {
    const params = new URLSearchParams({ include: "lineItems.physicalItems.options,lineItems.digitalItems.options" });
    const response = await fetch(this.getStoreFrontUrl(`carts?${params.toString()}`), {
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

  async getUserCheckout(cartId: string): Promise<BigCommerceCheckout | null> {
    const response = await fetch(this.getStoreFrontUrl(`checkouts/${cartId}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get checkout");
    }

    const checkout = (await response.json()) as BigCommerceCheckout;
    return checkout
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
