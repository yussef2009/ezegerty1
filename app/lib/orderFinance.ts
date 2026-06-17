export type Discount = {
  id: string;
  code: string;
  amount: number;
  type: "percentage" | "fixed";
  benefitKind?: "percentage" | "fixed" | "free" | "free_pieces" | "free_service" | "priority_delivery";
  freePieces?: number;
};

export type OrderItem = {
  serviceId: string;
  name: string;
  quantity: number;
  price: number;
  isOther?: boolean;
  otherDescription?: string;
  category?: string;
};

export function applyCoupon(subtotal: number, discount: Discount | null): number {
  if (!discount || subtotal <= 0) return subtotal;
  const kind = discount.benefitKind || discount.type;
  if (kind === "free") return 0;
  if (kind === "percentage" || discount.type === "percentage") {
    return Math.max(0, subtotal - (subtotal * discount.amount) / 100);
  }
  return Math.max(0, subtotal - discount.amount);
}

export function orderSubtotal(items: OrderItem[] = []): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function revenueFromOrder(order: {
  total?: number;
  paymentStatus?: string;
  paymentMethod?: string;
}): number {
  const paid =
    order.paymentStatus === "confirmed" ||
    order.paymentMethod === "cash" ||
    (!order.paymentStatus && order.paymentMethod !== "instapay");
  return paid ? order.total || 0 : 0;
}

export function categoryRevenue(
  orders: { items?: OrderItem[]; paymentStatus?: string; paymentMethod?: string; total?: number }[],
  services: { id: string; category?: string }[]
): Record<string, number> {
  const serviceCat = new Map(services.map((s) => [s.id, s.category || "Uncategorized"]));
  const out: Record<string, number> = {};

  for (const order of orders) {
    if (!order.items?.length) continue;
    const paid = revenueFromOrder(order) > 0;
    if (!paid) continue;
    const orderTotal = order.total || 0;
    const sub = orderSubtotal(order.items);
    if (sub <= 0) continue;

    for (const item of order.items) {
      const cat =
        item.category ||
        (item.isOther ? "Other" : serviceCat.get(item.serviceId) || "Uncategorized");
      const line = item.price * item.quantity;
      const share = (line / sub) * orderTotal;
      out[cat] = (out[cat] || 0) + share;
    }
  }
  return out;
}

export function getBillingCycleStartDate(startedAt: string, interval: "weekly" | "monthly" | "yearly" | "pieces"): Date {
  const start = new Date(startedAt);
  const now = new Date();
  
  if (interval === "weekly") {
    const oneWeekMs = 604800000;
    const diff = now.getTime() - start.getTime();
    if (diff < 0) return start;
    const cycleStartMs = start.getTime() + Math.floor(diff / oneWeekMs) * oneWeekMs;
    return new Date(cycleStartMs);
  }
  
  if (interval === "monthly") {
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), start.getDate());
    if (cycleStart > now) {
      cycleStart.setMonth(cycleStart.getMonth() - 1);
    }
    return cycleStart;
  }
  
  if (interval === "yearly") {
    const cycleStart = new Date(now.getFullYear(), start.getMonth(), start.getDate());
    if (cycleStart > now) {
      cycleStart.setFullYear(cycleStart.getFullYear() - 1);
    }
    return cycleStart;
  }
  
  return start;
}

