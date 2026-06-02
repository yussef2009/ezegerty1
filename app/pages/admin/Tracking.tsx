import { useEffect, useState, useCallback } from "react";
import { Loader2, MapPin, Truck, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { dbGet, dbGetByPrefix } from "../../lib/db";

type DriverOnMap = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "delivering" | "idle";
  orderId?: string;
  customerName?: string;
  lastUpdate: string;
};

export function AdminTracking() {
  const [drivers, setDrivers] = useState<DriverOnMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DriverOnMap | null>(null);

  const fetchLiveLocations = useCallback(async () => {
    setLoading(true);
    try {
      const list: DriverOnMap[] = [];
      const orders = await dbGetByPrefix("order:");
      const delivering = orders.filter((o: { status?: string }) => o.status === "delivering");

      for (const order of delivering) {
        const loc = await dbGet(`driver_location:${order.id}`);
        if (loc?.lat != null && loc?.lng != null) {
          list.push({
            id: order.id,
            name: order.driverName || "Delivery driver",
            lat: loc.lat,
            lng: loc.lng,
            status: "delivering",
            orderId: order.id,
            customerName: order.name,
            lastUpdate: loc.timestamp || new Date().toISOString(),
          });
        }
      }

      const current = await dbGet("driver_current_location");
      if (current?.lat != null && current?.lng != null) {
        const already = list.some((d) => d.id === "driver-current");
        if (!already) {
          list.push({
            id: "driver-current",
            name: "Driver (GPS active)",
            lat: current.lat,
            lng: current.lng,
            status: delivering.length > 0 ? "delivering" : "idle",
            lastUpdate: current.timestamp || new Date().toISOString(),
          });
        }
      }

      const driverRecords = await dbGetByPrefix("driver:");
      for (const rec of driverRecords) {
        if (rec?.name && !list.some((d) => d.name === rec.name)) {
          const loc = current?.lat != null ? current : null;
          if (loc) {
            list.push({
              id: rec.id || rec.email,
              name: rec.name,
              lat: loc.lat,
              lng: loc.lng,
              status: "idle",
              lastUpdate: loc.timestamp || new Date().toISOString(),
            });
          }
        }
      }

      setDrivers(list);
      setSelected((prev) => {
        if (list.length === 0) return null;
        if (prev && list.some((d) => d.id === prev.id)) return prev;
        return list[0];
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveLocations();
    const interval = setInterval(fetchLiveLocations, 8000);
    return () => clearInterval(interval);
  }, [fetchLiveLocations]);

  const mapDriver = selected || drivers[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="h-7 w-7 text-blue-600" />
            Live Driver GPS
          </h1>
          <p className="text-sm text-gray-500">
            Real locations from delivery drivers (enable GPS on the delivery app).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLiveLocations} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && drivers.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="rounded-xl border bg-orange-50 dark:bg-orange-900/10 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-orange-600 mx-auto mb-3" />
          <p className="font-medium text-orange-900 dark:text-orange-200">No GPS signal yet</p>
          <p className="text-sm text-orange-800 dark:text-orange-300 mt-2 max-w-md mx-auto">
            Ask the driver to open <strong>/delivery/dashboard</strong>, go to <strong>My Location</strong>, enable GPS, and set an order to <strong>Delivering</strong>.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-2">
            {drivers.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelected(d)}
                className={`w-full text-left rounded-lg border p-4 transition-colors ${
                  selected?.id === d.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "bg-white dark:bg-gray-900 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">{d.name}</span>
                  <Badge variant={d.status === "delivering" ? "default" : "secondary"}>
                    {d.status}
                  </Badge>
                </div>
                {d.customerName && (
                  <p className="text-xs text-gray-500 mt-1">Customer: {d.customerName}</p>
                )}
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  {d.lat.toFixed(5)}, {d.lng.toFixed(5)}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Updated {new Date(d.lastUpdate).toLocaleTimeString()}
                </p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 rounded-xl border overflow-hidden bg-white dark:bg-gray-900 dark:border-gray-800 h-[480px]">
            {mapDriver && (
              <iframe
                title="Driver map"
                width="100%"
                height="100%"
                className="border-0"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapDriver.lng - 0.02},${mapDriver.lat - 0.02},${mapDriver.lng + 0.02},${mapDriver.lat + 0.02}&layer=mapnik&marker=${mapDriver.lat},${mapDriver.lng}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
