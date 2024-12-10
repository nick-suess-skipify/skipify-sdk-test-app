type MagentoItemOptionType = {
    label: string;
    value: string;
    option_id: number;
    option_value: string;
}

type MagentoItemType = {
    item_id: string;
    product_id: string;
    product_sku: string;
    product_type: string;
    product_url: string;
    qty: number;
    options: MagentoItemOptionType[];
}

export type MagentoCartType = {
    data_id: string;
    items: MagentoItemType[];
}