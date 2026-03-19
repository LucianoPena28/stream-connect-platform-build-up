import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Loader2, Smartphone, AlertCircle } from 'lucide-react';
import { publicServicesApi, type Service } from '@/lib/api';
import { getServiceIcon } from '@/components/icons/StreamingIcons';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await publicServicesApi.list();
        setServices(data.filter(s => s.is_active));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load services');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  // Group by category
  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    const cat = s.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    streaming: 'Streaming Plans',
    music: 'Music Plans',
    other: 'Other Services',
  };
  const categoryOrder = ['streaming', 'music', 'other'];

  if (loading) {
    return (
      <main className="py-20">
        <div className="container flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="py-20">
        <div className="container text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Could not load services</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-extrabold mb-3">Choose Your Service</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Select a plan that fits you. All prices in BZD (Belize Dollars).
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-20">
            <Smartphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">No services available</h2>
            <p className="text-muted-foreground">Check back soon!</p>
          </div>
        ) : (
          categoryOrder
            .filter(cat => grouped[cat]?.length)
            .map(cat => (
              <section key={cat} className="mb-12">
                <h2 className="font-display text-2xl font-bold mb-6">
                  {categoryLabels[cat] || cat}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grouped[cat]
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map(service => {
                      const IconComp = getServiceIcon(service.name, service.category);
                      return (
                        <Card
                          key={service.id}
                          className="group hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden"
                        >
                          <CardHeader className="p-4 bg-muted">
                            <div className="flex items-center gap-3">
                              {IconComp ? (
                                <div className="rounded-lg bg-background p-1.5 shadow-sm border border-border">
                                  <IconComp size={28} />
                                </div>
                              ) : (
                                <Smartphone className="h-6 w-6 text-muted-foreground" />
                              )}
                              <span className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
                                {service.category || 'Service'}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-5">
                            <h3 className="font-display font-bold text-lg mb-2">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                {service.description}
                              </p>
                            )}
                            <p className="font-display text-3xl font-extrabold">
                              ${service.price_bzd.toFixed(2)}
                              <span className="text-sm font-normal text-muted-foreground ml-1">
                                BZD / {service.billing_period || 'month'}
                              </span>
                            </p>
                          </CardContent>
                          <CardFooter className="p-5 pt-0">
                            <Button
                              asChild
                              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold"
                            >
                              <Link to="/contact">Get This Plan</Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                </div>
              </section>
            ))
        )}

        {/* Custom request card */}
        <section className="mt-4">
          <Card className="border-dashed border-2">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-display font-bold text-lg mb-2">Need Another App?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Send us the name and we'll give you a custom quote.
              </p>
              <Button asChild variant="outline" className="rounded-full font-semibold">
                <Link to="/contact">Request Quote</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
