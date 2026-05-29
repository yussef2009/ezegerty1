import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { dbGetByPrefix } from "../../lib/db";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loader2, Package, Clock, CreditCard, ChevronRight, Truck } from "lucide-react";
import { motion } from "motion/react";

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

export function ClientHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/client-login");
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const values = await dbGetByPrefix("order:");
      const myOrders = values.filter((o: Order) => 
        o.userId === user?.id || o.userEmail === user?.email
      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(myOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-950">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order History</h1>
          <p className="text-gray-500 mt-2">View and track all your past and active orders</p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800">
              <Package className="h-16 w-16 mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 text-lg">You haven't placed any orders yet.</p>
              <Button className="mt-4 bg-blue-600" onClick={() => navigate("/order")}>Start Laundry Now</Button>
            </div>
          ) : (
            orders.map((order, idx) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/track?id=${order.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {order.status === 'delivered' ? <Package className="h-6 w-6" /> : <Truck className="h-6 w-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">Order #{order.id.slice(-6)}</span>
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>{order.status.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {order.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8">
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{order.total} EGP</div>
                      <div className="text-xs text-gray-400">Total Amount</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
