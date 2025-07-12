'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, CreditCard, Landmark, Smartphone, Wallet } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';

export default function PaymentPage() {
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [upiId, setUpiId] = useState('');
  const [savePayment, setSavePayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 999 ? 0 : 99;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      toast({
        title: 'Payment Successful!',
        description: 'Your order has been placed successfully.',
      });
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    return parts.length ? parts.join(' ') : value;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardDetails({
      ...cardDetails,
      number: formatCardNumber(e.target.value)
    });
  };

  const popularUpiApps = [
    { id: 'gpay', name: 'Google Pay', icon: '/upi-gpay.svg' },
    { id: 'phonepe', name: 'PhonePe', icon: '/upi-phonepe.svg' },
    { id: 'paytm', name: 'Paytm', icon: '/upi-paytm.svg' },
    { id: 'amazonpay', name: 'Amazon Pay', icon: '/upi-amazonpay.svg' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Payment Methods Section */}
        <div className="md:w-2/3 space-y-6">
          <h1 className="text-2xl font-bold">Payment Options</h1>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                UPI Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="cursor-pointer">
                    Pay with any UPI App
                  </Label>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="space-y-4 pl-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {popularUpiApps.map(app => (
                        <button
                          key={app.id}
                          type="button"
                          className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-muted transition-colors"
                          onClick={() => setUpiId(`${app.id}@walpay`)}
                        >
                          <img 
                            src={app.icon} 
                            alt={app.name} 
                            className="h-10 w-10 object-contain mb-2"
                          />
                          <span className="text-sm">{app.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upi-id">Enter UPI ID</Label>
                      <Input
                        id="upi-id"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Example: 9876543210@ybl, yourname@oksbi
                      </p>
                    </div>
                  </div>
                )}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Credit/Debit Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="cursor-pointer">
                    Pay with Card
                  </Label>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input
                        id="card-number"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.number}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="card-name">Name on Card</Label>
                      <Input
                        id="card-name"
                        placeholder="John Doe"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="card-expiry">Expiry Date</Label>
                        <Input
                          id="card-expiry"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="card-cvv">CVV</Label>
                        <Input
                          id="card-cvv"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                          maxLength={3}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox 
                        id="save-card" 
                        checked={savePayment}
                        onCheckedChange={(checked) => setSavePayment(!!checked)}
                      />
                      <Label htmlFor="save-card" className="cursor-pointer">
                        Save card for future payments
                      </Label>
                    </div>
                  </div>
                )}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                Net Banking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="netbanking" id="netbanking" />
                  <Label htmlFor="netbanking" className="cursor-pointer">
                    Internet Banking
                  </Label>
                </div>

                {paymentMethod === 'netbanking' && (
                  <div className="pl-6">
                    <div className="space-y-2">
                      <Label>Select Bank</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">Select your bank</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="axis">Axis Bank</option>
                        <option value="kotak">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  </div>
                )}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Wallet & Others
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Label htmlFor="wallet" className="cursor-pointer">
                    Pay with Wallet
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="cursor-pointer">
                    Cash on Delivery (COD)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Section */}
        <div className="md:w-1/3">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline">x{item.quantity}</Badge>
                    </div>
                    <div className="flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      <span>{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    <span>{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <div className="flex items-center">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      <>
                        <IndianRupee className="h-4 w-4" />
                        <span>{shipping.toLocaleString('en-IN')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18%)</span>
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    <span>{tax.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between font-bold text-lg">
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
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay ₹${total.toLocaleString('en-IN')}`
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground mt-2">
                By completing your purchase, you agree to our{' '}
                <a href="#" className="text-primary underline">Terms of Service</a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}