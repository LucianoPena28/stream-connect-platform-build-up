import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Database, Cpu, Globe, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { adminOpsApi } from '@/lib/api';
import { toast } from 'sonner';

interface HealthData {
  timestamp: string;
  database: { status: string; latency?: number; error?: string };
  llm: { status: string; endpoint?: string; model?: string; availableModels?: string[]; error?: string };
  api: { status: string; uptime: number; memoryMB: number };
  authFailures: { last24h: number };
}

interface SecurityData {
  timestamp: string;
  findings: Array<{ severity: string; type: string; title: string; detail: string; data?: any[] }>;
  recommendations: Array<{ priority: string; text: string }>;
}

const statusBadge = (status: string) => {
  const color = ['connected', 'online', 'ok'].includes(status)
    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
    : status === 'error' || status === 'offline'
    ? 'bg-destructive/10 text-destructive'
    : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
  return <Badge className={`${color} text-xs`}>{status}</Badge>;
};

const priorityColor = (p: string) =>
  p === 'high' ? 'text-destructive' : p === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground';

export default function AdminMonitoring() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [security, setSecurity] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const [h, s] = await Promise.all([adminOpsApi.health(), adminOpsApi.security()]);
      setHealth(h);
      setSecurity(s);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  if (loading && !health) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> Platform Monitoring
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time health, security signals, and operational recommendations</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Health Cards */}
      {health && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Database className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Database</span></div>
                {statusBadge(health.database.status)}
              </div>
              {health.database.latency != null && <p className="text-xs text-muted-foreground">Latency: {health.database.latency}ms</p>}
              {health.database.error && <p className="text-xs text-destructive">{health.database.error}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">LLM</span></div>
                {statusBadge(health.llm.status)}
              </div>
              {health.llm.model && <p className="text-xs text-muted-foreground">Model: {health.llm.model}</p>}
              {health.llm.error && <p className="text-xs text-destructive truncate">{health.llm.error}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">API Server</span></div>
                {statusBadge(health.api.status)}
              </div>
              <p className="text-xs text-muted-foreground">Uptime: {formatUptime(health.api.uptime)}</p>
              <p className="text-xs text-muted-foreground">Memory: {health.api.memoryMB} MB</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Auth (24h)</span></div>
                <Badge className={`text-xs ${health.authFailures.last24h > 10 ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600 dark:text-green-400'}`}>
                  {health.authFailures.last24h} failures
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Failed login attempts in the last 24 hours</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Findings */}
      {security && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Security Findings
            </CardTitle>
            <CardDescription>
              {security.findings.length === 0
                ? 'No active security findings detected from available signals.'
                : `${security.findings.length} finding(s) from available signals. Detection is based on app logs and DB queries — not full network telemetry.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {security.findings.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" /> No issues detected
              </div>
            ) : (
              <div className="space-y-3">
                {security.findings.map((f, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      {f.severity === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-500" /> : <Info className="h-4 w-4 text-blue-500" />}
                      <span className="text-sm font-medium">{f.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{f.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {security && security.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Recommendations</CardTitle>
            <CardDescription>Standing security and operational recommendations for the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {security.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-2">
                  <Badge variant="outline" className={`text-xs ${priorityColor(r.priority)}`}>{r.priority}</Badge>
                  <span className="text-sm">{r.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
