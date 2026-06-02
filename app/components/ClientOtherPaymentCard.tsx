import { useState } from "react";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { dbSet } from "../lib/db";
import { markNotificationRead } from "../lib/notifications";
import type { OrderRecord } from "../lib/orderTypes";
import { useLanguage } from "../context/LanguageContext";
import { toast } from "sonner";
import { Loader2, Bell } from "lucide-react";

type Props = {
  order: OrderRecord;
  userId: string;
  notificationId?: string;
  instapayNumber?: string;
  onPaid: () => void;
};

export function ClientOtherPaymentCard({ order, userId, notificationId, instapayNumber, onPaid }: Props) {
  const { t } = useLanguage();
  const c = t.client;
  const [method, setMethod] = useState<"cash" | "instapay">("cash");
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    try {
      const updated: OrderRecord = {
        ...order,
        paymentMethod: method,
        paymentStatus: method === "cash" ? "confirmed" : "pending",
        awaitingClientPayment: false,
        total: order.total,
      };
      await dbSet(`order:${order.id}`, updated);
      if (notificationId) await markNotificationRead(userId, notificationId);
      toast.success(c.paymentChoiceSaved || "Payment method saved");
      onPaid();
    } catch {
      toast.error(c.paymentFailed || "Could not save payment choice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4 dark:bg-orange-900/20 dark:border-orange-700">
      <div className="flex items-start gap-2 mb-3">
        <Bell className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-orange-900 dark:text-orange-200">
            {c.otherPriceReady || "Your custom order price is ready"}
          </p>
          <p className="text-sm text-orange-800 dark:text-orange-300">
            {c.otherPriceAmount || "Amount"}: <strong>{order.total} EGP</strong> — {c.choosePayment || "Choose how to pay"}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">#{order.id.slice(-8)}</p>
      <RadioGroup value={method} onValueChange={(v) => setMethod(v as "cash" | "instapay")} className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="cash" id={`cash-${order.id}`} />
          <Label htmlFor={`cash-${order.id}`}>{c.payCash || "Cash on delivery"}</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="instapay" id={`insta-${order.id}`} disabled={!instapayNumber} />
          <Label htmlFor={`insta-${order.id}`} className={!instapayNumber ? "opacity-50" : ""}>
            Instapay {instapayNumber ? `(${instapayNumber})` : `(${c.instapayUnavailable || "not configured"})`}
          </Label>
        </div>
      </RadioGroup>
      <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={confirm} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : c.confirmPayment || "Confirm payment method"}
      </Button>
    </div>
  );
}
