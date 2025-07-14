'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { IndianRupee, CreditCard, Smartphone, Wallet, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentPage() {
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  const handlePayment = () => {
    if (paymentMethod === 'upi' && upiId.trim() === '') {
      toast({ title: 'Enter UPI ID', variant: 'destructive' });
      return;
    }
    if (paymentMethod === 'card' && cardDetails.number.trim() === '') {
      toast({ title: 'Enter card details', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      toast({
        title: 'Payment Successful!',
        description: 'Your order has been placed successfully.',
      });
      router.push('/');
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Payment Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="upi" id="upi" />
              <Label htmlFor="upi" className="cursor-pointer flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                UPI
              </Label>
            </div>

            {paymentMethod === 'upi' && (
              <Input
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            )}

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="cursor-pointer flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credit / Debit Card
              </Label>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-2">
                <Input
                  placeholder="Card Number"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                />
                <Input
                  placeholder="Name on Card"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                />
                <Input
                  placeholder="Expiry MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                />
                <Input
                  placeholder="CVV"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wallet" id="wallet" />
              <Label htmlFor="wallet" className="cursor-pointer flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="netbanking" id="netbanking" />
              <Label htmlFor="netbanking" className="cursor-pointer flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Net Banking
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cod" id="cod" />
              <Label htmlFor="cod" className="cursor-pointer">
                Cash on Delivery (COD)
              </Label>
            </div>

          </RadioGroup>

          <div className="flex justify-between font-bold text-lg pt-4">
            <span>Total</span>
            <div className="flex items-center">
              <IndianRupee className="h-5 w-5" />
              <span>{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <Button
            className="w-full mt-4"
            size="lg"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing Payment...' : `Pay ₹${total.toLocaleString('en-IN')}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
