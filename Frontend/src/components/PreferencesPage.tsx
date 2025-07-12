'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const colors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Purple', 'Gray'];
const categories = ['Clothing', 'Shoes', 'Accessories', 'Bags', 'Electronics', 'Home Decor', 'Beauty', 'Sports'];
const genders = ['Men', 'Women', 'Non-binary', 'Prefer not to say'];
const brands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Levi\'s', 'Apple', 'Samsung', 'Sony', 'Puma', 'Gucci', 'Other'];
const shoppingFrequencies = [
  'Daily',
  'Weekly',
  'Monthly',
  'Few times a year',
  'Only during sales'
];

export default function PreferencesPage() {
  const [formData, setFormData] = useState({
    size: 'M',
    colors: [] as string[],
    categories: [] as string[],
    gender: '',
    brands: [] as string[],
    shoppingFrequency: '',
    priceRange: [500, 5000] as [number, number],
    customBrand: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const toggleArrayItem = (item: string, array: string[]) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        brands: formData.customBrand 
          ? [...formData.brands, formData.customBrand]
          : formData.brands
      };

      const resp = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!resp.ok) throw new Error('Failed to save preferences');
      
      toast({ 
        title: 'Preferences saved successfully!',
        description: 'We\'ll use these to personalize your experience.',
      });
      router.push('/');
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Something went wrong',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-xl mx-auto p-6 space-y-6 bg-white shadow-lg rounded-2xl">
      <h2 className="text-2xl font-semibold">Your Preferences</h2>
      <div>
        <Label htmlFor="size">Preferred Clothing Size</Label>
        <Select
          value={favoriteSize}
          onValueChange={(val) => setFavoriteSize(val)}
        >
          <SelectTrigger id="size" className="w-full">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {sizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Favorite Colors</Label>
        <div className="flex flex-wrap gap-4 mt-2">
          {colors.map(color => (
            <div key={color} className="flex items-center">
              <Checkbox
                id={color}
                checked={favoriteColors.includes(color)}
                onCheckedChange={() => toggleChoice(color, favoriteColors, setFavoriteColors)}
              />
              <Label htmlFor={color} className="ml-2">{color}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Categories You're Interested In</Label>
        <div className="flex flex-wrap gap-4 mt-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={favoriteCategories.includes(cat) ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => toggleChoice(cat, favoriteCategories, setFavoriteCategories)}
            >{cat}</Button>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}