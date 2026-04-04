import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, Shield, CheckCircle, AlertTriangle, Clock, ScrollText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { adminOpsApi } from '@/lib/api';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface AuditEntry {
  id: string;
  user_email: string;
  user_name: string;
  action: string;
  details: any;
  created_at: string;
}

export default function AdminAiOperations() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ content: string; model: string; hasProposedActions: boolean; timestamp: string } | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; description: string }>({ open: false, description: '' });
  const responseRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Check whether the API and database are healthy',
    'Review recent audit log activity and summarize any concerns',
    'Detect staff accounts without 2FA and recommend actions',
    'Summarize current platform status for a quick ops review',
    'List potential security improvements for the current setup',
  ];

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const raw = await adminOpsApi.prompt(prompt.trim());
      setResponse({ content: raw.response, model: raw.model, hasProposedActions: raw.hasProposedActions, timestamp: raw.timestamp });
      setTimeout(() => responseRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      toast.error(err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await adminOpsApi.approve(crypto.randomUUID(), approvalDialog.description);
      toast.success('Action approved and logged');
      setApprovalDialog({ open: false, description: '' });
    } catch (err: any) {
      toast.error(err.message || 'Approval failed');
    }
  };

  const loadAuditLog = async () => {
    setAuditLoading(true);
    try {
      const data = await adminOpsApi.auditLog();
      setAuditLog(data.entries || []);
      setShowAudit(true);
    } catch (err: any) {
      toast.error('Failed to load audit log');
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" /> AI Operations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Natural-language admin diagnostics, monitoring, and operations</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAuditLog} disabled={auditLoading}>
          <ScrollText className="h-4 w-4 mr-2" />
          {auditLoading ? 'Loading...' : 'Audit Log'}
        </Button>
      </div>

      {/* Prompt Composer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Prompt Composer</CardTitle>
          <CardDescription>Ask questions about platform health, security, diagnostics, or propose maintenance actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, i) => (
              <Button key={i} variant="outline" size="sm" className="text-xs h-7" onClick={() => setPrompt(qp)}>
                {qp.slice(0, 50)}{qp.length > 50 ? '…' : ''}
              </Button>
            ))}
          </div>
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Check whether the API or DB is down..."
            rows={3}
            className="resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Ctrl+Enter to send • Risky actions require approval</p>
            <Button onClick={handleSubmit} disabled={loading || !prompt.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              {loading ? 'Thinking...' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card ref={responseRef}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Bot className="h-4 w-4" /> AI Response
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{response.model}</Badge>
                {response.hasProposedActions && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Contains Proposed Actions
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{response.content}</ReactMarkdown>
            </div>
            {response.hasProposedActions && (
              <div className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Action Approval Required</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  The AI has proposed infrastructure or data changes. Review carefully before approving.
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setApprovalDialog({ open: true, description: response.content.slice(0, 500) })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Review & Approve Actions
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {new Date(response.timestamp).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Audit Log Sheet */}
      {showAudit && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display">Audit Log</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAudit(false)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            {auditLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit entries yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLog.map((entry, i) => (
                  <div key={entry.id || i} className="p-3 rounded-lg bg-muted/50 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{entry.action}</span>
                      <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.user_name || entry.user_email || 'System'}</p>
                    {entry.details && (
                      <pre className="text-xs mt-1 whitespace-pre-wrap break-all text-muted-foreground">
                        {typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={open => setApprovalDialog(a => ({ ...a, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" /> Confirm Action Approval
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You are about to approve the AI's proposed actions. This will be logged for audit purposes.
              Infrastructure changes still require manual execution.
            </p>
            <div className="p-3 rounded-lg bg-muted text-sm max-h-48 overflow-y-auto">
              {approvalDialog.description.slice(0, 500)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog({ open: false, description: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" /> Approve & Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
