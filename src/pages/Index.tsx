import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Headphones, CreditCard, Zap, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import heroBg from '@/assets/hero-bg.mp4';
import { publicServicesApi, type Service } from '@/lib/api';
import { getServiceIcon, NetflixIcon, PrimeVideoIcon, SpotifyIcon } from '@/components/icons/StreamingIcons';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Index() {
  const [featured, setFeatured] = useState<Service[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [scrollIdx, setScrollIdx] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const all = await publicServicesApi.list();
        const streaming = all.filter(
          s =>
            s.is_active &&
            s.category === 'streaming' &&
            (s.name.toLowerCase().includes('netflix') || s.name.toLowerCase().includes('prime'))
        );
        setFeatured(streaming.length ? streaming : all.filter(s => s.is_active && s.category === 'streaming').slice(0, 6));
      } catch {
        /* silent — hero still works */
      } finally {
        setLoadingFeatured(false);
      }
    }
    load();
  }, []);

  const maxScroll = Math.max(0, featured.length - 3);
  const prev = () => setScrollIdx(i => Math.max(0, i - 1));
  const next = () => setScrollIdx(i => Math.min(maxScroll, i + 1));

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src={heroBg} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />

        <div className="container relative z-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div {...fadeUp}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 text-white">
                Streaming & Music<br />
                <span className="text-white/70">Accounts</span>
              </h1>
              <p className="text-lg text-white/70 mb-6 max-w-lg">
                Get premium Netflix, Prime Video, and Spotify plans at great monthly prices. Based in Belize, serving you with local payment options.
              </p>

              {/* Brand logo row */}
              <div className="flex items-center gap-4 mb-8">
                <div className="rounded-xl bg-white backdrop-blur p-3 border border-white/30 shadow-md">
                  <NetflixIcon size={40} />
                </div>
                <div className="rounded-xl bg-white backdrop-blur p-3 border border-white/30 shadow-md">
                  <PrimeVideoIcon size={40} />
                </div>
                <div className="rounded-xl bg-white backdrop-blur p-3 border border-white/30 shadow-md">
                  <SpotifyIcon size={40} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 font-semibold">
                  <Link to="/services">View Plans</Link>
                </Button>
                <Button asChild size="lg" className="rounded-full px-8 font-semibold bg-white text-black hover:bg-white/90 shadow-lg">
                  <Link to="/contact">Message Us</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.2, duration: 0.5 }} className="space-y-4">
              <Link to="/services">
                <Card className="bg-netflix text-netflix-foreground border-0 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="rounded-xl bg-white p-2.5 shadow-sm">
                      <NetflixIcon size={38} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">Netflix accounts available</h3>
                      <p className="text-sm opacity-90">Solo, Duo, Family &amp; Extra Member plans</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/services">
                <Card className="bg-sidebar text-sidebar-foreground border-0 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer mt-4">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="rounded-lg bg-white/20 p-1.5">
                      <PrimeVideoIcon size={32} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">Prime Video plans</h3>
                      <p className="text-sm opacity-90">Solo, Duo &amp; Family options at great prices</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/services">
                <Card className="bg-spotify text-spotify-foreground border-0 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer mt-4">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="rounded-lg bg-white/20 p-1.5">
                      <SpotifyIcon size={32} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">Spotify Premium</h3>
                      <p className="text-sm opacity-90">Individual &amp; Family plans available</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <p className="text-sm text-white/60 pl-2">
                Need another app? <Link to="/contact" className="font-semibold underline text-white/80">Hit us up for a quote</Link>.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Streaming Plans from DB */}
      {!loadingFeatured && featured.length > 0 && (
        <section className="py-16 bg-card">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-3xl font-bold">Popular Streaming Plans</h2>
              {featured.length > 3 && (
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prev} disabled={scrollIdx === 0} className="rounded-full">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={next} disabled={scrollIdx >= maxScroll} className="rounded-full">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Desktop: sliding window of 3 */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              {featured.slice(scrollIdx, scrollIdx + 3).map(service => {
                const IconComp = getServiceIcon(service.name, service.category);
                return (
                  <Card key={service.id} className="hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {IconComp && (
                          <div className="rounded-lg bg-muted p-1.5 border border-border shadow-sm">
                            <IconComp size={28} />
                          </div>
                        )}
                        <h3 className="font-display font-bold text-lg">{service.name}</h3>
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{service.description}</p>
                      )}
                      <p className="font-display text-2xl font-extrabold mb-4">
                        ${service.price_bzd.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">BZD / {service.billing_period || 'month'}</span>
                      </p>
                      <Button asChild className="w-full rounded-full font-semibold bg-foreground text-background hover:bg-foreground/90">
                        <Link to="/contact">Contact Us</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Mobile: horizontal scroll */}
            <div className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-2 px-2">
              {featured.map(service => {
                const IconComp = getServiceIcon(service.name, service.category);
                return (
                  <Card key={service.id} className="min-w-[280px] snap-center shrink-0">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        {IconComp && (
                          <div className="rounded-lg bg-muted p-1.5 border border-border shadow-sm">
                            <IconComp size={24} />
                          </div>
                        )}
                        <h3 className="font-display font-bold">{service.name}</h3>
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                      )}
                      <p className="font-display text-xl font-extrabold mb-3">
                        ${service.price_bzd.toFixed(2)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">BZD / {service.billing_period || 'month'}</span>
                      </p>
                      <Button asChild size="sm" className="w-full rounded-full font-semibold bg-foreground text-background hover:bg-foreground/90">
                        <Link to="/contact">Contact Us</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <Button asChild variant="outline" className="rounded-full px-8 font-semibold">
                <Link to="/services">View All Plans</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {loadingFeatured && (
        <section className="py-16 bg-card">
          <div className="container flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16">
        <div className="container">
          <h2 className="font-display text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Choose your plan', desc: 'Select Netflix, Prime Video, Spotify, or request a custom app.' },
              { step: '2', title: 'Contact us', desc: 'Reach out via WhatsApp, email, or our contact form.' },
              { step: '3', title: 'Pay & enjoy', desc: 'Pay via e-Kyash, DigiWallet, OneLink, or bank transfer and start streaming.' },
            ].map((item) => (
              <Card key={item.step} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-0">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16 bg-card">
        <div className="container">
          <h2 className="font-display text-3xl font-bold text-center mb-10">Why Choose Us</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Trusted & Reliable', desc: 'Serving Belize with consistent, quality service.' },
              { icon: CreditCard, title: 'Local Payments', desc: 'e-Kyash, DigiWallet, OneLink, bank transfer — your choice.' },
              { icon: Headphones, title: '24/7 Support', desc: 'WhatsApp, email, and AI chat always available.' },
              { icon: Zap, title: 'Instant Setup', desc: 'Account access delivered within hours.' },
            ].map((feature) => (
              <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-0 text-center">
                  <feature.icon className="h-10 w-10 mx-auto mb-3 text-primary-foreground bg-primary rounded-xl p-2" />
                  <h3 className="font-display font-bold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to Stream?</h2>
          <p className="text-primary-foreground/70 mb-8 max-w-md mx-auto">Browse our plans and get started today. Local payments accepted.</p>
          <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full px-10 font-semibold">
            <Link to="/services">Browse Plans</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
