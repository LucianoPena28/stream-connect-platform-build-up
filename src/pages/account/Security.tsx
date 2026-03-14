import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, ShieldCheck, ShieldOff, Copy, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authApi, totpApi } from '@/lib/api';
import { toast } from 'sonner';

export default function AccountSecurity() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ enabled: boolean; backupCodesRemaining: number }>({ enabled: false, backupCodesRemaining: 0 });
  const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'verify' | 'done'>('idle');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/account/login'); return; }
    if (user) totpApi.status().then(setStatus).finally(() => setLoading(false));
  }, [user, authLoading]);

  const startSetup = async () => {
    setActionLoading(true);
    const data = await totpApi.setup();
    setTotpUri(data.uri); setTotpSecret(data.secret); setSetupStep('qr');
    setActionLoading(false);
  };

  const verifyAndEnable = async () => {
    if (verifyCode.length !== 6) { toast.error('Enter a 6-digit code'); return; }
    setActionLoading(true);
    try {
      const data = await totpApi.verify(verifyCode);
      setBackupCodes(data.backupCodes); setSetupStep('done');
      setStatus({ enabled: true, backupCodesRemaining: 10 });
      toast.success('2FA enabled!', { position: 'top-center' });
    } catch (err: any) { toast.error(err.message); }
    setActionLoading(false);
  };

  const disable2FA = async () => {
    setActionLoading(true);
    await totpApi.disable();
    setStatus({ enabled: false, backupCodesRemaining: 0 }); setSetupStep('idle');
    toast.success('2FA disabled', { position: 'top-center' });
    setActionLoading(false);
  };

  const regenerateCodes = async () => {
    setActionLoading(true);
    const data = await totpApi.regenerateCodes();
    if (data.backupCodes) {
      setBackupCodes(data.backupCodes);
      setStatus(s => ({ ...s, backupCodesRemaining: 10 }));
      toast.success('New backup codes generated!', { position: 'top-center' });
    }
    setActionLoading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setChangingPassword(true);
    try {
      await authApi.updatePassword(newPassword);
      toast.success('Password changed successfully!', { position: 'top-center' });
      setNewPassword(''); setConfirmPassword('');
    } catch (err: any) { toast.error(err.message); }
    setChangingPassword(false);
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  if (authLoading || loading) {
    return <main className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></main>;
  }

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="container max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/account')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-1" />Back to Account</Button>
        <h1 className="font-display text-3xl font-extrabold mb-2">Security Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your password, two-factor authentication, and backup codes.</p>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2"><KeyRound className="w-5 h-5" />Change Password</CardTitle>
              <CardDescription>Update your account password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" /></div>
                <div><Label>Confirm Password</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" /></div>
              </div>
              <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline">
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                {status.enabled ? <ShieldCheck className="w-5 h-5 text-spotify" /> : <Shield className="w-5 h-5" />}
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                {status.enabled ? 'Your account is protected with 2FA via an authenticator app.' : 'Add an extra layer of security using Google Authenticator or similar.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status.enabled && setupStep === 'idle' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-spotify/10">
                    <div><p className="font-medium text-sm">Status: Enabled</p><p className="text-xs text-muted-foreground">{status.backupCodesRemaining} backup codes remaining</p></div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={regenerateCodes} disabled={actionLoading}><RefreshCw className="w-3 h-3 mr-1" />New Codes</Button>
                      <Button variant="destructive" size="sm" onClick={disable2FA} disabled={actionLoading}><ShieldOff className="w-3 h-3 mr-1" />Disable</Button>
                    </div>
                  </div>
                </div>
              ) : setupStep === 'idle' ? (
                <Button onClick={startSetup} disabled={actionLoading} className="bg-primary text-primary-foreground">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}Enable 2FA
                </Button>
              ) : setupStep === 'qr' ? (
                <div className="space-y-4">
                  <p className="text-sm">Open your authenticator app and add this account manually:</p>
                  <div className="p-3 rounded-lg bg-muted">
                    <Label className="text-xs text-muted-foreground">Secret Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm font-mono break-all flex-1">{totpSecret}</code>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(totpSecret)}><Copy className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Or scan this URI: <code className="break-all">{totpUri}</code></p>
                  <Button onClick={() => setSetupStep('verify')} className="bg-primary text-primary-foreground">I've added it → Verify</Button>
                </div>
              ) : setupStep === 'verify' ? (
                <div className="space-y-4">
                  <p className="text-sm">Enter the 6-digit code from your authenticator app:</p>
                  <div className="flex gap-2 max-w-xs">
                    <Input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-lg font-mono tracking-widest" maxLength={6} />
                    <Button onClick={verifyAndEnable} disabled={actionLoading || verifyCode.length !== 6} className="bg-primary text-primary-foreground">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                </div>
              ) : setupStep === 'done' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-spotify/10 border border-spotify/20">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-spotify" />2FA Enabled Successfully!</h4>
                    <p className="text-xs text-muted-foreground mb-3">Save these backup codes in a safe place. Each can only be used once.</p>
                    <div className="grid grid-cols-2 gap-1">
                      {backupCodes.map((code, i) => (<code key={i} className="text-xs font-mono bg-background px-2 py-1 rounded">{code}</code>))}
                    </div>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => copyToClipboard(backupCodes.join('\n'))}><Copy className="w-3 h-3 mr-1" />Copy All Codes</Button>
                  </div>
                  <Button variant="outline" onClick={() => setSetupStep('idle')}>Done</Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
