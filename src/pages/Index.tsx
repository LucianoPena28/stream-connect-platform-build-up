import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Headphones, CreditCard, Zap, Tv, Music } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Index() {
  return (
    <main>
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div {...fadeUp}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
                Streaming & Music<br />
                <span className="text-foreground/80">Accounts</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Get premium Netflix and Spotify plans at great monthly prices. Based in Belize, serving you with local payment options.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 font-semibold">
                  <Link to="/services">View Plans</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-8 font-semibold border-foreground/30">
                  <Link to="/contact">Message Us</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.2, duration: 0.5 }} className="space-y-4">
              {/* Flyer cards */}
              <Card className="bg-netflix text-netflix-foreground border-0 shadow-xl overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4">
                  <Tv className="h-10 w-10 flex-shrink-0" />
                  <div>
                    <h3 className="font-display font-bold text-lg">Netflix accounts available</h3>
                    <p className="text-sm opacity-90">$10 BZD per profile or $30 BZD for all 4 monthly</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-spotify text-spotify-foreground border-0 shadow-xl overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4">
                  <Music className="h-10 w-10 flex-shrink-0" />
                  <div>
                    <h3 className="font-display font-bold text-lg">Spotify plans</h3>
                    <p className="text-sm opacity-90">Individual: $20 BZD or Family: $30 BZD monthly</p>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground pl-2">
                Need another app? <Link to="/contact" className="font-semibold underline">Hit us up for a quote</Link>.
                We also do online orders if you need something.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-card">
        <div className="container">
          <h2 className="font-display text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Choose your plan', desc: 'Select Netflix, Spotify, or request a custom app.' },
              { step: '2', title: 'Add to cart', desc: 'Review your selections and quantities.' },
              { step: '3', title: 'Checkout & pay', desc: 'Pay via Shopify, e-Kyash, DigiWallet, or bank transfer.' },
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
      <section className="py-16">
        <div className="container">
          <h2 className="font-display text-3xl font-bold text-center mb-10">Why Choose Us</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Trusted & Reliable', desc: 'Serving Belize with consistent, quality service.' },
              { icon: CreditCard, title: 'Local Payments', desc: 'e-Kyash, DigiWallet, bank transfer — your choice.' },
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
      <section className="py-16 bg-foreground text-background">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to Stream?</h2>
          <p className="text-background/70 mb-8 max-w-md mx-auto">Browse our plans and get started today. Local payments accepted.</p>
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 font-semibold">
            <Link to="/services">Browse Plans</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
