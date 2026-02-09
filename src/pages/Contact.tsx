import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MessageCircle, Mail, Send, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed');

      setSubmitted(true);
      toast.success('Message sent! We\'ll get back to you soon.', { position: 'top-center' });
    } catch {
      toast.error('Could not send message. Please try again.', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  const whatsappNumber = '+5016000000';
  const supportEmail = 'support@streamhub.bz';
  const waText = 'Hi, I would like to know more about your Netflix / Spotify subscription plans.';

  return (
    <main className="py-12">
      <div className="container max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-extrabold mb-3">Contact Us</h1>
          <p className="text-muted-foreground">Have a question? Reach out via form, WhatsApp, or email.</p>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Contact form */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="font-display">Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-10">
                  <CheckCircle className="h-12 w-12 text-spotify mx-auto mb-4" />
                  <h3 className="font-display font-bold text-xl mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-4">We'll get back to you as soon as possible.</p>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>Send Another</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" required placeholder="Your name" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required placeholder="you@example.com" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" required placeholder="What's this about?" />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" name="message" required rows={4} placeholder="Tell us more..." />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send Message</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Contact channels */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-display font-bold mb-4">Other ways to reach us</h3>
                <div className="space-y-3">
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-spotify/10 text-spotify hover:bg-spotify/20 transition-colors font-semibold text-sm"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${supportEmail}?subject=Subscription%20Inquiry`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors font-semibold text-sm"
                  >
                    <Mail className="h-5 w-5" />
                    {supportEmail}
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-display font-bold mb-2">Payment Options</h3>
                <p className="text-sm text-muted-foreground">We accept:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Shopify Checkout</li>
                  <li>• e-Kyash</li>
                  <li>• DigiWallet</li>
                  <li>• Bank Transfer</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
