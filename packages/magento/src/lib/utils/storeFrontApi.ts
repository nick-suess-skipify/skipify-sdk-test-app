import { MagentoCartType } from "../magento.types";

export class MagentoStoreFrontApi {

    async getUserCart(): Promise<MagentoCartType | null> {
        return new Promise((resolve, reject) => {
            (require as any)(['Magento_Customer/js/customer-data', 'Magento_Checkout/js/model/quote'], function (customerData: any, quote: any) {
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
            });
        });
    }
}
