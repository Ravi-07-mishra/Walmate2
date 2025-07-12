
'use client';

import { Button } from "@/components/ui/button";
import type { Product } from "@/components/product-card";
import { useCart } from "@/context/cart-context";
import { ShoppingCart } from "lucide-react";

export default function AddToCartButton({ product }: { product: Product }) {
    const { addToCart } = useCart();
    return (
        <Button size="lg" className="w-full md:w-auto" onClick={() => addToCart(product)}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
        </Button>
    );
}
