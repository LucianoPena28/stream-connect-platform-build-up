import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Loader2, ShoppingCart, Tv, Music, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cartStore';
import { storefrontApiRequest, STOREFRONT_QUERY, type ShopifyProduct } from '@/lib/shopify';

export default function Services() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);
  const isCartLoading = useCartStore(state => state.isLoading);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await storefrontApiRequest(STOREFRONT_QUERY, { first: 20 });
        setProducts(data?.data?.products?.edges || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const getProductCategory = (product: ShopifyProduct) => {
    const tags = product.node.tags || [];
    const title = product.node.title.toLowerCase();
    if (tags.includes('netflix') || title.includes('netflix')) return 'netflix';
    if (tags.includes('spotify') || title.includes('spotify')) return 'spotify';
    return 'custom';
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'netflix': return { bg: 'bg-netflix', text: 'text-netflix-foreground', icon: Tv, label: 'Streaming' };
      case 'spotify': return { bg: 'bg-spotify', text: 'text-spotify-foreground', icon: Music, label: 'Music' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', icon: Smartphone, label: 'Custom' };
    }
  };

  const handleAddToCart = async (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;

    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });

    toast.success(`${product.node.title} added to cart!`, { position: 'top-center' });
  };

  if (loading) {
    return (
      <main className="py-20">
        <div className="container flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  return (
    <main className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-extrabold mb-3">Choose Your Service</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Select a plan and add it to your cart. All prices in BZD (Belize Dollars).</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">No products found</h2>
            <p className="text-muted-foreground">Products are being set up. Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const category = getProductCategory(product);
              const styles = getCategoryStyles(category);
              const variant = product.node.variants.edges[0]?.node;
              const price = variant?.price;
              const IconComponent = styles.icon;

              return (
                <Card key={product.node.id} className="group hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
                  <CardHeader className={`${styles.bg} ${styles.text} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5" />
                        {/* Placeholder for official brand logo — replace with licensed asset */}
                        <span className="font-display font-bold">{category === 'netflix' ? 'Netflix' : category === 'spotify' ? 'Spotify' : 'Custom'}</span>
                      </div>
                      <span className="text-xs uppercase tracking-wider opacity-80">{styles.label}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <Link to={`/product/${product.node.handle}`} className="block group-hover:text-primary-foreground">
                      <h3 className="font-display font-bold text-lg mb-2">{product.node.title}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.node.description}</p>
                    {price && (
                      <p className="font-display text-3xl font-extrabold">
                        ${parseFloat(price.amount).toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">BZD / month</span>
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="p-5 pt-0">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={isCartLoading || !variant?.availableForSale}
                      className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold"
                    >
                      {isCartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingCart className="w-4 h-4 mr-2" />Add to Cart</>}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}

            {/* Custom app card */}
            <Card className="hover:shadow-xl transition-all hover:-translate-y-1 border-dashed border-2">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[280px]">
                <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-display font-bold text-lg mb-2">Other Apps</h3>
                <p className="text-sm text-muted-foreground mb-6">Need another app? Send us the name and we'll give you a custom quote.</p>
                <Button asChild variant="outline" className="rounded-full font-semibold">
                  <Link to="/contact">Request Quote</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
