import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Eye, EyeOff, Copy, KeyRound, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { credentialsApi, totpApi, type ServiceCredential } from '@/lib/api';
import { toast } from 'sonner';

export default function AccountCredentials() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<ServiceCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [has2FA, setHas2FA] = useState(false);

  // Step-up verification state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyCredId, setVerifyCredId] = useState<string | null>(null);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/account/login'); return; }
    if (user) {
      Promise.all([
        credentialsApi.mine(),
        totpApi.status(),
      ]).then(([creds, totpStatus]) => {
        setCredentials(creds);
        setHas2FA(totpStatus.enabled);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  const openVerifyDialog = (credId: string) => {
    setVerifyCredId(credId);
    setVerifyPassword('');
    setVerifyOtp('');
    setRequiresOtp(has2FA);
    setVerifyDialogOpen(true);
  };

  const handleVerifyAndReveal = async () => {
    if (!verifyCredId || !verifyPassword) { toast.error('Please enter your password'); return; }
    setVerifyLoading(true);
    try {
      const result = await credentialsApi.reveal(
        verifyCredId,
        verifyPassword,
        requiresOtp ? verifyOtp : undefined
      );
      setRevealedPasswords(prev => ({ ...prev, [verifyCredId]: result.password || '' }));
      setVerifyDialogOpen(false);
      toast.success('Credential revealed', { position: 'top-center' });

      // Auto-hide after 60 seconds
      setTimeout(() => {
        setRevealedPasswords(prev => {
          const next = { ...prev };
          delete next[verifyCredId];
          return next;
        });
      }, 60000);
    } catch (err: any) {
      if (err.message?.includes('OTP') || err.message?.includes('2FA')) {
        setRequiresOtp(true);
        toast.error('Please enter your authenticator code');
      } else {
        toast.error(err.message || 'Verification failed');
      }
    }
    setVerifyLoading(false);
  };

  const hidePassword = (credId: string) => {
    setRevealedPasswords(prev => {
      const next = { ...prev };
      delete next[credId];
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
            {credentials.map(cred => {
              const isRevealed = verifyCredId === cred.id && cred.id in revealedPasswords;
              return (
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">
                        <span className="text-muted-foreground font-sans">Password:</span>{' '}
                        {cred.id in revealedPasswords ? revealedPasswords[cred.id] : '••••••••'}
                      </span>
                      <div className="flex gap-1">
                        {cred.id in revealedPasswords ? (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => hidePassword(cred.id)}>
                              <EyeOff className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(revealedPasswords[cred.id], 'Password')}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => openVerifyDialog(cred.id)} className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />Reveal
                          </Button>
                        )}
                      </div>
                    </div>
                    {cred.notes && <p className="text-xs text-muted-foreground mt-2">{cred.notes}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Step-up verification dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />Verify Your Identity
            </DialogTitle>
            <DialogDescription>
              Enter your Stream Connect account password to reveal this credential.
              {has2FA && ' Since you have 2FA enabled, you\'ll also need your authenticator code.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Account Password</Label>
              <Input
                type="password"
                value={verifyPassword}
                onChange={e => setVerifyPassword(e.target.value)}
                placeholder="Enter your password"
                onKeyDown={e => e.key === 'Enter' && !requiresOtp && handleVerifyAndReveal()}
              />
            </div>
            {requiresOtp && (
              <div>
                <Label>Authenticator Code</Label>
                <Input
                  value={verifyOtp}
                  onChange={e => setVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  className="text-center font-mono tracking-widest"
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyAndReveal()}
                />
                <p className="text-xs text-muted-foreground mt-1">Or enter a backup code</p>
              </div>
            )}
            <Button onClick={handleVerifyAndReveal} disabled={verifyLoading} className="w-full">
              {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              Reveal Credential
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
