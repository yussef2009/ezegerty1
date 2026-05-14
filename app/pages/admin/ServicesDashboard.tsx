import { useEffect, useState } from "react";
import { projectId, publicAnonKey } from "../../../supabase/info";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp, Users, ShoppingBag, Landmark, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export function AdminServicesDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/kv/prefix/order:`, {
        headers: { "Authorization": `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.values) {
        setOrders(data.values);
      }
    } catch (error) {
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate stats
  const serviceStats = orders.reduce((acc: any, order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        acc[item.name] = (acc[item.name] || 0) + 1;
      });
    }
    return acc;
  }, {});

  const barData = Object.entries(serviceStats).map(([name, value]) => ({ name, value }));

  const clientStats = orders.reduce((acc: any, order) => {
    acc[order.name] = (acc[order.name] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(clientStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Ordered Service</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barData.sort((a: any, b: any) => b.value - a.value)[0]?.name || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Top choice among clients</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(clientStats).length}</div>
            <p className="text-xs text-muted-foreground">Engaged customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Service Popularity</CardTitle>
            <CardDescription>Most requested laundry services</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Clients with most frequent orders</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
