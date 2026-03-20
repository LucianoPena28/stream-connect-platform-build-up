import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCw, Database, Bot, Server, Save, Wifi } from 'lucide-react';
import { apiStatusApi, settingsApi, type ApiStatusResponse } from '@/lib/api';
import { toast } from 'sonner';

function StatusBadge({ status }: { status: string }) {
  const isGood = ['connected', 'running', 'online'].includes(status.toLowerCase());
  return (
    <Badge variant={isGood ? 'default' : 'destructive'} className={isGood ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
      {status}
    </Badge>
  );
}

interface LlmConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  maxTokens: string;
  temperature: string;
  systemPrompt: string;
}

const defaultConfig: LlmConfig = {
  endpoint: 'http://10.0.0.39:11434',
  apiKey: '',
  model: 'tinyllama:latest',
  maxTokens: '512',
  temperature: '0.7',
  systemPrompt: 'You are a helpful customer support assistant for Stream Connect, a digital services company in Belize.',
};

export default function AdminApiConnections() {
  const [statusData, setStatusData] = useState<ApiStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [config, setConfig] = useState<LlmConfig>(defaultConfig);
  const [configLoading, setConfigLoading] = useState(true);
  const [savingConnection, setSavingConnection] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; models: string[] } | null>(null);
  const backendLoaded = useRef(false);

  const fetchStatus = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setStatusLoading(true);
    try {
      const res = await apiStatusApi.get();
      setStatusData(res);
      if (isRefresh) toast.success('Status refreshed');
    } catch {
      toast.error('Failed to fetch API status');
    } finally {
      setStatusLoading(false);
      setRefreshing(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const data = await settingsApi.list();
      const map: Record<string, string> = {};
      data.forEach(row => { map[row.key] = row.value || ''; });

      const llmRaw = map['llmconfig'] || map['llm_config'];
      if (llmRaw) {
        try {
          const parsed = JSON.parse(llmRaw);
          // Fully replace config with backend values, filling gaps from default
          setConfig({
            endpoint: parsed.endpoint || defaultConfig.endpoint,
            apiKey: parsed.apiKey || defaultConfig.apiKey,
            model: parsed.model || defaultConfig.model,
            maxTokens: parsed.maxTokens || defaultConfig.maxTokens,
            temperature: parsed.temperature || defaultConfig.temperature,
            systemPrompt: parsed.systemPrompt ?? defaultConfig.systemPrompt,
          });
          backendLoaded.current = true;
        } catch { /* malformed JSON, keep defaults */ }
      }

      // Backwards compat: individual keys only if no llmconfig found
      if (!backendLoaded.current) {
        if (map.llm_endpoint) setConfig(prev => ({ ...prev, endpoint: map.llm_endpoint }));
        if (map.llm_model) setConfig(prev => ({ ...prev, model: map.llm_model }));
        if (map.llm_system_prompt) setConfig(prev => ({ ...prev, systemPrompt: map.llm_system_prompt }));
      }
    } catch { /* network error, keep defaults */ }
    setConfigLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    fetchConfig();
  }, []);

  const saveConfig = async (type: 'connection' | 'prompt') => {
    const setter = type === 'connection' ? setSavingConnection : setSavingPrompt;
    setter(true);
    try {
      const payload = JSON.stringify(config);
      // Write to both keys to keep them in sync
      await settingsApi.save({ llmconfig: payload, llm_config: payload });
      toast.success(
        type === 'connection' ? 'Connection settings saved!' : 'System prompt saved!',
        { position: 'top-center' },
      );
      setTestResult(null);
      await fetchStatus(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save');
    }
    setter(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiStatusApi.get();
      if (res.llm.status === 'online' || res.llm.status === 'connected') {
        toast.success('LLM connection successful!');
        setTestResult({ status: 'connected', models: res.llm.models });
      } else {
        toast.error('LLM connection failed');
        setTestResult({ status: 'error', models: res.llm.models ?? [] });
      }
    } catch {
      setTestResult({ status: 'error', models: [] });
      toast.error('Connection test failed');
    }
    setTesting(false);
  };

  const updateConfig = (key: keyof LlmConfig, value: string) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">API Connections</h1>
        <Button onClick={() => fetchStatus(true)} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* ─── Connection Status Panel ─────────────────────────────────────── */}
      {statusLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !statusData ? (
        <div className="text-center text-muted-foreground py-6 mb-6">Unable to load API status.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Database className="w-4 h-4" /> Database
              </CardTitle>
              <CardDescription className="text-xs">MySQL connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={statusData.database.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">URL</span>
                <span className="text-xs font-mono truncate max-w-[140px]">{statusData.database.url}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-xs font-mono">{statusData.database.db}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Bot className="w-4 h-4" /> LLM / AI
              </CardTitle>
              <CardDescription className="text-xs">Self-hosted Ollama</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={statusData.llm.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">URL</span>
                <span className="text-xs font-mono truncate max-w-[140px]">{statusData.llm.url}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Models</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {statusData.llm.models?.length ? statusData.llm.models.map(m => (
                    <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                  )) : <span className="text-xs text-muted-foreground">None detected</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Server className="w-4 h-4" /> Backend API
              </CardTitle>
              <CardDescription className="text-xs">Express server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={statusData.backend.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Port</span>
                <span className="text-xs font-mono">{statusData.backend.port}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-xs font-mono">v{statusData.backend.version}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator className="mb-8" />

      {/* ─── LLM Configuration Form ──────────────────────────────────────── */}
      <h2 className="font-display text-xl font-bold mb-4">LLM Configuration</h2>

      {/* Test connection banner */}
      <div className="flex gap-2 mb-4">
        <Button onClick={handleTest} disabled={testing} variant="outline" size="sm">
          {testing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Wifi className="w-4 h-4 mr-1" />}
          Test Connection
        </Button>
      </div>

      {testResult && (
        <div className={`mb-4 p-3 rounded-lg border text-sm ${testResult.status === 'connected' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
          {testResult.status === 'connected'
            ? `✓ Connected — Models available: ${testResult.models.join(', ') || 'none'}`
            : '✗ Connection failed — check your endpoint URL and ensure the LLM server is running'}
        </div>
      )}

      {configLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Connection Settings</CardTitle>
              <Button onClick={() => saveConfig('connection')} disabled={savingConnection} size="sm" className="bg-foreground text-background">
                {savingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />Save Connection Settings</>}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>API Endpoint URL</Label>
                  <Input
                    value={config.endpoint}
                    onChange={e => updateConfig('endpoint', e.target.value)}
                    placeholder="http://10.0.0.39:11434"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Ollama, vLLM, or OpenAI-compatible endpoint</p>
                </div>
                <div>
                  <Label>API Key (optional)</Label>
                  <Input
                    type="password"
                    value={config.apiKey}
                    onChange={e => updateConfig('apiKey', e.target.value)}
                    placeholder="Not required for Ollama"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave blank for local Ollama instances</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Model Name</Label>
                  <Input
                    value={config.model}
                    onChange={e => updateConfig('model', e.target.value)}
                    placeholder="tinyllama:latest"
                  />
                </div>
                <div>
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={config.maxTokens}
                    onChange={e => updateConfig('maxTokens', e.target.value)}
                    placeholder="512"
                  />
                </div>
                <div>
                  <Label>Temperature</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={config.temperature}
                    onChange={e => updateConfig('temperature', e.target.value)}
                    placeholder="0.7"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">System Prompt</CardTitle>
              <Button onClick={() => saveConfig('prompt')} disabled={savingPrompt} size="sm" className="bg-foreground text-background">
                {savingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />Save System Prompt</>}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.systemPrompt}
                onChange={e => updateConfig('systemPrompt', e.target.value)}
                rows={4}
                placeholder="You are a helpful assistant..."
              />
              <p className="text-xs text-muted-foreground mt-2">This prompt is prepended to every chat conversation to set the AI's behavior.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
