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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  product_ids?: string[];
}

const suggestedQuestions = [
  'Suggest trending shoes under ₹2000',
  'Show me some stylish backpacks',
  'What are the best sunglasses for a round face?',
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
        <SheetContent className="flex flex-col w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              WalMate AI Assistant
            </SheetTitle>
            <SheetDescription>
              Your smart shopping partner. Ask me anything!
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 -mx-6">
            <div className="px-6 py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Sparkles className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-xs rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content && <p className="text-sm">{message.content}</p>}
                    {message.role === 'assistant' && message.product_ids && message.product_ids.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  disabled={isLoading}
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
                    className="text-xs"
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
        <DialogContent className="sm:max-w-2xl">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/2">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="w-full md:w-1/2">
                <DialogHeader>
                  <DialogTitle>{selectedProduct.name}</DialogTitle>
                  <DialogDescription>
                    <p className="text-lg font-bold text-primary mt-2">
                      ₹{selectedProduct.price.toLocaleString('en-IN')}
                    </p>
                    <p className="mt-4">{selectedProduct.description}</p>
                    {selectedProduct.material && (
                      <p className="mt-2">
                        <strong>Material:</strong> {selectedProduct.material}
                      </p>
                    )}
                    {selectedProduct.features && selectedProduct.features.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold">Features:</h4>
                        <ul className="list-disc list-inside">
                          {selectedProduct.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6 flex gap-2">
                  <Button onClick={() => {
                    handleProductSelect(selectedProduct);
                    setSelectedProduct(null);
                  }}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                    Close
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