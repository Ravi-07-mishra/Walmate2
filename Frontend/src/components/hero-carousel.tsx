'use client';

import * as React from 'react';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';

const banners = [
  {
    title: 'Latest in Fashion',
    description: 'Discover the new wave of style',
    imageUrl: '/images/banner1.png',
    dataAiHint: 'fashion runway',
    category: 'clothing',
  },
  {
    title: 'Step Up Your Game',
    description: 'Find the perfect pair of shoes',
    imageUrl: '/images/banner2.png',
    dataAiHint: 'stylish sneakers',
    category: 'footwear',
  },
  {
    title: 'Bags for Every Occasion',
    description: 'From casual totes to elegant clutches',
    imageUrl: '/images/banner3.png',
    dataAiHint: 'handbag collection',
    category: 'bags',
  },
  {
    title: 'The Finishing Touch',
    description: 'Trendy eyewear to complete your look',
    imageUrl: '/images/banner4.png',
    dataAiHint: 'sunglasses display',
    category: 'eyewear',
  },
];

export default function HeroCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      opts={{ loop: true }}
    >
      <CarouselContent>
        {banners.map((banner, index) => (
          <CarouselItem key={index}>
            <Card className="overflow-hidden">
              <CardContent className="relative p-0 aspect-video md:aspect-[2.4/1] flex items-center justify-center">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  width={1200}
                  height={500}
                  className="object-cover"
                  data-ai-hint={banner.dataAiHint}
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative text-center text-white p-4">
                  <h1 className="text-3xl md:text-5xl font-bold mb-4">{banner.title}</h1>
                  <p className="text-lg md:text-xl mb-6">{banner.description}</p>
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Shop Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4" />
      <CarouselNext className="absolute right-4" />
    </Carousel>
  );
}