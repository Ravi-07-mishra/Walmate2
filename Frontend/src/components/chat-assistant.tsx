'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Send,
  Mic,
  Loader2,
  Sparkles,
  ShoppingCart,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/cart-context';
import { chatWithBackend, getProductDetails } from '@/lib/api';
import ProductCard from './product-card';
import { Product } from '@/components/product';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  product_ids?: string[];
}

const suggestedQuestions = [
  'Suggest summer shirts under ₹3000',
  'Show me some stylish black dresses',
  'Show hoodies under 5000',
];

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sheetWidth, setSheetWidth] = useState('30rem'); // Default width
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadProduct = async (productId: string) => {
    if (!products[productId]) {
      try {
        const product = await getProductDetails(productId);
        setProducts(prev => ({
          ...prev,
          [productId]: {
            ...product,
            image_url: product.imageUrl || '/placeholder-product.jpg'
          }
        }));
      } catch (error) {
        console.error('Error loading product:', error);
        toast({
          variant: 'destructive',
          title: 'Product Error',
          description: `Failed to load product details for ${productId}`
        });
        
        setProducts(prev => ({
          ...prev,
          [productId]: {
            id: productId,
            name: 'Product Unavailable',
            description: 'Could not load product details',
            price: 0,
            image_url: '/placeholder-product.jpg'
          }
        }));
      }
    }
  };

  const handleSendMessage = async (messageContent?: string) => {
    const text = messageContent || input;
    if (!text.trim()) return;

    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text 
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatWithBackend(text, currentChatId || undefined);
      
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer,
        product_ids: result.product_ids,
      };
      
      setMessages((prev) => [...prev, response]);
      
      if (!currentChatId) {
        setCurrentChatId(result.chat_id);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with the AI assistant.',
      });
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messages.forEach(message => {
      if (message.product_ids) {
        message.product_ids.forEach(productId => {
          if (!products[productId]) {
            loadProduct(productId);
          }
        });
      }
    });
  }, [messages]);

  const handleProductSelect = (product: Product) => {
    addToCart({
      ...product,
      quantity: 1,
    });
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart`,
    });
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your WalMate shopping assistant. How can I help you today?"
      }]);
    }
  }, [isOpen]);

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-14 rounded-full shadow-lg hover:bg-primary/90 animate-in fade-in zoom-in-95 text-lg font-semibold px-6 bg-primary text-primary-foreground"
        size="lg"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="h-6 w-6 mr-3" />
        Shop with WalMate AI
      </Button>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          className="flex flex-col w-full max-w-[95vw]"
          style={{ width: sheetWidth, maxWidth: '90vw' }}
        >
          <SheetHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary" />
                <SheetTitle>WalMate AI Assistant</SheetTitle>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSheetWidth(prev => 
                    prev === '30rem' ? '40rem' : 
                    prev === '40rem' ? '50rem' : '30rem'
                  )}
                >
                  <div className="flex flex-col items-center justify-center text-xs">
                    <span>{parseInt(sheetWidth) / 10}rem</span>
                    <span>↔️</span>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <SheetDescription>
              Your smart shopping partner. Ask me anything!
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1 -mx-6">
            <div className="px-6 py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === 'user' ? 'justify-end' : ''
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Sparkles className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.content && <p className="text-sm">{message.content}</p>}
                    {message.role === 'assistant' && message.product_ids && message.product_ids.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {message.product_ids.map((productId) => {
                          const product = products[productId];
                          return product ? (
                            <ProductCard 
                              key={productId} 
                              product={product} 
                              onSelect={() => handleProductSelect(product)}
                              onViewDetails={() => handleViewDetails(product)}
                            />
                          ) : (
                            <div key={productId} className="border rounded-lg p-4">
                              <div className="bg-gray-200 animate-pulse rounded w-full h-48 mb-2" />
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                              <Button disabled className="w-full">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-foreground text-background">
                        <span className="text-xs">U</span>
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Sparkles className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <SheetFooter className="pt-4">
            <div className="flex flex-col w-full gap-3">
              <div className="flex w-full items-center gap-2">
                <Input
                  type="text"
                  placeholder="Ask about products..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  variant="secondary" 
                  size="icon" 
                  disabled={isLoading}
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <Button 
                  variant="default" 
                  size="icon" 
                  disabled={isLoading || !input.trim()}
                  onClick={() => handleSendMessage()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                    className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]"
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-3xl">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-2/5">
                <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-full h-auto max-h-[400px] object-contain rounded-lg"
                  />
                </div>
              </div>
              <div className="w-full md:w-3/5">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                  <div className="mt-4 space-y-4">
                    <p className="text-2xl font-bold text-primary">
                      ₹{selectedProduct.price.toLocaleString('en-IN')}
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-foreground">{selectedProduct.description}</p>
                    </div>
                    {selectedProduct.material && (
                      <p className="mt-2">
                        <strong className="text-foreground">Material:</strong> {selectedProduct.material}
                      </p>
                    )}
                    {selectedProduct.features && selectedProduct.features.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-lg">Features:</h4>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {selectedProduct.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </DialogHeader>
                <div className="mt-6 flex gap-3">
                  <Button 
                    className="flex-1 py-6 text-lg"
                    onClick={() => {
                      handleProductSelect(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    <ShoppingCart className="mr-3 h-5 w-5" /> Add to Cart
                  </Button>
                  <Button 
                    variant="outline" 
                    className="py-6 text-lg"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
