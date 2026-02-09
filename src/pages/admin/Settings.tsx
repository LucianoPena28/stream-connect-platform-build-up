import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('app_settings').select('key, value');
      const map: Record<string, string> = {};
      (data || []).forEach(row => { map[row.key] = row.value || ''; });
      setSettings(map);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase.from('app_settings').update({ value }).eq('key', key);
      }
      toast.success('Settings saved!', { position: 'top-center' });
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
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
          <CardHeader><CardTitle className="font-display text-lg">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>WhatsApp Number</Label>
              <Input value={settings.whatsapp_number || ''} onChange={e => update('whatsapp_number', e.target.value)} placeholder="+5016000000" />
            </div>
            <div>
              <Label>Support Email</Label>
              <Input value={settings.support_email || ''} onChange={e => update('support_email', e.target.value)} placeholder="support@streamhub.bz" />
            </div>
            <div>
              <Label>WhatsApp Default Message</Label>
              <Input value={settings.whatsapp_default_message || ''} onChange={e => update('whatsapp_default_message', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Payment Instructions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>e-Kyash Instructions</Label>
              <Textarea value={settings.ekyash_instructions || ''} onChange={e => update('ekyash_instructions', e.target.value)} rows={2} />
            </div>
            <div>
              <Label>DigiWallet Instructions</Label>
              <Textarea value={settings.digiwallet_instructions || ''} onChange={e => update('digiwallet_instructions', e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Bank Transfer Instructions</Label>
              <Textarea value={settings.bank_transfer_instructions || ''} onChange={e => update('bank_transfer_instructions', e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Integrations</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Shopify</p>
                  <p className="text-xs text-muted-foreground">Connected via Lovable integration</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-spotify/20 text-spotify font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">AI Chatbot</p>
                  <p className="text-xs text-muted-foreground">Powered by Lovable AI</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-spotify/20 text-spotify font-medium">Active</span>
              </div>
            </div>
            {/* PCI Note: No card data is stored. Shopify handles PCI-compliant payment processing. */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
