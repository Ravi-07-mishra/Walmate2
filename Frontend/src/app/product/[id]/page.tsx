

import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import products from '@/data/products.json';
import type { Product } from '@/components/product-card';
import AddToCartButton from './add-to-cart-button';
import Link from 'next/link';

export function generateStaticParams() {
  return products.products.map((product) => ({
    id: product.id.toString(),
  }));
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = products.products.find(p => p.id === parseInt(params.id, 10));

  if (!product) {
    notFound();
  }

  const typedProduct: Product = product as Product;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>
        </Button>
      </div>
      <Card className="animate-in fade-in-50">
        <CardContent className="p-6 grid md:grid-cols-2 gap-8">
          <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              data-ai-hint={product.dataAiHint}
              loading="lazy"
            />
          </div>
          <div className="flex flex-col space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{product.description}</p>
            </div>
            
            <p className="text-5xl font-extrabold text-primary">₹{product.price.toLocaleString('en-IN')}</p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-lg">Material</h4>
                <p className="text-muted-foreground">{product.material || 'High-quality materials'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-lg">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {(product.features?.split(',') || []).map(f => <Badge key={f.trim()} variant="secondary" className="text-base px-3 py-1">{f.trim()}</Badge>)}
                </div>
              </div>
            </div>
            
            <div className="pt-6">
                <AddToCartButton product={typedProduct} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
