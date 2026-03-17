import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-display text-xl">Forgot Password</CardTitle>
          <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-sm text-muted-foreground">If an account exists with <strong>{email}</strong>, a reset link has been sent. Check your inbox.</p>
              <Button asChild variant="outline"><Link to="/account/login">Back to Login</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Send Reset Link
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remember your password? <Link to="/account/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
