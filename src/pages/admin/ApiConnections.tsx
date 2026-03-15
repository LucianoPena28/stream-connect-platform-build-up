import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Bot, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { settingsApi, chatApi } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminApiConnections() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    settingsApi.list().then(data => {
      const map: Record<string, string> = {};
      data.forEach(row => { map[row.key] = row.value || ''; });
      setSettings(map);
    }).finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const llmKeys = ['llm_endpoint', 'llm_api_key', 'llm_model', 'llm_system_prompt', 'llm_max_tokens', 'llm_temperature'];
      const payload: Record<string, string> = {};
      llmKeys.forEach(k => { if (settings[k] !== undefined) payload[k] = settings[k]; });
      await settingsApi.save(payload);
      toast.success('API settings saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await chatApi.send('Hello, are you working?');
      if (data.reply && !data.reply.includes('not configured')) {
        setTestResult('success');
        toast.success('LLM connection successful!');
      } else {
        setTestResult('error');
        toast.error('LLM returned a fallback response — check your endpoint.');
      }
    } catch {
      setTestResult('error');
      toast.error('Connection test failed');
    }
    finally { setTesting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">API Connections</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-foreground text-background">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Save</>}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2"><Bot className="w-5 h-5" />LLM / AI Chatbot</CardTitle>
            <CardDescription>Connect your self-hosted Llama instance or any OpenAI-compatible API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>API Endpoint URL</Label>
              <Input
                value={settings.llm_endpoint || ''}
                onChange={e => update('llm_endpoint', e.target.value)}
                placeholder="http://streamconnect-llm:11434/api/chat  or  http://<ip>:8080/v1/chat/completions"
              />
              <p className="text-xs text-muted-foreground mt-1">
                For Ollama use: <code className="bg-muted px-1 rounded">http://&lt;host&gt;:11434/api/chat</code><br />
                For vLLM / TGI use: <code className="bg-muted px-1 rounded">http://&lt;host&gt;:8080/v1/chat/completions</code>
              </p>
            </div>

            <div>
              <Label>API Key <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="password"
                value={settings.llm_api_key || ''}
                onChange={e => update('llm_api_key', e.target.value)}
                placeholder="Leave blank if not required"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Model Name</Label>
                <Input
                  value={settings.llm_model || ''}
                  onChange={e => update('llm_model', e.target.value)}
                  placeholder="llama3, llama3.1:70b, etc."
                />
              </div>
              <div>
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={settings.llm_max_tokens || '512'}
                  onChange={e => update('llm_max_tokens', e.target.value)}
                  placeholder="512"
                />
              </div>
            </div>

            <div>
              <Label>Temperature <span className="text-muted-foreground font-normal">(0.0 – 1.0)</span></Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={settings.llm_temperature || '0.7'}
                onChange={e => update('llm_temperature', e.target.value)}
              />
            </div>

            <div>
              <Label>System Prompt</Label>
              <Textarea
                value={settings.llm_system_prompt || ''}
                onChange={e => update('llm_system_prompt', e.target.value)}
                placeholder="You are Stream Connect's helpful assistant..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">Defines the chatbot's personality and knowledge.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleTest} disabled={testing || !settings.llm_endpoint} variant="outline">
                {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TestTube className="w-4 h-4 mr-2" />}
                Test Connection
              </Button>
              {testResult === 'success' && <span className="flex items-center gap-1 text-sm text-spotify"><CheckCircle className="w-4 h-4" />Connected</span>}
              {testResult === 'error' && <span className="flex items-center gap-1 text-sm text-netflix"><XCircle className="w-4 h-4" />Failed</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Shopify</CardTitle>
            <CardDescription>Product catalog and payment processing integration.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-sm">Shopify Storefront</p>
                <p className="text-xs text-muted-foreground">Products are fetched from your Shopify store.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-spotify/20 text-spotify font-medium">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
