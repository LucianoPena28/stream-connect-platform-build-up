import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Mail, Send, Loader2, CheckCircle } from 'lucide-react';
import { ticketsApi } from '@/lib/api';
import { toast } from 'sonner';
import { WhatsAppIcon } from '@/components/icons/StreamingIcons';

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string).trim();
    const email = (formData.get('email') as string).trim();
    const subject = (formData.get('subject') as string).trim();
    const message = (formData.get('message') as string).trim();

    if (!name || !email || !subject || !message) {
      toast.error('All fields are required.', { position: 'top-center' });
      setLoading(false);
      return;
    }

    try {
      await ticketsApi.submitContact({ name, email, subject, message });
      setSubmitted(true);
      toast.success('Thank you! Your message has been received.', { position: 'top-center' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send message. Please try again.';
      toast.error(msg, { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  const whatsappNumber = '+5016139834';
  const supportEmail = 'support@streamconnect.online';
  const waText = 'Hi, I would like to know more about your Netflix / Spotify subscription plans.';

  return (
    <main className="py-12">
      <div className="container max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-extrabold mb-3">Contact Us</h1>
          <p className="text-muted-foreground">Have a question? Reach out via form, WhatsApp, or email.</p>
        </div>
        <div className="grid md:grid-cols-5 gap-6">
          <Card className="md:col-span-3">
            <CardHeader><CardTitle className="font-display">Send us a message</CardTitle></CardHeader>
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
                    <div><Label htmlFor="name">Name</Label><Input id="name" name="name" required placeholder="Your name" maxLength={100} /></div>
                    <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required placeholder="you@example.com" maxLength={255} /></div>
                  </div>
                  <div><Label htmlFor="subject">Subject</Label><Input id="subject" name="subject" required placeholder="What's this about?" maxLength={200} /></div>
                  <div><Label htmlFor="message">Message</Label><Textarea id="message" name="message" required rows={4} placeholder="Tell us more..." maxLength={2000} /></div>
                  <Button type="submit" disabled={loading} className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send Message</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
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
                    <WhatsAppIcon size={20} />WhatsApp: +501 613-9834
                  </a>
                  <a
                    href={`mailto:${supportEmail}?subject=Subscription%20Inquiry`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors font-semibold text-sm"
                  >
                    <Mail className="h-5 w-5" />{supportEmail}
                  </a>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-display font-bold mb-2">Payment Options</h3>
                <p className="text-sm text-muted-foreground">We accept:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Credit Card</li><li>• Debit Card</li><li>• e-Kyash</li>
                  <li>• DigiWallet</li><li>• Online Transfer</li><li>• OneLink</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
