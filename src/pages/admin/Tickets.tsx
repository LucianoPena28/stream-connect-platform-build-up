import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  subject: string;
  message: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  source: string | null;
  created_at: string;
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTickets = async () => {
    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data } = await query;
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('tickets').update({ status }).eq('id', id);
    if (error) toast.error('Failed to update');
    else { toast.success('Updated', { position: 'top-center' }); fetchTickets(); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Tickets</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No tickets found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map(ticket => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{ticket.subject}</p>
                      {ticket.message && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{ticket.message}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{ticket.customer_name || ticket.customer_email || '—'}</TableCell>
                    <TableCell className="text-xs">{ticket.source || '—'}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        ticket.status === 'open' ? 'bg-primary/30 text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {ticket.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Select value={ticket.status} onValueChange={(v) => updateStatus(ticket.id, v)}>
                        <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
