import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, Trash2, Shield, ShieldCheck } from 'lucide-react';
import { employeesApi, type Employee } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AdminEmployees() {
  const { user, isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'support'>('support');

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeesApi.list();
      setEmployees(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleAddEmployee = async () => {
    if (!newEmail || !newPassword || !newName) { toast.error('Please fill all fields'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setAdding(true);
    try {
      await employeesApi.create({ email: newEmail, password: newPassword, full_name: newName, role: newRole });
      toast.success(`Employee ${newName} created successfully!`, { position: 'top-center' });
      setNewEmail(''); setNewPassword(''); setNewName(''); setNewRole('support');
      await loadEmployees();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create employee');
    } finally { setAdding(false); }
  };

  const handleRemoveRole = async (userId: string) => {
    if (userId === user?.id) { toast.error("You can't remove your own role"); return; }
    try {
      await employeesApi.remove(userId);
      toast.success('Role removed', { position: 'top-center' });
      await loadEmployees();
    } catch { toast.error('Failed to remove role'); }
  };

  const handleChangeRole = async (userId: string, role: 'admin' | 'support') => {
    try {
      await employeesApi.updateRole(userId, role);
      toast.success('Role updated', { position: 'top-center' });
      await loadEmployees();
    } catch { toast.error('Failed to update role'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Employee Management</h1>
      <div className="grid gap-6">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5" />Add Employee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div><Label>Full Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Employee name" /></div>
                <div><Label>Email</Label><Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="employee@streamconnect.online" /></div>
                <div><Label>Temporary Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" /></div>
                <div>
                  <Label>Role</Label>
                  <Select value={newRole} onValueChange={(v: 'admin' | 'support') => setNewRole(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddEmployee} disabled={adding} className="bg-foreground text-background">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-2" />Create Employee</>}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Current Employees ({employees.length})</CardTitle></CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No employees with assigned roles yet.</p>
            ) : (
              <div className="space-y-3">
                {employees.map(emp => (
                  <div key={emp.user_id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${emp.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {emp.role === 'admin' ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{emp.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{emp.email || emp.user_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && emp.user_id !== user?.id && (
                        <>
                          <Select value={emp.role} onValueChange={(v: 'admin' | 'support') => handleChangeRole(emp.user_id, v)}>
                            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="support">Support</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveRole(emp.user_id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {emp.user_id === user?.id && (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">You</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
