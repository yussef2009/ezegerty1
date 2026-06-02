import { useEffect, useState } from "react";
import { dbGetByPrefix } from "../../lib/db";
import { publishOtherPriceToClient } from "../../lib/otherOrderPricing";
import type { OrderRecord } from "../../lib/orderTypes";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";

export function AdminOtherOrdersPanel() {
  const { t } = useLanguage();
  const a = t.admin;
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const all = (await dbGetByPrefix("order:")) as OrderRecord[];
    setOrders(
      all.filter(
        (o) =>
          o.priceByAdmin &&
          !o.otherPriceSet &&
          (o.paymentStatus === "pending" || !o.paymentStatus || o.total === 0)
      )
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const sendPrice = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const amount = prices[orderId];
    if (!order || !amount || amount <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    try {
      await publishOtherPriceToClient(order, amount);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success(a.priceSent);
    } catch {
      toast.error("Failed");
    }
  };

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
  }
  if (orders.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border p-6 shadow-sm">
      <h2 className="font-bold text-lg mb-4">{a.otherPricing}</h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="flex flex-col sm:flex-row gap-3 sm:items-center border-b pb-4 last:border-0">
            <div className="flex-1">
              <p className="font-medium">{order.name}</p>
              <p className="text-xs text-gray-500">#{order.id.slice(-8)}</p>
            </div>
            <Input
              type="number"
              min={0}
              className="w-32"
              placeholder="EGP"
              value={prices[order.id] ?? ""}
              onChange={(e) =>
                setPrices((p) => ({ ...p, [order.id]: parseFloat(e.target.value) || 0 }))
              }
            />
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => sendPrice(order.id)}>
              {a.sendPriceToClient}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
