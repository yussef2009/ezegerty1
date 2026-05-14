import { useEffect, useState } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loader2, RefreshCw, CheckCircle2, Truck, Phone, MapPin, Package, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

type Order = {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: "pending" | "cleaning" | "ready" | "delivered";
  total: number;
  createdAt: string;
  items: any[];
};

export function AdminDelivery() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: "", email: "", password: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchDeliveryOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/kv/prefix/order:`, {
        headers: { "Authorization": `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.values) {
        // Only show orders that are 'ready' (for pickup) or 'delivered' (recently)
        const deliveryOrders = data.values.filter((o: Order) => o.status === 'ready' || o.status === 'delivered');
        setOrders(deliveryOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (error) {
      toast.error("Failed to fetch delivery tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const markAsDelivered = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const updatedOrder = { ...order, status: "delivered" };
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/kv/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ key: `order:${orderId}`, value: updatedOrder })
      });
      setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
      toast.success("Order marked as delivered");
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingDriver(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ 
          email: driverForm.email, 
          password: driverForm.password,
          name: driverForm.name,
          role: "delivery"
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      toast.success("Delivery driver account created successfully");
      setIsDialogOpen(false);
      setDriverForm({ name: "", email: "", password: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to create driver");
    } finally {
      setIsAddingDriver(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage active deliveries and driver tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <UserPlus className="h-4 w-4" />
                Add Delivery Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Delivery Driver</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDriver} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    required 
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    placeholder="Ahmed Hassan" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={driverForm.email}
                    onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                    placeholder="driver@ezgerty.com" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={driverForm.password}
                    onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                    placeholder="Min 6 characters" 
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isAddingDriver}>
                  {isAddingDriver ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button onClick={fetchDeliveryOrders} variant="outline" size="sm" className="gap-2 h-10">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed">
            <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No active deliveries</h3>
            <p className="text-gray-500">All caught up! New ready orders will appear here.</p>
          </div>
        ) : orders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="px-3 py-1">
                {order.status === 'ready' ? 'READY FOR DELIVERY' : 'DELIVERED'}
              </Badge>
              <span className="text-xs font-mono text-gray-400">#{order.id.slice(-6)}</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{order.name}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{order.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400 shrink-0" />
                <a href={`tel:${order.phone}`} className="text-blue-600 hover:underline font-medium">{order.phone}</a>
              </div>

              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-400 shrink-0" />
                <p className="text-sm font-medium">{order.items?.length || 0} Items • {order.total} EGP</p>
              </div>

              {order.status === 'ready' && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-11"
                  onClick={() => markAsDelivered(order.id)}
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Mark as Delivered
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
