import { DeliveryDashboard } from "../delivery/Dashboard";

/** Delivery driver tools embedded in admin (same GPS + orders UI). */
export function AdminDeliveryDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-sm text-gray-500 mb-4">
        Manage live deliveries and GPS from admin. Drivers use the same tools at{" "}
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">/delivery/dashboard</code>.
      </p>
      <DeliveryDashboard />
    </div>
  );
}
