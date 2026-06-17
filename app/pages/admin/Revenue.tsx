import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { dbGetByPrefix, dbGet } from "../../lib/db";
import { revenueFromOrder, type OrderItem } from "../../lib/orderFinance";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Loader2, RefreshCw, Landmark, Calendar, ShoppingBag, ArrowLeft, ArrowUpRight, TrendingUp, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

const normalizeOrder = (data: unknown): OrderRecord | null => {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  return {
    id: String(obj.id || "").substring(0, 100),
    name: String(obj.name || "").substring(0, 100),
    phone: String(obj.phone || "").substring(0, 20),
    address: String(obj.address || "").substring(0, 200),
    status: String(obj.status || "pending"),
    paymentMethod: String(obj.paymentMethod || "").toLowerCase(),
    paymentStatus: obj.paymentStatus ? String(obj.paymentStatus).toLowerCase() : undefined,
    tips: typeof obj.tips === "number" ? Math.max(0, obj.tips) : 0,
    deliveryTip: typeof obj.deliveryTip === "number" ? Math.max(0, obj.deliveryTip) : 0,
    total: typeof obj.total === "number" ? Math.max(0, obj.total) : 0,
    createdAt: String(obj.createdAt || new Date().toISOString()),
    items: Array.isArray(obj.items) ? (obj.items as OrderItem[]) : undefined,
  };
};

export function AdminRevenue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeCategory, setTimeCategory] = useState<"week" | "month" | "year">("month");
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const values = await dbGetByPrefix("order:");
      const normalized: OrderRecord[] = [];
      if (Array.isArray(values)) {
        for (const item of values) {
          const row = normalizeOrder(item);
          if (row) normalized.push(row);
        }
      }
      normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(normalized);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  // Helper date parsing functions
  const getStartOfWeekStr = (dateStr: string): string => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start.toISOString().split("T")[0]; // YYYY-MM-DD representing the Monday
  };

  const getMonthStr = (dateStr: string): string => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`; // YYYY-MM
  };

  const getYearStr = (dateStr: string): string => {
    const d = new Date(dateStr);
    return String(d.getFullYear()); // YYYY
  };

  // Grouped Revenue Calculations
  const revenueGroups = useMemo(() => {
    const groups: Record<string, { label: string; revenue: number; orderCount: number; orders: OrderRecord[] }> = {};

    orders.forEach(order => {
      const rev = revenueFromOrder(order);
      // Skip unpaid orders if they yield 0 revenue
      if (rev <= 0) return;

      let key = "";
      let label = "";

      if (timeCategory === "week") {
        key = getStartOfWeekStr(order.createdAt);
        const monDate = new Date(key);
        const sunDate = new Date(monDate);
        sunDate.setDate(monDate.getDate() + 6);
        label = `Week of ${monDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${sunDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
      } else if (timeCategory === "month") {
        key = getMonthStr(order.createdAt);
        const [year, month] = key.split("-");
        label = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
      } else {
        key = getYearStr(order.createdAt);
        label = key;
      }

      if (!groups[key]) {
        groups[key] = { label, revenue: 0, orderCount: 0, orders: [] };
      }

      groups[key].revenue += rev;
      groups[key].orderCount += 1;
      groups[key].orders.push(order);
    });

    // Convert to array and sort descending by key
    return Object.entries(groups)
      .map(([key, value]) => ({
        key,
        ...value
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [orders, timeCategory]);

  // General Revenue Stats
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalOrdersCount = 0;
    
    orders.forEach(o => {
      const rev = revenueFromOrder(o);
      if (rev > 0) {
        totalRevenue += rev;
        totalOrdersCount += 1;
      }
    });

    const averageRevenue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    return {
      totalRevenue,
      totalOrdersCount,
      averageRevenue
    };
  }, [orders]);

  // Automatically select the first group when groups load, if none selected
  useEffect(() => {
    if (revenueGroups.length > 0 && !selectedGroupKey) {
      setSelectedGroupKey(revenueGroups[0].key);
    } else if (revenueGroups.length === 0) {
      setSelectedGroupKey(null);
    }
  }, [revenueGroups, selectedGroupKey]);

  const selectedGroup = useMemo(() => {
    return revenueGroups.find(g => g.key === selectedGroupKey) || null;
  }, [revenueGroups, selectedGroupKey]);

  const maxGroupRevenue = useMemo(() => {
    if (revenueGroups.length === 0) return 1;
    return Math.max(...revenueGroups.map(g => g.revenue));
  }, [revenueGroups]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Landmark className="h-8 w-8 text-blue-600" /> Revenue Reports
            </h1>
            <p className="text-gray-500">Historical earnings, payment breakdowns, and performance tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchOrders} variant="outline" size="sm" className="h-10 px-4 gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 p-6 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-24 w-24 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-500">All-Time Revenue</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalRevenue.toLocaleString()} <span className="text-sm font-normal text-gray-400">EGP</span>
          </h3>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> Confirmed payments only
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 p-6 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform">
            <ShoppingBag className="h-24 w-24 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-500">Paid Orders Count</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalOrdersCount} <span className="text-sm font-normal text-gray-400">orders</span>
          </h3>
          <p className="text-xs text-gray-400 mt-2">
            Excludes unpaid / pending Instapay orders
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 p-6 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform">
            <Calendar className="h-24 w-24 text-purple-600" />
          </div>
          <p className="text-sm font-medium text-gray-500">Average Revenue per Order</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {Math.round(stats.averageRevenue).toLocaleString()} <span className="text-sm font-normal text-gray-400">EGP</span>
          </h3>
          <p className="text-xs text-gray-400 mt-2">
            Order ticket size average
          </p>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left column: Breakdowns list */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b dark:border-gray-800">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Earnings Category</h2>
              <div className="w-[120px]">
                <Select value={timeCategory} onValueChange={(val) => { setTimeCategory(val as any); setSelectedGroupKey(null); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-sm">Calculating revenues...</span>
              </div>
            ) : revenueGroups.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Landmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-sm">No confirmed revenue found</p>
                <p className="text-xs mt-1">Revenues will appear when orders are paid.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {revenueGroups.map((group) => {
                  const isSelected = group.key === selectedGroupKey;
                  const pct = (group.revenue / maxGroupRevenue) * 100;
                  return (
                    <div
                      key={group.key}
                      onClick={() => setSelectedGroupKey(group.key)}
                      className={`
                        p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 relative overflow-hidden
                        ${isSelected 
                          ? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800 shadow-sm" 
                          : "bg-gray-50/30 border-gray-100 hover:bg-gray-50 dark:bg-gray-800/20 dark:border-gray-800/80"}
                      `}
                    >
                      {/* CSS progress indicator background bar */}
                      <div 
                        className="absolute bottom-0 left-0 top-0 bg-blue-600/5 dark:bg-blue-400/5 transition-all duration-500 pointer-events-none"
                        style={{ width: `${pct}%` }}
                      />
                      
                      <div className="flex justify-between items-start z-10">
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">{group.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{group.orderCount} paid orders</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-blue-600 dark:text-blue-400">
                            {group.revenue.toLocaleString()} EGP
                          </p>
                          <span className="text-xs text-gray-400">Revenue</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Grouped orders details */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : !selectedGroup ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <Calendar className="h-16 w-16 mb-4 opacity-20" />
                <p className="font-semibold text-base">Select an interval</p>
                <p className="text-xs max-w-xs mt-1">Select any time period from the left panel to inspect the contributing orders and invoices.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                  <div>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">{selectedGroup.label} Details</h2>
                    <p className="text-xs text-gray-500">Detailed list of paid transactions during this period</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {selectedGroup.revenue.toLocaleString()}
                    </span>
                    <span className="text-xs block text-gray-400">EGP Confirmed</span>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedGroup.orders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                          <TableCell>
                            <div className="font-semibold text-gray-900 dark:text-white">{order.name}</div>
                            <div className="text-xs text-gray-400 font-mono">#{order.id.slice(-8)}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(order.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge className="capitalize px-2 py-0.5 rounded text-xs" variant="outline">
                              {order.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-gray-900 dark:text-white">
                            {revenueFromOrder(order).toLocaleString()} EGP
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
