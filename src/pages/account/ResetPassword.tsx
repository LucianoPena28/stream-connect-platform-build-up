import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, KeyRound } from 'lucide-react';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!token) { toast.error('Invalid or missing reset token'); return; }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      toast.success('Password has been reset successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password. The link may have expired.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-display text-xl">Reset Your Password</CardTitle>
          <CardDescription>Enter a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-sm text-muted-foreground">Your password has been reset. You can now sign in.</p>
              <Button asChild className="w-full"><Link to="/account/login">Go to Login</Link></Button>
            </div>
          ) : !token ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-destructive">Invalid or missing reset token. Please request a new password reset link.</p>
              <Button asChild variant="outline"><Link to="/account/login">Back to Login</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>New Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
