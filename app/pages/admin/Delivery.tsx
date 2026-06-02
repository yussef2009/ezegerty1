import { useEffect, useState } from "react";
import { dbSet, dbGetByPrefix } from "../../lib/db";
import { listDeliveryDrivers } from "../../lib/deliveryProfile";
import type { OrderRecord } from "../../lib/orderTypes";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loader2, RefreshCw, Truck, Phone, MapPin, Package, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

export function AdminDelivery() {
  const { t } = useLanguage();
  const a = t.admin;
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [drivers, setDrivers] = useState<{ userId: string; name: string; phone: string; photoUrl?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDriverId, setAssignDriverId] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: "", phone: "", email: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const values = (await dbGetByPrefix("order:")) as OrderRecord[];
      const deliveryOrders = values.filter((o) =>
        ["ready", "delivering", "cleaning"].includes(o.status)
      );
      deliveryOrders.sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
      setOrders(deliveryOrders);
      setDrivers(await listDeliveryDrivers());
    } catch {
      toast.error("Failed to load delivery data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const assignOrder = async (orderId: string) => {
    const driverUserId = assignDriverId[orderId];
    const driver = drivers.find((d) => d.userId === driverUserId);
    if (!driver) {
      toast.error(a.selectDriver || "Select a driver");
      return;
    }
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const updated: OrderRecord = {
      ...order,
      assignedDriverUserId: driver.userId,
      assignedDriverName: driver.name,
      assignedDriverPhone: driver.phone,
      status: order.status === "cleaning" ? "ready" : order.status,
    };
    try {
      await dbSet(`order:${orderId}`, updated);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      toast.success(`${a.assignOrder}: ${driver.name}`);
    } catch {
      toast.error("Assign failed");
    }
  };

  const registerDriverHint = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `driver_${Date.now()}`;
    try {
      await dbSet(`delivery_profile:${id}`, {
        userId: id,
        name: driverForm.name,
        phone: driverForm.phone,
        email: driverForm.email,
        updatedAt: new Date().toISOString(),
      });
      const list = await listDeliveryDrivers();
      setDrivers(list);
      setIsDialogOpen(false);
      setDriverForm({ name: "", phone: "", email: "" });
      toast.success("Driver registered — they should log in and complete profile with photo");
    } catch {
      toast.error("Failed to register");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assign delivery orders</h1>
          <p className="text-gray-500 text-sm">
            Assign ready orders to drivers. Drivers see only their assignments on the delivery dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <UserPlus className="h-4 w-4" />
                Register driver
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register delivery driver</DialogTitle>
              </DialogHeader>
              <form onSubmit={registerDriverHint} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    required
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    required
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email (optional)</Label>
                  <Input
                    type="email"
                    value={driverForm.email}
                    onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Save
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-2xl">
          <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No orders ready for delivery assignment</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="flex justify-between mb-4">
                <Badge>{order.status.toUpperCase()}</Badge>
                <span className="text-xs font-mono text-gray-400">#{order.id.slice(-6)}</span>
              </div>
              <div className="space-y-3 text-sm">
                <p className="font-bold text-lg">{order.name}</p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" /> {order.phone}
                </p>
                <p className="flex items-start gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" /> {order.address}
                </p>
                <p className="flex items-center gap-2">
                  <Package className="h-4 w-4" /> {order.items?.length || 0} items · {order.total} EGP
                </p>
                {order.assignedDriverName && (
                  <p className="text-blue-600 font-medium">
                    Assigned: {order.assignedDriverName} ({order.assignedDriverPhone})
                  </p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Select
                  value={assignDriverId[order.id] || order.assignedDriverUserId || ""}
                  onValueChange={(v) => setAssignDriverId((prev) => ({ ...prev, [order.id]: v }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={a.selectDriver} />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No drivers yet — drivers save profile on first login
                      </SelectItem>
                    ) : (
                      drivers.map((dr) => (
                        <SelectItem key={dr.userId} value={dr.userId}>
                          {dr.name} · {dr.phone}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button onClick={() => assignOrder(order.id)} className="bg-blue-600 hover:bg-blue-700">
                  {a.assignDriver}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
