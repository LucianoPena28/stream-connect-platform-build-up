import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff, Copy, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { credentialsApi, type ServiceCredential } from '@/lib/api';
import { toast } from 'sonner';

export default function AccountCredentials() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<ServiceCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) { navigate('/account/login'); return; }
    if (user) {
      credentialsApi.mine().then(setCredentials).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.info(`${label} copied!`);
  };

  if (authLoading || loading) {
    return <main className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></main>;
  }

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="container max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
              <KeyRound className="w-7 h-7" /> My Credentials
            </h1>
            <p className="text-muted-foreground text-sm">Your service login credentials managed by Stream Connect</p>
          </div>
        </div>

        {credentials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <KeyRound className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No service credentials have been set up for your account yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Contact support if you believe this is an error.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {credentials.map(cred => (
              <Card key={cred.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{cred.service_name}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {cred.username && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm"><span className="text-muted-foreground">Username:</span> {cred.username}</span>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(cred.username!, 'Username')}><Copy className="w-3 h-3" /></Button>
                    </div>
                  )}
                  {cred.password && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">
                        <span className="text-muted-foreground font-sans">Password:</span>{' '}
                        {visiblePasswords.has(cred.id) ? cred.password : '••••••••'}
                      </span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => togglePassword(cred.id)}>
                          {visiblePasswords.has(cred.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(cred.password!, 'Password')}><Copy className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  )}
                  {cred.notes && <p className="text-xs text-muted-foreground mt-2">{cred.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
