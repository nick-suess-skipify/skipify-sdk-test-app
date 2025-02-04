/* eslint-disable @typescript-eslint/no-explicit-any */
import { MagentoCartType, MagentoShippingAddressType } from '../magento.types';

const CART_CACHE_KEY = 'mage-cache-storage';

export class MagentoStoreFrontApi {
  isHyva = false
  constructor(props: { isHyva?: boolean }) {
    this.isHyva = Boolean(props.isHyva)
  }

  getFormKey() {
    const formKeyElement = document?.querySelector('[name="form_key"]');
    return formKeyElement ? (formKeyElement as HTMLInputElement).value : null;
  }

  getCachedData() {
    const cacheData = JSON.parse(localStorage.getItem(CART_CACHE_KEY) || 'null');

    if (!cacheData) return null;
    return cacheData;
  }

  getCartFromCache() {
    const cacheStorage = this.getCachedData();
    const cart = cacheStorage?.cart || {};

    return {
      id: this.isHyva ? cart.cartId || null : (window as any).checkoutConfig.quoteData.entity_id,
      items: cart.items,
    };
  }


  async getUserCart(): Promise<MagentoCartType | null> {
    const cachedCart = this.getCartFromCache();

    if (!cachedCart.id) {
      return null;
    }

    try {
      // This is required because REST api utilizes the quote_id
      const response = await fetch(`/rest/V1/guest-carts/${cachedCart.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch cart');

      const data = await response.json();

      return ({ ...cachedCart, data_id: data.id })
    } catch (error) {
      console.error('Error fetching guest cart:', error);
      return null;
    }
  }

  async clearCart(): Promise<boolean> {
    const cachedCart = this.getCartFromCache();
    if (!cachedCart?.id) return false;

    const formKey = this.getFormKey();
    if (!formKey) return false;

    try {
      const removeItemPromises = cachedCart.items.map((item: { item_id: string }) =>
        fetch('/checkout/sidebar/removeItem/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ item_id: item.item_id, form_key: formKey }).toString(),
        }).catch(error => console.error(`Error removing item ${item.item_id}:`, error))
      );

      await Promise.all(removeItemPromises);
      return true;
    } catch (error) {
      console.error('Error clearing guest cart:', error);
      return false;
    }
  }

  async getUserShippingAddress(): Promise<MagentoShippingAddressType> {
    return new Promise((resolve, reject) => {
      (require as any)(
        ['Magento_Checkout/js/model/quote'],
        function (quote: any) {
          try {
            const shippingAddress = quote.shippingAddress();
            resolve(shippingAddress);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }
}
