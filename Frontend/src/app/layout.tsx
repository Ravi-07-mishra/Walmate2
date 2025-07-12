import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar';
import AppHeader from '@/components/header';
import ChatAssistant from '@/components/chat-assistant';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { CartProvider } from '@/context/cart-context';

export const metadata: Metadata = {
  title: 'WalMate: Smart Shopping Assistant',
  description: 'A modern, animated e-commerce platform with an AI shopping assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <div className="flex flex-col h-full">
                  <AppHeader />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                  </main>
                </div>
              </SidebarInset>
            </SidebarProvider>
            <ChatAssistant />
            <Toaster />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
