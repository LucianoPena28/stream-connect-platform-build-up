import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search, Plus, KeyRound, RotateCcw, Trash2, Copy, Eye, EyeOff, Edit2, Shield, Save } from 'lucide-react';
import { customersApi, credentialsApi, servicesApi, type Customer, type ServiceCredential, type Service } from '@/lib/api';
import { toast } from 'sonner';

function generatePassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [services, setServices] = useState<Service[]>([]);

  // Create customer dialog
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCust, setNewCust] = useState({ full_name: '', email: '', phone: '', password: generatePassword() });

  // Credentials sheet
  const [credCustomer, setCredCustomer] = useState<Customer | null>(null);
  const [creds, setCreds] = useState<ServiceCredential[]>([]);
  const [credsLoading, setCredsLoading] = useState(false);
  const [showAddCred, setShowAddCred] = useState(false);
  const [editingCred, setEditingCred] = useState<ServiceCredential | null>(null);
  const [credForm, setCredForm] = useState({ service_name: '', service_id: '', username: '', password: '', notes: '' });
  const [credSaving, setCredSaving] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      customersApi.list().then(setCustomers),
      servicesApi.list().then(setServices).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  // ─── Create Customer ────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newCust.full_name.trim() || !newCust.email.trim() || !newCust.password.trim()) {
      toast.error('Name, email, and password are required');
      return;
    }
    setCreating(true);
    try {
      const res = await customersApi.create(newCust);
      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">Customer created!</p>
          <p className="text-sm">Email: {res.email}</p>
          <p className="text-sm">Temp Password: {newCust.password}</p>
          <Button size="sm" variant="outline" className="mt-1" onClick={() => {
            navigator.clipboard.writeText(`Email: ${res.email}\nPassword: ${newCust.password}`);
            toast.info('Credentials copied!');
          }}><Copy className="w-3 h-3 mr-1" />Copy</Button>
        </div>,
        { duration: 15000 }
      );
      setShowCreate(false);
      setNewCust({ full_name: '', email: '', phone: '', password: generatePassword() });
      customersApi.list().then(setCustomers);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create customer');
    }
    setCreating(false);
  };

  // ─── Send Reset ─────────────────────────────────────────────────────
  const handleSendReset = async (customer: Customer) => {
    try {
      await customersApi.sendReset(customer.id);
      toast.success(`Reset link sent to ${customer.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link');
    }
  };

  // ─── Delete Customer ────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer? This cannot be undone.')) return;
    try {
      await customersApi.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success('Customer deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  // ─── Credentials ────────────────────────────────────────────────────
  const openCredentials = async (customer: Customer) => {
    setCredCustomer(customer);
    setCredsLoading(true);
    try {
      const data = await credentialsApi.listForCustomer(customer.id);
      setCreds(data);
    } catch { setCreds([]); }
    setCredsLoading(false);
  };

  const resetCredForm = () => {
    setCredForm({ service_name: '', service_id: '', username: '', password: '', notes: '' });
    setEditingCred(null);
    setShowAddCred(false);
  };

  const openEditCred = (cred: ServiceCredential) => {
    setEditingCred(cred);
    setCredForm({
      service_name: cred.service_name,
      service_id: cred.service_id || '',
      username: cred.username || '',
      password: cred.password || '',
      notes: cred.notes || '',
    });
    setShowAddCred(true);
  };

  const handleSaveCred = async () => {
    if (!credCustomer || !credForm.service_name.trim()) {
      toast.error('Service name is required');
      return;
    }
    setCredSaving(true);
    try {
      if (editingCred) {
        await credentialsApi.updateForCustomer(credCustomer.id, editingCred.id, credForm);
        toast.success('Credential updated');
      } else {
        await credentialsApi.createForCustomer(credCustomer.id, credForm);
        toast.success('Credential added');
      }
      const data = await credentialsApi.listForCustomer(credCustomer.id);
      setCreds(data);
      resetCredForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save credential');
    }
    setCredSaving(false);
  };

  const handleDeleteCred = async (credId: string) => {
    if (!credCustomer) return;
    try {
      await credentialsApi.deleteForCustomer(credCustomer.id, credId);
      setCreds(prev => prev.filter(c => c.id !== credId));
      toast.success('Credential deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.info(`${label} copied!`);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Customers</h1>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Customer
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No customers found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name || '—'}</TableCell>
                    <TableCell className="text-sm">{customer.email || '—'}</TableCell>
                    <TableCell className="text-sm">{customer.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={customer.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {customer.role || 'customer'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Credentials" onClick={() => openCredentials(customer)}>
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Send Reset Link" onClick={() => handleSendReset(customer)}>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Delete" onClick={() => handleDelete(customer.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ─── Create Customer Dialog ──────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add New Customer</DialogTitle>
            <DialogDescription>Create a customer account with temporary credentials.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name *</Label><Input value={newCust.full_name} onChange={e => setNewCust(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" /></div>
            <div><Label>Email *</Label><Input type="email" value={newCust.email} onChange={e => setNewCust(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" /></div>
            <div><Label>Phone Number</Label><Input value={newCust.phone} onChange={e => setNewCust(p => ({ ...p, phone: e.target.value }))} placeholder="+501 600-0000" /></div>
            <div>
              <Label>Temporary Password *</Label>
              <div className="flex gap-2">
                <Input value={newCust.password} onChange={e => setNewCust(p => ({ ...p, password: e.target.value }))} />
                <Button type="button" variant="outline" size="sm" onClick={() => setNewCust(p => ({ ...p, password: generatePassword() }))}>
                  <RotateCcw className="w-3 h-3 mr-1" />Generate
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Create Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Credentials Sheet ───────────────────────────────────────────── */}
      <Sheet open={!!credCustomer} onOpenChange={open => { if (!open) { setCredCustomer(null); resetCredForm(); } }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display flex items-center gap-2">
              <Shield className="w-5 h-5" /> Service Credentials
            </SheetTitle>
            <SheetDescription>{credCustomer?.name} — {credCustomer?.email}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <Button size="sm" onClick={() => { resetCredForm(); setShowAddCred(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Add Credential
            </Button>

            {credsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : creds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No credentials stored for this customer.</p>
            ) : (
              <div className="space-y-3">
                {creds.map(cred => (
                  <Card key={cred.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{cred.service_name}</Badge>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditCred(cred)}><Edit2 className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteCred(cred.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                      {cred.username && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm"><span className="text-muted-foreground">User:</span> {cred.username}</span>
                          <Button size="icon" variant="ghost" onClick={() => copyToClipboard(cred.username!, 'Username')}><Copy className="w-3 h-3" /></Button>
                        </div>
                      )}
                      {cred.password && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono">
                            <span className="text-muted-foreground">Pass:</span>{' '}
                            {visiblePasswords.has(cred.id) ? cred.password : '••••••••'}
                          </span>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => togglePasswordVisibility(cred.id)}>
                              {visiblePasswords.has(cred.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(cred.password!, 'Password')}><Copy className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      )}
                      {cred.notes && <p className="text-xs text-muted-foreground">{cred.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add/Edit Credential Form */}
            {showAddCred && (
              <Card className="border-primary/30">
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-sm font-semibold">{editingCred ? 'Edit' : 'New'} Credential</h4>
                  <div>
                    <Label>Service Name *</Label>
                    <Input value={credForm.service_name} onChange={e => setCredForm(p => ({ ...p, service_name: e.target.value }))} placeholder="Netflix, Hulu, etc." />
                  </div>
                  <div>
                    <Label>Linked Service</Label>
                    <Select value={credForm.service_id} onValueChange={v => setCredForm(p => ({ ...p, service_id: v === 'none' ? '' : v }))}>
                      <SelectTrigger><SelectValue placeholder="(Optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Username / Email</Label><Input value={credForm.username} onChange={e => setCredForm(p => ({ ...p, username: e.target.value }))} /></div>
                  <div><Label>Password</Label><Input value={credForm.password} onChange={e => setCredForm(p => ({ ...p, password: e.target.value }))} /></div>
                  <div><Label>Notes</Label><Textarea rows={2} value={credForm.notes} onChange={e => setCredForm(p => ({ ...p, notes: e.target.value }))} /></div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveCred} disabled={credSaving}>
                      {credSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                      {editingCred ? 'Update' : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={resetCredForm}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
