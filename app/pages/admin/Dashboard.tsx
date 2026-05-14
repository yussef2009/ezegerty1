import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Loader2, RefreshCw, Check, X, TrendingUp, Users, ShoppingBag, Landmark, WashingMachine, Sparkles, Tag } from "lucide-react";

type Order = {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: "pending" | "cleaning" | "ready" | "delivered";
  paymentMethod: string;
  tips: number;
  total: number;
  createdAt: string;
};

type AccountRequest = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  volume: string;
  notes: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/kv/prefix/order:`, {
        headers: { "Authorization": `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.values) {
        const sorted = data.values.sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const updatedOrder = { ...order, status: newStatus };
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/kv/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ key: `order:${orderId}`, value: updatedOrder })
      });
      setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stakeholder Overview</h1>
          <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchOrders} variant="outline" size="sm" className="h-10 px-4 gap-2">
            <RefreshCw className={`h-4 w-4 ${loadingOrders ? 'animate-spin' : ''}`} />
            Sync Dashboard
          </Button>
          <Button onClick={() => navigate("/admin/services")} className="bg-blue-600 hover:bg-blue-700 h-10 px-4">
            Manage Services
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl"><ShoppingBag className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</h3>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl"><TrendingUp className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalRevenue.toLocaleString()} EGP</h3>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl"><RefreshCw className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{pendingOrders}</h3>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl"><Landmark className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Instapay Pending</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{orders.filter(o => o.paymentMethod === 'Instapay' && o.status === 'pending').length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Recent Orders</h2>
            <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => navigate("/admin/tracking")}>View All</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOrders ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="mx-auto animate-spin h-8 w-8 text-blue-600" /></TableCell></TableRow>
                ) : recentOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-gray-500">No orders yet</TableCell></TableRow>
                ) : recentOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                    <TableCell>
                      <div className="font-semibold text-gray-900 dark:text-white">{order.name}</div>
                      <div className="text-xs text-gray-500">{order.phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === 'delivered' ? 'default' : 
                        order.status === 'ready' ? 'secondary' : 
                        order.status === 'cleaning' ? 'outline' : 'destructive'
                      } className="px-2 py-0.5 rounded-md">
                        {order.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-gray-900 dark:text-white">{order.total} EGP</TableCell>
                    <TableCell className="text-right">
                      <Select defaultValue={order.status} onValueChange={(val) => updateOrderStatus(order.id, val)}>
                        <SelectTrigger className="w-[120px] h-8 text-xs ml-auto shadow-none"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cleaning">Cleaning</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Quick Actions / Notifications Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="font-bold text-xl mb-2">Need Support?</h3>
            <p className="text-blue-100 text-sm mb-4">Contact our technical team for any platform issues or feature requests.</p>
            <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold border-none h-11">
              Contact Support
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Admin Quick Settings</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 gap-3 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => navigate("/admin/services")}
              >
                <WashingMachine className="h-5 w-5 text-gray-400" />
                <span>Add New Service</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 gap-3 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => navigate("/admin/plans")}
              >
                <Sparkles className="h-5 w-5 text-gray-400" />
                <span>Create Subscription Plan</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 gap-3 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => navigate("/admin/discounts")}
              >
                <Tag className="h-5 w-5 text-gray-400" />
                <span>Generate Promo Code</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}