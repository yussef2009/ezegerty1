import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { dbSet, dbGetByPrefix, dbGet } from "../../lib/db";
import { notifyOrderStatusChange } from "../../lib/notifications";
import { revenueFromOrder, categoryRevenue, type OrderItem } from "../../lib/orderFinance";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Loader2, RefreshCw, TrendingUp, ShoppingBag, Landmark, WashingMachine, Truck, Gift, PieChart } from "lucide-react";
import { AdminOtherOrdersPanel } from "../../components/admin/AdminOtherOrdersPanel";

interface OrderRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: string;
  paymentMethod: string;
  paymentStatus?: string;
  tips: number;
  deliveryTip?: number;
  total: number;
  createdAt: string;
  items?: OrderItem[];
}

const VALID_STATUSES = ["pending", "cleaning", "ready", "delivered"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

const isValidStatus = (status: unknown): status is ValidStatus =>
  typeof status === "string" && VALID_STATUSES.includes(status as ValidStatus);

const normalizeOrder = (data: unknown): OrderRecord | null => {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  return {
    id: String(obj.id || "").substring(0, 100),
    name: String(obj.name || "").substring(0, 100),
    phone: String(obj.phone || "").substring(0, 20),
    address: String(obj.address || "").substring(0, 200),
    status: isValidStatus(obj.status) ? obj.status : "pending",
    paymentMethod: String(obj.paymentMethod || "").toLowerCase(),
    paymentStatus: obj.paymentStatus ? String(obj.paymentStatus).toLowerCase() : undefined,
    tips: typeof obj.tips === "number" ? Math.max(0, obj.tips) : 0,
    deliveryTip: typeof obj.deliveryTip === "number" ? Math.max(0, obj.deliveryTip) : 0,
    total: typeof obj.total === "number" ? Math.max(0, obj.total) : 0,
    createdAt: String(obj.createdAt || new Date().toISOString()),
    items: Array.isArray(obj.items) ? (obj.items as OrderItem[]) : undefined,
  };
};

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [services, setServices] = useState<{ id: string; category?: string }[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const [values, servicesData] = await Promise.all([
        dbGetByPrefix("order:"),
        dbGet("services"),
      ]);
      const normalized: OrderRecord[] = [];
      if (Array.isArray(values)) {
        for (const item of values) {
          const row = normalizeOrder(item);
          if (row) normalized.push(row);
        }
      }
      normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(normalized);
      if (servicesData && Array.isArray(servicesData)) {
        setServices(servicesData);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !isValidStatus(newStatus)) return;
    const updatedOrder = { ...order, status: newStatus };
    try {
      const full = (await dbGetByPrefix("order:")).find((o: { id?: string }) => o.id === orderId) as {
        userId?: string;
      } | undefined;
      await dbSet(`order:${orderId}`, updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      if (full?.userId && newStatus !== order.status) {
        await notifyOrderStatusChange(full.userId, orderId, newStatus);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, o) => acc + revenueFromOrder(o), 0);
    const startOfWeek = getStartOfWeek();
    const weeklyRevenue = orders
      .filter((o) => new Date(o.createdAt) >= startOfWeek)
      .reduce((acc, o) => acc + revenueFromOrder(o), 0);
    const customerTips = orders.reduce((acc, o) => acc + (revenueFromOrder(o) > 0 ? o.tips || 0 : 0), 0);
    const deliveryTips = orders.reduce(
      (acc, o) => acc + (revenueFromOrder(o) > 0 ? o.deliveryTip || 0 : 0),
      0
    );
    const byCategory = categoryRevenue(orders, services);
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const instapayPending = orders.filter(
      (o) => o.paymentMethod === "instapay" && (!o.paymentStatus || o.paymentStatus === "pending")
    ).length;
    return { totalRevenue, weeklyRevenue, customerTips, deliveryTips, byCategory, pendingOrders, instapayPending };
  }, [orders, services]);

  const recentOrders = orders.slice(0, 5);
  const categoryEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Overview</h1>
          <p className="text-gray-500">Weekly revenue, service categories, and delivery tips</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={fetchOrders} variant="outline" size="sm" className="h-10 px-4 gap-2">
            <RefreshCw className={`h-4 w-4 ${loadingOrders ? "animate-spin" : ""}`} />
            Sync
          </Button>
          <Button onClick={() => navigate("/staff/portal")} variant="outline" className="h-10 gap-2">
            <Truck className="h-4 w-4" /> Delivery app
          </Button>
          <Button onClick={() => navigate("/admin/services")} className="bg-blue-600 hover:bg-blue-700 h-10 px-4">
            Manage Services
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={ShoppingBag} label="Total Orders" value={String(orders.length)} color="blue" />
        <div 
          onClick={() => navigate("/admin/revenue")} 
          className="cursor-pointer transition-transform hover:scale-102 duration-200"
          title="Click to view full revenue history"
        >
          <StatCard
            icon={TrendingUp}
            label="Weekly Revenue"
            value={`${stats.weeklyRevenue.toLocaleString()} EGP`}
            color="green"
            sub="This week's payments only"
          />
        </div>
        <StatCard
          icon={Gift}
          label="Customer Tips"
          value={`${stats.customerTips.toLocaleString()} EGP`}
          color="purple"
        />
        <StatCard
          icon={Truck}
          label="Delivery Tips"
          value={`${stats.deliveryTips.toLocaleString()} EGP`}
          color="orange"
        />
        <StatCard icon={Landmark} label="Instapay Pending" value={String(stats.instapayPending)} color="purple" />
      </div>

      <AdminOtherOrdersPanel />

      {categoryEntries.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Revenue by Service Category</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoryEntries.map(([cat, amount]) => (
              <div
                key={cat}
                className="p-4 rounded-xl border dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30"
              >
                <p className="text-sm text-gray-500">{cat}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(amount).toLocaleString()} EGP</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Recent Orders</h2>
            <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => navigate("/admin/tracking")}>
              View All
            </Button>
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
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <Loader2 className="mx-auto animate-spin h-8 w-8 text-blue-600" />
                    </TableCell>
                  </TableRow>
                ) : recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                      <TableCell>
                        <div className="font-semibold text-gray-900 dark:text-white">{order.name}</div>
                        <div className="text-xs text-gray-500">{order.phone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : order.status === "ready"
                                ? "secondary"
                                : order.status === "cleaning"
                                  ? "outline"
                                  : "destructive"
                          }
                          className="px-2 py-0.5 rounded-md"
                        >
                          {String(order.status).toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-gray-900 dark:text-white">{order.total} EGP</TableCell>
                      <TableCell className="text-right">
                        <Select defaultValue={order.status} onValueChange={(val) => updateOrderStatus(order.id, val)}>
                          <SelectTrigger className="w-[120px] h-8 text-xs ml-auto shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Admin Quick Links</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-12 gap-3"
                onClick={() => navigate("/admin/payments")}
              >
                <Landmark className="h-5 w-5 text-gray-400" />
                Pending Payments & Other Pricing
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 gap-3"
                onClick={() => navigate("/admin/discounts")}
              >
                <Gift className="h-5 w-5 text-gray-400" />
                Promo Codes / Coupons
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 gap-3"
                onClick={() => navigate("/admin/services")}
              >
                <WashingMachine className="h-5 w-5 text-gray-400" />
                Add Service (per piece)
              </Button>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 text-sm text-orange-800 dark:text-orange-300">
            <p className="font-semibold mb-1">Pending laundry: {stats.pendingOrders}</p>
            <p>Set &quot;Other&quot; item prices under Pending Payments before confirming Instapay.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: string;
  color: "blue" | "green" | "orange" | "purple";
  sub?: string;
}) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
  };
  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{value}</h3>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
