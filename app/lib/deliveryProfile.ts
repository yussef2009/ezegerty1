import { dbGet, dbSet, dbGetByPrefix } from "./db";

export type DeliveryProfile = {
  userId: string;
  name: string;
  phone: string;
  photoUrl?: string;
  updatedAt: string;
};

export type DeliveryDriverRegistry = DeliveryProfile & { email?: string };

export function deliveryProfileKey(userId: string): string {
  return `delivery_profile:${userId}`;
}

export async function getDeliveryProfile(userId: string): Promise<DeliveryProfile | null> {
  if (!userId) return null;
  return (await dbGet(deliveryProfileKey(userId))) as DeliveryProfile | null;
}

export async function saveDeliveryProfile(profile: DeliveryProfile): Promise<void> {
  await dbSet(deliveryProfileKey(profile.userId), profile);
  const list = ((await dbGet("delivery_drivers")) as DeliveryDriverRegistry[] | null) || [];
  const next = list.filter((d) => d.userId !== profile.userId);
  next.push({ ...profile });
  await dbSet("delivery_drivers", next);
}

export async function listDeliveryDrivers(): Promise<DeliveryDriverRegistry[]> {
  const fromList = ((await dbGet("delivery_drivers")) as DeliveryDriverRegistry[] | null) || [];
  if (fromList.length > 0) return fromList;
  const profiles = await dbGetByPrefix("delivery_profile:");
  return profiles as DeliveryDriverRegistry[];
}

export function isProfileComplete(p: DeliveryProfile | null): boolean {
  return !!(p?.name?.trim() && p?.phone?.trim());
}
