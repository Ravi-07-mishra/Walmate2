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
import { savePreferences } from '@/lib/api';

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

    // Use the savePreferences function we defined
    await savePreferences(payload);
    
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            Tell Us About Your Preferences
          </CardTitle>
          <CardDescription className="text-lg">
            Help us personalize your shopping experience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Gender */}
          <div className="space-y-4">
            <Label className="text-base">Gender</Label>
            <div className="flex flex-wrap gap-3">
              {genders.map(gender => (
                <Button
                  key={gender}
                  variant={formData.gender === gender ? 'default' : 'outline'}
                  onClick={() => setFormData({...formData, gender})}
                  className="rounded-full"
                >
                  {gender}
                </Button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label htmlFor="size" className="text-base">Preferred Clothing Size</Label>
            <Select
              value={formData.size}
              onValueChange={(val) => setFormData({...formData, size: val})}
            >
              <SelectTrigger id="size" className="w-full">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {sizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Favorite Colors */}
          <div className="space-y-4">
            <Label className="text-base">Favorite Colors</Label>
            <div className="flex flex-wrap gap-3">
              {colors.map(color => (
                <div key={color} className="flex items-center space-x-2">
                  <Checkbox
                    id={color}
                    checked={formData.colors.includes(color)}
                    onCheckedChange={() => setFormData({
                      ...formData,
                      colors: toggleArrayItem(color, formData.colors)
                    })}
                    className="h-6 w-6 rounded-md border-2 data-[state=checked]:border-primary"
                  />
                  <Label htmlFor={color} className="text-sm font-medium leading-none">
                    {color}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Brands */}
          <div className="space-y-4">
            <Label className="text-base">Favorite Brands</Label>
            <div className="flex flex-wrap gap-3">
              {brands.map(brand => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={formData.brands.includes(brand)}
                    onCheckedChange={() => setFormData({
                      ...formData,
                      brands: toggleArrayItem(brand, formData.brands)
                    })}
                    className="h-6 w-6 rounded-md border-2 data-[state=checked]:border-primary"
                  />
                  <Label htmlFor={`brand-${brand}`} className="text-sm font-medium leading-none">
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
            <Input
              placeholder="Other brand (please specify)"
              value={formData.customBrand}
              onChange={(e) => setFormData({...formData, customBrand: e.target.value})}
              className="mt-2"
            />
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <Label className="text-base">Categories You're Interested In</Label>
            <div className="flex flex-wrap gap-3">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={formData.categories.includes(cat) ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({
                    ...formData,
                    categories: toggleArrayItem(cat, formData.categories)
                  })}
                  className="rounded-full"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Shopping Frequency */}
          <div className="space-y-4">
            <Label className="text-base">How often do you shop?</Label>
            <div className="flex flex-wrap gap-3">
              {shoppingFrequencies.map(freq => (
                <Button
                  key={freq}
                  variant={formData.shoppingFrequency === freq ? 'default' : 'outline'}
                  onClick={() => setFormData({...formData, shoppingFrequency: freq})}
                  className="rounded-full"
                >
                  {freq}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <Label className="text-base">
              Preferred Price Range: ₹{formData.priceRange[0]} - ₹{formData.priceRange[1]}
            </Label>
            <Slider
              value={formData.priceRange}
              onValueChange={(value) => setFormData({...formData, priceRange: value as [number, number]})}
              min={100}
              max={10000}
              step={100}
              minStepsBetweenThumbs={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>₹100</span>
              <span>₹10,000</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}