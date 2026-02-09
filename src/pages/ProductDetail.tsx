import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ShoppingCart, ArrowLeft, Tv, Music } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cartStore';
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, type ShopifyProduct } from '@/lib/shopify';

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<ShopifyProduct['node'] | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);
  const isCartLoading = useCartStore(state => state.isLoading);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
        setProduct(data?.data?.product || null);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    }
    if (handle) fetchProduct();
  }, [handle]);

  if (loading) {
    return (
      <main className="py-20 container flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="py-20 container text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Product not found</h1>
        <Button asChild variant="outline"><Link to="/services">Back to Services</Link></Button>
      </main>
    );
  }

  const variant = product.variants.edges[0]?.node;
  const isNetflix = product.tags?.includes('netflix') || product.title.toLowerCase().includes('netflix');
  const isSpotify = product.tags?.includes('spotify') || product.title.toLowerCase().includes('spotify');

  const handleAddToCart = async () => {
    if (!variant) return;
    const shopifyProduct: ShopifyProduct = { node: product };
    await addItem({
      product: shopifyProduct,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success(`${product.title} added to cart!`, { position: 'top-center' });
  };

  return (
    <main className="py-12">
      <div className="container max-w-3xl">
        <Link to="/services" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>

        <Card className="overflow-hidden">
          <div className={`p-6 ${isNetflix ? 'bg-netflix text-netflix-foreground' : isSpotify ? 'bg-spotify text-spotify-foreground' : 'bg-muted'}`}>
            <div className="flex items-center gap-3">
              {isNetflix ? <Tv className="h-8 w-8" /> : isSpotify ? <Music className="h-8 w-8" /> : null}
              <span className="font-display font-bold text-xl">{isNetflix ? 'Netflix' : isSpotify ? 'Spotify' : 'Service'}</span>
            </div>
          </div>
          <CardContent className="p-8">
            <h1 className="font-display text-3xl font-extrabold mb-3">{product.title}</h1>
            <p className="text-muted-foreground mb-6">{product.description}</p>

            {variant && (
              <div className="mb-8">
                <p className="font-display text-4xl font-extrabold">
                  ${parseFloat(variant.price.amount).toFixed(0)}
                  <span className="text-lg font-normal text-muted-foreground ml-2">BZD / month</span>
                </p>
              </div>
            )}

            <Button
              onClick={handleAddToCart}
              disabled={isCartLoading || !variant?.availableForSale}
              size="lg"
              className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 rounded-full px-10 font-semibold"
            >
              {isCartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingCart className="w-4 h-4 mr-2" />Add to Cart</>}
            </Button>

            <div className="mt-8 pt-6 border-t">
              <h3 className="font-display font-bold mb-3">How it works</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Add to cart and complete checkout</li>
                <li>We verify your payment (usually within hours)</li>
                <li>Receive your account credentials via WhatsApp or email</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
