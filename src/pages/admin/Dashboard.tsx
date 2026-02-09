import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Users, MessageSquare, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, customers: 0, tickets: 0 });
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; customer_name: string | null; total_bzd: number; status: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [ordersRes, customersRes, ticketsRes, recentRes] = await Promise.all([
        supabase.from('orders').select('total_bzd, status'),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('orders').select('id, customer_name, total_bzd, status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const orders = ordersRes.data || [];
      const revenue = orders.reduce((sum, o) => sum + Number(o.total_bzd || 0), 0);

      setStats({
        orders: orders.length,
        revenue,
        customers: customersRes.count || 0,
        tickets: ticketsRes.count || 0,
      });
      setRecentOrders(recentRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const kpis = [
    { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-primary-foreground bg-primary' },
    { label: 'Revenue (BZD)', value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: 'text-spotify-foreground bg-spotify' },
    { label: 'Customers', value: stats.customers, icon: Users, color: 'text-netflix-foreground bg-netflix' },
    { label: 'Open Tickets', value: stats.tickets, icon: MessageSquare, color: 'text-foreground bg-muted' },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="font-display text-2xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{order.customer_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">${Number(order.total_bzd).toFixed(2)} BZD</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'paid' || order.status === 'active' ? 'bg-spotify/20 text-spotify' :
                      order.status === 'pending' ? 'bg-primary/30 text-primary-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
