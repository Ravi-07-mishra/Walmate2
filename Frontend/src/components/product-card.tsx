'use client';

import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '@/components/product';

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
  onViewDetails: () => void;
}

export default function ProductCard({ product, onSelect, onViewDetails }: ProductCardProps) {
    const formattedPrice = product.price.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    return (
        <Card className="group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full">
            <CardContent className="p-0 flex-grow">
                <div className="relative aspect-square">
                    <img
                        src={product.imageUrl || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                </div>
                <div className="p-4 space-y-2">
                    <CardTitle className="text-lg font-semibold">
                        {product.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                        {formattedPrice}
                    </p>
                    {product.material && (
                        <p className="text-sm text-muted-foreground">
                            Material: {product.material}
                        </p>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3 w-full">
                    <Button 
                        onClick={onSelect}
                        className="flex items-center justify-center"
                    >
                        <ShoppingCart className="h-4 w-4 mr-2" /> 
                        <span className="truncate">Add to Cart</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={onViewDetails}
                        className="flex items-center justify-center"
                    >
                        <Eye className="h-4 w-4 mr-2" /> 
                        <span className="truncate">Details</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}