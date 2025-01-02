/* eslint-disable @typescript-eslint/no-explicit-any */
import { MagentoCartType, MagentoShippingAddressType } from '../magento.types';

export class MagentoStoreFrontApi {
  async getUserCart(): Promise<MagentoCartType | null> {
    return new Promise((resolve, reject) => {
      (require as any)(
        [
          'Magento_Customer/js/customer-data',
          'Magento_Checkout/js/model/quote',
        ],
        function (customerData: any, quote: any) {
          try {
            const cart = customerData.get('cart')();
            const quoteItems = quote.getItems();
            const quoteId = quoteItems[0]?.quote_id || null;

            if (!quoteId) {
              return resolve(null);
            }

            resolve({ ...cart, data_id: Number(quoteId) });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  async clearCart(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      (require as any)(['Magento_Customer/js/customer-data'], function (customerData: any) {
        try {
          const currentCartData = customerData.get('cart')() || {};
          const clearedCartData = {
            ...currentCartData,
            items: [],
            summary_count: 0,
          };

          customerData.set('cart', clearedCartData);

          resolve(true);
        } catch (error) {
          reject(false);
        }
      });
    });
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
