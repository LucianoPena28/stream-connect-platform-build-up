import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message, { position: 'top-center' });
      else navigate('/admin');
    } else {
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters', { position: 'top-center' });
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) toast.error(error.message, { position: 'top-center' });
      else {
        toast.success('Account created! Ask an admin to assign your role.', { position: 'top-center' });
        navigate('/admin');
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-foreground flex items-center justify-center">
            <Shield className="h-6 w-6 text-background" />
          </div>
          <CardTitle className="font-display text-2xl">
            {mode === 'login' ? 'Admin Login' : 'Admin Sign Up'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Sign in to the StreamHub dashboard' : 'Create an admin account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Your name" />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@streamhub.bz" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-foreground text-background hover:bg-foreground/90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {mode === 'login' ? (
              <>Need an account? <button onClick={() => setMode('signup')} className="font-semibold underline">Sign up</button></>
            ) : (
              <>Already have one? <button onClick={() => setMode('login')} className="font-semibold underline">Sign in</button></>
            )}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
