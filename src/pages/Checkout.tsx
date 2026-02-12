import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Smartphone, Building2, Banknote, ExternalLink, Loader2 } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

const paymentMethods = [
  {
    id: 'credit_card',
    label: 'Credit Card',
    desc: 'Processed securely via Shopify',
    icon: CreditCard,
    shopify: true,
  },
  {
    id: 'debit_card',
    label: 'Debit Card',
    desc: 'Coming soon — contact us to arrange',
    icon: CreditCard,
    comingSoon: true,
  },
  {
    id: 'ekyash',
    label: 'e-Kyash',
    desc: 'Pay with your e-Kyash mobile wallet',
    icon: Smartphone,
    comingSoon: true,
  },
  {
    id: 'digiwallet',
    label: 'DigiWallet',
    desc: 'Pay with DigiWallet',
    icon: Smartphone,
    comingSoon: true,
  },
  {
    id: 'online_transfer',
    label: 'Online Transfer',
    desc: 'Transfer from your bank account',
    icon: Building2,
    comingSoon: true,
  },
  {
    id: 'onelink',
    label: 'OneLink',
    desc: 'Pay cashless via Heritage Bank OneLink',
    icon: Banknote,
    comingSoon: true,
  },
];

export default function Checkout() {
  const { items, getCheckoutUrl, isLoading } = useCartStore();
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);

  if (items.length === 0) {
    return (
      <main className="py-20 container text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Your cart is empty</h1>
        <Button asChild variant="outline"><Link to="/services">Browse Plans</Link></Button>
      </main>
    );
  }

  const handleProceed = () => {
    if (!selected) return;
    const method = paymentMethods.find(m => m.id === selected);
    if (method?.shopify) {
      const checkoutUrl = getCheckoutUrl();
      if (checkoutUrl) window.open(checkoutUrl, '_blank');
    }
    // Other methods will be built later with custom pages
  };

  return (
    <main className="py-12">
      <div className="container max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>

        <h1 className="font-display text-3xl font-extrabold mb-2">Choose Payment Method</h1>
        <p className="text-muted-foreground mb-8">
          Order total: <span className="font-bold text-foreground">${totalPrice.toFixed(2)} BZD</span> — {items.length} item{items.length !== 1 ? 's' : ''}
        </p>

        <div className="grid gap-3 mb-8">
          {paymentMethods.map(method => {
            const Icon = method.icon;
            const isSelected = selected === method.id;
            return (
              <Card
                key={method.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary border-primary' : ''
                } ${method.comingSoon ? 'opacity-60' : ''}`}
                onClick={() => !method.comingSoon && setSelected(method.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{method.label}</h3>
                    <p className="text-xs text-muted-foreground">{method.desc}</p>
                  </div>
                  {method.comingSoon && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">Coming Soon</span>
                  )}
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button
          onClick={handleProceed}
          disabled={!selected || isLoading}
          size="lg"
          className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4 mr-2" />Proceed to Payment</>}
        </Button>
      </div>
    </main>
  );
}
