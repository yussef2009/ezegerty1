import { useEffect, useState } from "react";
import { dbGetByPrefix, dbSet } from "../../lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Loader2, RefreshCw, Check, X, Landmark, Receipt, AlertCircle, Tag } from "lucide-react";
import { toast } from "sonner";
import { publishOtherPriceToClient } from "../../lib/otherOrderPricing";
import { useLanguage } from "../../context/LanguageContext";

type OrderItem = {
  serviceId: string;
  name: string;
  quantity: number;
  price: number;
  isOther: boolean;
  otherDescription?: string;
};

type Order = {
  id: string;
  name: string;
  phone: string;
  paymentMethod: string;
  total: number;
  paymentStatus: "pending" | "confirmed" | "failed";
  createdAt: string;
  items?: OrderItem[];
  priceByAdmin?: boolean;
};

export function AdminPayments() {
  const { t } = useLanguage();
  const a = t.admin;
  const [orders, setOrders] = useState<Order[]>([]);
  const [otherOrders, setOtherOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [priceOverride, setPriceOverride] = useState<{ [key: string]: number }>({});

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const values = await dbGetByPrefix("order:");
      const pending = values.filter(
        (o: Order) =>
          o.paymentStatus === "pending" || (o.paymentMethod === "instapay" && !o.paymentStatus)
      );
      const other = values.filter(
        (o: Order) =>
          o.priceByAdmin &&
          (o.paymentStatus === "pending" || !o.paymentStatus || o.total === 0)
      );
      setOrders(pending);
      setOtherOrders(other);
    } catch (error) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const saveOtherPrice = async (orderId: string) => {
    const order = otherOrders.find((o) => o.id === orderId);
    const finalTotal = priceOverride[orderId];
    if (!order || finalTotal == null || finalTotal <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    try {
      const updated = await publishOtherPriceToClient(order as import("../../lib/orderTypes").OrderRecord, finalTotal);
      setOtherOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success(a.priceSent || "Price sent to client for payment choice");
    } catch {
      toast.error("Save failed");
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const confirmPayment = async (orderId: string, status: "confirmed" | "failed") => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    let updatedOrder: Order = { ...order, paymentStatus: status };

    if (status === "confirmed" && priceOverride[orderId] != null) {
      const finalTotal = priceOverride[orderId];
      updatedOrder.total = finalTotal;
      if (updatedOrder.items?.length) {
        const otherIndexes = updatedOrder.items
          .map((item, i) => (item.isOther ? i : -1))
          .filter((i) => i >= 0);
        if (otherIndexes.length === 1) {
          const idx = otherIndexes[0];
          const priced = updatedOrder.items[idx];
          const catalogSubtotal = updatedOrder.items
            .filter((item) => !item.isOther)
            .reduce((sum, item) => sum + item.price * item.quantity, 0);
          const otherLineTotal = Math.max(0, finalTotal - catalogSubtotal);
          updatedOrder.items = updatedOrder.items.map((item, i) =>
            i === idx ? { ...item, price: otherLineTotal } : item
          );
        }
      }
    }
    
    try {
      await dbSet(`order:${orderId}`, updatedOrder);
      setOrders(orders.filter(o => o.id !== orderId));
      setPriceOverride(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
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
            Payments & Pricing
          </h1>
          <p className="text-gray-500 text-sm">Instapay verification and custom &quot;Other&quot; order prices</p>
        </div>
        <Button onClick={fetchPendingPayments} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="instapay" className="space-y-4">
        <TabsList>
          <TabsTrigger value="instapay">Instapay Pending</TabsTrigger>
          <TabsTrigger value="other">Other — Set Price ({otherOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="other" className="space-y-4">
          <div className="rounded-2xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="animate-spin inline h-8 w-8 text-blue-600" />
              </div>
            ) : otherOrders.length === 0 ? (
              <div className="py-16 text-center text-gray-500">No orders waiting for Other item pricing</div>
            ) : (
              <div className="divide-y dark:divide-gray-800">
                {otherOrders.map((order) => (
                  <div key={order.id} className="p-6 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{order.name}</p>
                        <p className="text-sm text-gray-500">#{order.id.slice(-8)} · {order.phone}</p>
                      </div>
                      <Badge variant="outline" className="text-orange-700 border-orange-200">
                        Price by admin
                      </Badge>
                    </div>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                        {item.name}
                        {item.isOther && item.otherDescription ? ` — ${item.otherDescription}` : ""}
                      </div>
                    ))}
                    <div className="flex gap-2 items-end max-w-sm">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500">Final order total (EGP)</label>
                        <Input
                          type="number"
                          min="0"
                          value={priceOverride[order.id] ?? (order.total || "")}
                          onChange={(e) =>
                            setPriceOverride((prev) => ({
                              ...prev,
                              [order.id]: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => saveOtherPrice(order.id)}>
                        {a.sendPriceToClient || "Send price to client"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="instapay">
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
            ) : (
              orders.map((order) => (
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
                    {priceOverride[order.id] ? priceOverride[order.id] : order.total} EGP
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {expandedId === order.id ? "Hide" : "Details"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Expanded Order Details */}
        {expandedId && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-4">
            {orders.find(o => o.id === expandedId) && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Order Items</h4>
                  {orders.find(o => o.id === expandedId)?.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        {item.isOther ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.otherDescription}</p>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity} × {item.price} EGP</p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.isOther ? "Admin Sets" : `${item.quantity * item.price} EGP`}
                      </p>
                    </div>
                  ))}
                </div>

                {orders.find(o => o.id === expandedId)?.priceByAdmin && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded border border-orange-200 dark:border-orange-800">
                    <label className="block text-sm font-medium text-orange-900 dark:text-orange-300 mb-2">
                      Set Final Price (EGP)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={priceOverride[expandedId] || orders.find(o => o.id === expandedId)?.total || 0}
                        onChange={(e) => setPriceOverride(prev => ({
                          ...prev,
                          [expandedId]: parseFloat(e.target.value) || 0
                        }))}
                        className="dark:bg-gray-900 dark:border-gray-700"
                      />
                      <Button 
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => {
                          // Price is now set and will be used on confirmation
                          toast.success("Price set. Confirm payment to apply.");
                        }}
                      >
                        Set Price
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={
                      !!orders.find((o) => o.id === expandedId)?.priceByAdmin &&
                      !(priceOverride[expandedId] ?? 0)
                    }
                    onClick={() => {
                      const o = orders.find((x) => x.id === expandedId);
                      if (o?.priceByAdmin && !priceOverride[expandedId]) {
                        toast.error("Set a final price before confirming");
                        return;
                      }
                      confirmPayment(expandedId, "confirmed");
                      setExpandedId(null);
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" /> Confirm Payment
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:bg-red-50 border-red-200"
                    onClick={() => {
                      confirmPayment(expandedId, "failed");
                      setExpandedId(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="text-sm text-orange-800 dark:text-orange-300">
          <p className="font-semibold">Security Note</p>
          <p>Please cross-reference Instapay transfers with your business account before confirming payments here. Confirmed payments will automatically update the client's order status.</p>
        </div>
      </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Tag className="h-4 w-4" />
        Manage coupon codes under{" "}
        <a href="/admin/discounts" className="text-blue-600 underline">
          Promo Codes
        </a>
      </div>
    </div>
  );
}
