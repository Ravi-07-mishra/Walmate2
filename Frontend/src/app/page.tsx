import HeroCarousel from '@/components/hero-carousel';
import ProductGrid from '@/components/product-grid';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <HeroCarousel />
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Featured Products</h2>
        <p className="text-muted-foreground">Handpicked selections, just for you.</p>
        <Separator />
        <ProductGrid />
      </div>
    </div>
  );
}
