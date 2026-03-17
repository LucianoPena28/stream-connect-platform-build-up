import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Database, Bot, Server } from 'lucide-react';
import { apiStatusApi, type ApiStatusResponse } from '@/lib/api';
import { toast } from 'sonner';

function StatusBadge({ status }: { status: string }) {
  const isGood = ['connected', 'running'].includes(status.toLowerCase());
  return (
    <Badge variant={isGood ? 'default' : 'destructive'} className={isGood ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
      {status}
    </Badge>
  );
}

export default function AdminApiConnections() {
  const [data, setData] = useState<ApiStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await apiStatusApi.get();
      setData(res);
      if (isRefresh) toast.success('Status refreshed');
    } catch {
      toast.error('Failed to fetch API status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">API Connections</h1>
        <Button onClick={() => fetchStatus(true)} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {!data ? (
        <div className="text-center text-muted-foreground py-10">Unable to load API status.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Database */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Database className="w-5 h-5" /> Database
              </CardTitle>
              <CardDescription>MySQL connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={data.database.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">URL</span>
                <span className="text-sm font-mono">{data.database.url}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-mono">{data.database.db}</span>
              </div>
            </CardContent>
          </Card>

          {/* LLM */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Bot className="w-5 h-5" /> LLM
              </CardTitle>
              <CardDescription>AI model connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={data.llm.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">URL</span>
                <span className="text-sm font-mono">{data.llm.url}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Models</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.llm.models?.length ? data.llm.models.map(m => (
                    <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                  )) : <span className="text-xs text-muted-foreground">None detected</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backend */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Server className="w-5 h-5" /> Backend
              </CardTitle>
              <CardDescription>Express API server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={data.backend.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Port</span>
                <span className="text-sm font-mono">{data.backend.port}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm font-mono">v{data.backend.version}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
