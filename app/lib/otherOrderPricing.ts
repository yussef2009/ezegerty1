import { dbSet } from "./db";
import { addUserNotification } from "./notifications";
import type { OrderRecord, OrderItem } from "./orderTypes";

export function applyOtherLinePrice(order: OrderRecord, finalTotal: number): OrderRecord {
  const { paymentMethod: _removed, ...rest } = order;
  let updated: OrderRecord = {
    ...rest,
    total: finalTotal,
    otherPriceSet: true,
    awaitingClientPayment: true,
    paymentStatus: "pending",
    priceByAdmin: true,
  };
  if (updated.items?.length) {
    const otherIndexes = updated.items.map((item, i) => (item.isOther ? i : -1)).filter((i) => i >= 0);
    if (otherIndexes.length === 1) {
      const idx = otherIndexes[0];
      const catalogSubtotal = updated.items
        .filter((item) => !item.isOther)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
      const otherLineTotal = Math.max(0, finalTotal - catalogSubtotal);
      updated.items = updated.items.map((item, i) =>
        i === idx ? { ...item, price: otherLineTotal } : item
      );
    }
  }
  return updated;
}

export async function publishOtherPriceToClient(order: OrderRecord, finalTotal: number): Promise<OrderRecord> {
  const updated = applyOtherLinePrice(order, finalTotal);
  await dbSet(`order:${order.id}`, updated);
  if (order.userId) {
    await addUserNotification(order.userId, {
      type: "other_price_ready",
      orderId: order.id,
      title: "Custom order price ready",
      message: `Your order total is ${finalTotal} EGP. Please choose Cash or Instapay.`,
      amount: finalTotal,
    });
  }
  return updated;
}
