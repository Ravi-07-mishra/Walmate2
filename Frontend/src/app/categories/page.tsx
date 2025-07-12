import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

const categories = [
    { name: 'Clothing', imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'fashion clothing' },
    { name: 'Footwear', imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'stylish shoes' },
    { name: 'Bags', imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'leather handbag' },
    { name: 'Eyewear', imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'sunglasses collection' },
    { name: 'Accessories', imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'watches jewelry' },
    { name: 'Electronics', imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'modern gadgets' },
    { name: 'Home Goods', imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'cozy living room' },
    { name: 'Beauty', imageUrl: 'https://placehold.co/400x300.png', dataAiHint: 'cosmetics makeup' },
]

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Product Categories</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map(category => (
                <Link href="#" key={category.name}>
                    <Card className="group overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-0 relative">
                            <div className="aspect-video relative">
                                <Image
                                    src={category.imageUrl}
                                    alt={category.name}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    data-ai-hint={category.dataAiHint}
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h3 className="text-2xl font-bold text-white tracking-wider">{category.name}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    </div>
  );
}
