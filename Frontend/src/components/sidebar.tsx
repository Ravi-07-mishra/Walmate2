'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  History,
  Package,
  ShoppingCart,
  LayoutGrid,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { href: '/history', label: 'Shopping History', icon: History },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/cart', label: 'My Cart', icon: ShoppingCart },
  { href: '/categories', label: 'Categories', icon: LayoutGrid },
  { href: '/help', label: 'Help', icon: HelpCircle },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">WalMate</span>
        </div>
      </SidebarHeader>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarFooter>
        <div className="text-xs text-muted-foreground p-2">
          © {new Date().getFullYear()} WalMate
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
