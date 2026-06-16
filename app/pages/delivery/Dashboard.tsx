import { useEffect, useState, useCallback, useRef } from "react";
import { dbGetByPrefix, dbSet } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import {
  Loader2,
  MapPin,
  Phone,
  User,
  Package,
  Truck,
  Map,
  AlertCircle,
  CheckCircle2,
  CircleOff,
  CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../../context/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { DeliveryProfileGate } from "../../components/DeliveryProfileGate";
import {
  getDeliveryProfile,
  saveDeliveryProfile,
  isProfileComplete,
  type DeliveryProfile,
} from "../../lib/deliveryProfile";
import type { OrderRecord } from "../../lib/orderTypes";

type GPSLocation = { lat: number; lng: number; timestamp: string };

export function DeliveryDashboard() {
  const { t } = useLanguage();
  const d = t.delivery;
  const { user, role } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [gpsProfilePrompt, setGpsProfilePrompt] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"disconnected" | "connected" | "denied">("disconnected");
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const gpsActiveRef = useRef(false);
  const [deliveryTips, setDeliveryTips] = useState<Record<string, number>>({});
  const [mapKey, setMapKey] = useState(0);

  const userId = user?.id || "anonymous";

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    const p = await getDeliveryProfile(userId);
    setProfile(p);
    setProfileLoading(false);
  }, [userId]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const values = (await dbGetByPrefix("order:")) as OrderRecord[];
      const relevant = values.filter((o) =>
        ["ready", "delivering", "delivered", "cleaning"].includes(o.status)
      );
      const filtered =
        role === "admin"
          ? relevant
          : relevant.filter(
              (o) => !o.assignedDriverUserId || o.assignedDriverUserId === userId
            );
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(filtered);
    } catch (error) {
      console.error("Error fetching delivery orders:", error);
    } finally {
      setLoading(false);
    }
  }, [role, userId]);

  useEffect(() => {
    if (user) {
      loadProfile();
      fetchOrders();
    }
  }, [user, loadProfile, fetchOrders]);

  useEffect(() => {
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        gpsActiveRef.current = false;
      }
    };
  }, []);

  const syncLocation = useCallback(
    async (location: GPSLocation) => {
      setCurrentLocation(location);
      setMapKey((k) => k + 1);
      await dbSet("driver_current_location", {
        ...location,
        driverUserId: userId,
        driverName: profile?.name,
        driverPhone: profile?.phone,
      });
      const delivering = orders.filter((o) => o.status === "delivering");
      for (const o of delivering) {
        await dbSet(`driver_location:${o.id}`, {
          ...location,
          driverName: profile?.name,
          driverPhone: profile?.phone,
        });
      }
    },
    [orders, profile, userId]
  );

  const stopGpsWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    gpsActiveRef.current = false;
    setGpsEnabled(false);
    setGpsStatus("disconnected");
  }, []);

  const startGpsWatch = useCallback(() => {
    if (gpsActiveRef.current) return;
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const location: GPSLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
        };
        setGpsStatus("connected");
        syncLocation(location);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus("denied");
          stopGpsWatch();
        }
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 }
    );
    watchIdRef.current = id;
    gpsActiveRef.current = true;
    setGpsEnabled(true);
  }, [syncLocation, stopGpsWatch]);

  const toggleGPS = () => {
    if (gpsActiveRef.current) {
      stopGpsWatch();
      return;
    }
    if (!isProfileComplete(profile)) {
      setGpsProfilePrompt(true);
      return;
    }
    startGpsWatch();
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderRecord["status"]) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const tip = deliveryTips[orderId] ?? order.deliveryTip ?? 0;
    const updated: OrderRecord = {
      ...order,
      status: newStatus,
      driverName: profile?.name || order.driverName,
      ...(newStatus === "delivering" ? { assignedDriverUserId: userId, assignedDriverName: profile?.name } : {}),
      ...(newStatus === "delivered"
        ? { deliveredAt: new Date().toISOString(), deliveryTip: tip > 0 ? tip : order.deliveryTip }
        : {}),
    };
    try {
      await dbSet(`order:${orderId}`, updated);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (newStatus === "delivering" && gpsEnabled && currentLocation) {
        await dbSet(`driver_location:${orderId}`, { ...currentLocation, driverName: profile?.name });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const markDelivered = (orderId: string) => updateOrderStatus(orderId, "delivered");

  const onProfileSaved = async (p: DeliveryProfile) => {
    await saveDeliveryProfile(p);
    setProfile(p);
    const openGpsAfter = gpsProfilePrompt;
    setGpsProfilePrompt(false);
    if (openGpsAfter) startGpsWatch();
  };

  if (profileLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isProfileComplete(profile)) {
    return (
      <DeliveryProfileGate
        userId={userId}
        initial={profile}
        onSave={onProfileSaved}
      />
    );
  }

  const activeDeliveries = orders.filter((o) => o.status === "ready" || o.status === "delivering").length;

  return (
    <div className="space-y-8 min-h-screen pb-12">
      {gpsProfilePrompt && (
        <DeliveryProfileGate
          userId={userId}
          initial={profile}
          requireForGps
          onSave={onProfileSaved}
          title={d.profileForGps}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 dark:border-gray-800">
        <div className="flex items-center gap-4">
          {profile?.photoUrl ? (
            <img src={profile.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover border-2 border-blue-200" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-7 w-7 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.name}</h1>
            <p className="text-sm text-gray-500">{profile?.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
          <Truck className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-xs font-medium text-blue-800 dark:text-blue-300 uppercase">{d.assignedToYou}</p>
            <p className="text-xl font-bold text-blue-900 dark:text-white">{activeDeliveries}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-location" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-location">
            <MapPin className="h-4 w-4 mr-2" />
            {d.myLocation}
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Package className="h-4 w-4 mr-2" />
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-location" className="space-y-6 mt-6">
          <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-800 space-y-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  {d.myLocation}
                </h3>
                {gpsStatus === "connected" && (
                  <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                    <CheckCircle2 className="h-4 w-4" /> {d.gpsConnected}
                  </span>
                )}
                {gpsStatus === "disconnected" && (
                  <span className="flex items-center gap-1 text-gray-500 text-xs">
                    <CircleOff className="h-4 w-4" /> {d.gpsDisconnected}
                  </span>
                )}
                {gpsStatus === "denied" && (
                  <span className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="h-4 w-4" /> {d.gpsDenied}
                  </span>
                )}
              </div>
              <Button
                type="button"
                onClick={toggleGPS}
                className={gpsEnabled ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                size="lg"
                disabled={gpsStatus === "denied" && !gpsEnabled}
              >
                {gpsEnabled ? d.disableLocation : d.enableLocation}
              </Button>
            </div>

            {currentLocation && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <p className="text-xs text-gray-500">
                  {d.lastUpdated}: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </p>
                <div className="rounded-lg overflow-hidden border h-96">
                  <iframe
                    key={mapKey}
                    title={d.liveMap}
                    width="100%"
                    height="100%"
                    frameBorder={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.lng - 0.008},${currentLocation.lat - 0.008},${currentLocation.lng + 0.008},${currentLocation.lat + 0.008}&layer=mapnik&marker=${currentLocation.lat},${currentLocation.lng}`}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 mt-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-gray-500">{d.noAssignedOrders}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900 dark:border-gray-800"
                >
                  <div className="flex justify-between mb-3">
                    <Badge variant={order.status === "delivered" ? "default" : "secondary"}>{order.status}</Badge>
                    <span className="text-xs font-mono text-gray-400">#{order.id.slice(-6)}</span>
                  </div>
                  <p className="font-bold">{order.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" /> {order.phone}
                  </p>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{order.address}</p>
                  <p className="font-bold mt-2">{order.total} EGP</p>

                  <div className="mt-4 space-y-2 border-t pt-3 dark:border-gray-800">
                    <Select
                      value={order.status}
                      onValueChange={(val) => updateOrderStatus(order.id, val as OrderRecord["status"])}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="delivering">Delivering</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Delivery tip"
                      className="h-8"
                      value={deliveryTips[order.id] ?? order.deliveryTip ?? ""}
                      onChange={(e) =>
                        setDeliveryTips((prev) => ({
                          ...prev,
                          [order.id]: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                    {order.status !== "delivered" && (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => markDelivered(order.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {d.markDelivered}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
