import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Pencil, Trash2, Package } from 'lucide-react';
import { servicesApi, type Service } from '@/lib/api';
import { toast } from 'sonner';

const emptyService = { name: '', description: '', price_bzd: 0, category: '', billing_period: 'monthly', is_active: true, sort_order: 0 };

export default function AdminServicesManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> & typeof emptyService>(emptyService);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchServices = async () => {
    try {
      const data = await servicesApi.list();
      setServices(data);
    } catch { toast.error('Failed to load services'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

  const openCreate = () => {
    setEditingService({ ...emptyService });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditingService({ ...svc });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingService.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (isEditing && editingService.id) {
        await servicesApi.update(editingService.id, editingService);
        toast.success('Service updated!');
      } else {
        await servicesApi.create(editingService);
        toast.success('Service created!');
      }
      setDialogOpen(false);
      fetchServices();
    } catch { toast.error('Failed to save service'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      await servicesApi.remove(id);
      toast.success('Service deleted');
      fetchServices();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Services / Products</h1>
        <Button onClick={openCreate} className="bg-foreground text-background">
          <Plus className="w-4 h-4 mr-2" />Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No services yet. Click "Add Service" to create one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map(svc => (
            <Card key={svc.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display font-bold text-sm">{svc.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${svc.is_active ? 'bg-spotify/20 text-spotify' : 'bg-muted text-muted-foreground'}`}>
                      {svc.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {svc.category && <span className="text-xs text-muted-foreground">{svc.category}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{svc.description || 'No description'}</p>
                  <p className="text-sm font-bold mt-1">${Number(svc.price_bzd).toFixed(2)} BZD / {svc.billing_period}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(svc)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(svc.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{isEditing ? 'Edit Service' : 'Create Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Name</Label><Input value={editingService.name} onChange={e => setEditingService(p => ({ ...p, name: e.target.value }))} placeholder="Netflix Profile" /></div>
            <div><Label>Description</Label><Textarea value={editingService.description || ''} onChange={e => setEditingService(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price (BZD)</Label><Input type="number" step="0.01" value={editingService.price_bzd} onChange={e => setEditingService(p => ({ ...p, price_bzd: parseFloat(e.target.value) || 0 }))} /></div>
              <div>
                <Label>Billing Period</Label>
                <Select value={editingService.billing_period} onValueChange={v => setEditingService(p => ({ ...p, billing_period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category</Label><Input value={editingService.category || ''} onChange={e => setEditingService(p => ({ ...p, category: e.target.value }))} placeholder="netflix, spotify, etc." /></div>
              <div><Label>Sort Order</Label><Input type="number" value={editingService.sort_order} onChange={e => setEditingService(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editingService.is_active} onCheckedChange={v => setEditingService(p => ({ ...p, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving} className="bg-foreground text-background">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
