import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { dbGetByPrefix } from "../../lib/db";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loader2, Package, LogOut, Clock, MapPin, CreditCard } from "lucide-react";

type Order = {
  id: string;
  name: string;
  status: "pending" | "cleaning" | "ready" | "delivered";
  paymentMethod: string;
  total: number;
  createdAt: string;
  userId?: string;
  userEmail?: string;
};

export function ClientDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/client-login");
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const values = await dbGetByPrefix("order:");
      // Filter by current user ID or Email
      const myOrders = values.filter((o: Order) => 
        o.userId === user?.id || o.userEmail === user?.email
      );
      
      const sorted = myOrders.sort((a: Order, b: Order) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleSignOut = async () => {
      await signOut();
      navigate("/");
  };

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-950">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border dark:bg-gray-900 dark:border-gray-800">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, {user.user_metadata.name || "Customer"}!</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your laundry orders and track deliveries</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate("/client/account-request")}>
               Business Account
            </Button>
            <Button variant="destructive" size="sm" onClick={handleSignOut} className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
           <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
              <h3 className="text-blue-100 text-sm font-medium mb-1">Active Orders</h3>
              <div className="text-3xl font-bold">{orders.filter(o => o.status !== 'delivered').length}</div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border dark:bg-gray-900 dark:border-gray-800">
              <h3 className="text-gray-500 text-sm font-medium mb-1">Total Spent</h3>
              <div className="text-3xl font-bold dark:text-white">{orders.reduce((acc, curr) => acc + (curr.total || 0), 0)} EGP</div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border dark:bg-gray-900 dark:border-gray-800">
              <h3 className="text-gray-500 text-sm font-medium mb-1">Items Cleaned</h3>
              <div className="text-3xl font-bold dark:text-white">{orders.length * 5}+</div>
           </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" /> Order History
            </h2>
            <Button variant="ghost" size="sm" onClick={fetchOrders} className="text-blue-600">Refresh</Button>
          </div>
          
          {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
          ) : orders.length === 0 ? (
             <div className="text-center py-20">
               <Package className="h-16 w-16 mx-auto text-gray-200 mb-4" />
               <p className="text-gray-500 text-lg">No orders found.</p>
               <Button className="mt-4 bg-blue-600" onClick={() => navigate("/order")}>Place Your First Order</Button>
             </div>
          ) : (
            <div className="divide-y dark:divide-gray-800">
              {orders.map((order) => (
                <div key={order.id} className="p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">#{order.id.split('_')[1]}</span>
                        <Badge variant={
                          order.status === 'delivered' ? 'default' : 
                          order.status === 'ready' ? 'secondary' : 
                          order.status === 'cleaning' ? 'outline' : 'destructive'
                        } className="capitalize">
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {order.paymentMethod}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{order.total} EGP</div>
                        <div className="text-xs text-gray-500">Paid</div>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => navigate(`/track?id=${order.id}`)}>
                        Track Live
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
