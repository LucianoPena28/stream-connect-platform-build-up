import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, Package, Settings, LogOut, ArrowUpDown, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  service_name: string;
  status: string;
  price_bzd: number;
  billing_period: string;
  started_at: string;
  expires_at: string | null;
  service_id: string | null;
}

interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default function AccountDashboard() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/account/login');
      return;
    }
    if (user) loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    const [subsRes, profileRes] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('full_name, email, avatar_url').eq('user_id', user!.id).single(),
    ]);
    setSubscriptions((subsRes.data as Subscription[]) || []);
    if (profileRes.data) {
      setProfile(profileRes.data);
      setEditName(profileRes.data.full_name || '');
    }
    setLoading(false);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: editName.trim() }).eq('user_id', user!.id);
    if (error) toast.error('Failed to update name');
    else toast.success('Profile updated!', { position: 'top-center' });
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return <main className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></main>;
  }

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="container max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold">My Account</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/account/security"><Shield className="w-4 h-4 mr-1" />Security</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-1" />Sign Out
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Profile */}
          <Card>
            <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><Settings className="w-5 h-5" />Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <div className="flex gap-2">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} />
                    <Button size="icon" variant="outline" onClick={handleSaveName} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="opacity-70" />
                  <p className="text-xs text-muted-foreground mt-1">Contact support to change email</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />My Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You don't have any active subscriptions yet.</p>
                  <Button asChild className="bg-primary text-primary-foreground">
                    <Link to="/services">Browse Plans</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div>
                        <h4 className="font-semibold">{sub.service_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${sub.price_bzd} BZD / {sub.billing_period}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          sub.status === 'active' ? 'bg-spotify/20 text-spotify' :
                          sub.status === 'pending' ? 'bg-primary/20 text-primary-foreground' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/contact">
                          <ArrowUpDown className="w-3 h-3 mr-1" />Change Plan
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
