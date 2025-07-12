'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from './theme-toggle';
import { useCart } from '@/context/cart-context';
import { Badge } from './ui/badge';

export default function AppHeader() {
  const isMobile = useIsMobile();
  const { cartCount } = useCart();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-4">
        {isMobile && <SidebarTrigger />}
        <Link href="/" className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">WalMate</span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cart" className="relative">
            <ShoppingCart />
            {cartCount > 0 && (
               <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{cartCount}</Badge>
            )}
            <span className="sr-only">My Cart</span>
          </Link>
        </Button>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
