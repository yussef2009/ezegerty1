import { dbGet, dbSet } from "./db";

export type AppNotification = {
  id: string;
  type: "other_price_ready" | "order_update" | "general";
  orderId?: string;
  title: string;
  message: string;
  amount?: number;
  read: boolean;
  createdAt: string;
};

export async function addUserNotification(
  userId: string,
  payload: Omit<AppNotification, "id" | "read" | "createdAt">
): Promise<void> {
  if (!userId) return;
  const key = `notifications:${userId}`;
  const existing = ((await dbGet(key)) as AppNotification[] | null) || [];
  const item: AppNotification = {
    ...payload,
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await dbSet(key, [item, ...existing].slice(0, 100));
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const key = `notifications:${userId}`;
  const existing = ((await dbGet(key)) as AppNotification[] | null) || [];
  await dbSet(
    key,
    existing.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
  );
}
