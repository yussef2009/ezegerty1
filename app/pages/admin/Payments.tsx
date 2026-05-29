import { useEffect, useState } from "react";
import { dbGetByPrefix, dbSet } from "../../lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loader2, RefreshCw, Check, X, Landmark, Receipt, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Order = {
  id: string;
  name: string;
  phone: string;
  paymentMethod: string;
  total: number;
  paymentStatus: "pending" | "confirmed" | "failed";
  createdAt: string;
};

export function AdminPayments() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const values = await dbGetByPrefix("order:");
      // Find orders where payment is pending
      const pending = values.filter((o: Order) => o.paymentStatus === 'pending' || (o.paymentMethod === 'Instapay' && !o.paymentStatus));
      setOrders(pending);
    } catch (error) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const confirmPayment = async (orderId: string, status: "confirmed" | "failed") => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const updatedOrder = { ...order, paymentStatus: status };
    try {
      await dbSet(`order:${orderId}`, updatedOrder);
      setOrders(orders.filter(o => o.id !== orderId));
      toast.success(`Payment marked as ${status}`);
    } catch (error) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Landmark className="h-7 w-7 text-blue-600" />
            Pending Payments
          </h1>
          <p className="text-gray-500 text-sm">Verify Instapay and manual payment transfers</p>
        </div>
        <Button onClick={fetchPendingPayments} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableHead className="w-[120px]">Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin inline text-blue-600 h-8 w-8" /></TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 font-medium">No pending payments to verify</p>
                </TableCell>
              </TableRow>
            ) : orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                <TableCell className="font-mono text-xs font-semibold">#{order.id.slice(-6)}</TableCell>
                <TableCell>
                  <div className="font-semibold text-gray-900 dark:text-white">{order.name}</div>
                  <div className="text-xs text-gray-500">{order.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                    {order.paymentMethod}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-gray-900 dark:text-white">
                  {order.total} EGP
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                      onClick={() => confirmPayment(order.id, "confirmed")}
                    >
                      <Check className="h-4 w-4 mr-1" /> Confirm
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => confirmPayment(order.id, "failed")}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="text-sm text-orange-800 dark:text-orange-300">
          <p className="font-semibold">Security Note</p>
          <p>Please cross-reference Instapay transfers with your business account before confirming payments here. Confirmed payments will automatically update the client's order status.</p>
        </div>
      </div>
    </div>
  );
}
