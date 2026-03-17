import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, KeyRound } from 'lucide-react';
import { settingsApi, authApi } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    settingsApi.list().then(data => {
      const map: Record<string, string> = {};
      data.forEach(row => { map[row.key] = row.value || ''; });
      setSettings(map);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.save(settings);
      toast.success('Settings saved!', { position: 'top-center' });
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-foreground text-background">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Save</>}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><KeyRound className="w-5 h-5" />Change Password</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="font-display text-lg">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>WhatsApp Number</Label><Input value={settings.whatsapp_number || ''} onChange={e => update('whatsapp_number', e.target.value)} placeholder="+501 613-9834" /></div>
            <div><Label>Support Email</Label><Input value={settings.support_email || ''} onChange={e => update('support_email', e.target.value)} placeholder="support@streamconnect.online" /></div>
            <div><Label>WhatsApp Default Message</Label><Input value={settings.whatsapp_default_message || ''} onChange={e => update('whatsapp_default_message', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Payment Instructions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>e-Kyash Instructions</Label><Textarea value={settings.ekyash_instructions || ''} onChange={e => update('ekyash_instructions', e.target.value)} rows={2} /></div>
            <div><Label>DigiWallet Instructions</Label><Textarea value={settings.digiwallet_instructions || ''} onChange={e => update('digiwallet_instructions', e.target.value)} rows={2} /></div>
            <div><Label>Bank Transfer Instructions</Label><Textarea value={settings.bank_transfer_instructions || ''} onChange={e => update('bank_transfer_instructions', e.target.value)} rows={2} /></div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
