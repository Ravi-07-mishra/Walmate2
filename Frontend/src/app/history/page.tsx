
'use client';

import ProductCard from '@/components/product-card';
import products from '@/data/products.json';

// For demonstration, we'll show a few products as "recently viewed".
// In a real app, this would be based on actual user history.
const recentlyViewed = products.products.slice(3, 7);

export default function HistoryPage() {
  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Shopping History</h1>
        <p className="text-muted-foreground">Here are some of the items you've recently viewed.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recentlyViewed.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    </div>
  );
}
