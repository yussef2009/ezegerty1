/** Session flag after staff login + secret code verification */
export const STAFF_PORTAL_KEY = "staff_portal_verified";

export type StaffPortal = "admin" | "delivery";

const DEFAULT_ADMIN_CODE = "EzgAdmin#2026!K9mX7pL2";
const DEFAULT_DELIVERY_CODE = "EzgDrv#2026!R4nQ8wZ5";

export function getAdminAccessCode(): string {
  return (import.meta.env.VITE_ADMIN_ACCESS_CODE as string | undefined)?.trim() || DEFAULT_ADMIN_CODE;
}

export function getDeliveryAccessCode(): string {
  return (import.meta.env.VITE_DELIVERY_ACCESS_CODE as string | undefined)?.trim() || DEFAULT_DELIVERY_CODE;
}

export function verifyAdminCode(input: string): boolean {
  return input.trim() === getAdminAccessCode();
}

export function verifyDeliveryCode(input: string): boolean {
  return input.trim() === getDeliveryAccessCode();
}

export function setStaffPortal(portal: StaffPortal): void {
  sessionStorage.setItem(STAFF_PORTAL_KEY, portal);
}

export function getStaffPortal(): StaffPortal | null {
  const v = sessionStorage.getItem(STAFF_PORTAL_KEY);
  return v === "admin" || v === "delivery" ? v : null;
}

export function clearStaffPortal(): void {
  sessionStorage.removeItem(STAFF_PORTAL_KEY);
}

export function isAdminPortalVerified(): boolean {
  return getStaffPortal() === "admin";
}

export function isDeliveryPortalVerified(): boolean {
  return getStaffPortal() === "delivery";
}
