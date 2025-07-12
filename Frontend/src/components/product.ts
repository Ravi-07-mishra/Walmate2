export interface Product {
    id: string | number;
    product_code?: string;
    name: string;
    description: string;
    price: number;
    material?: string;
    durability?: string;
    imageUrl: string;
    features?: string[];
}