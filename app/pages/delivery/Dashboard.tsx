import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { dbGetByPrefix, dbSet } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Loader2, MapPin, Phone, User, Package, Truck, Clock, Map, AlertCircle, CheckCircle2, CircleOff } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../../context/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

type Order = {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: "pending" | "cleaning" | "ready" | "delivering" | "delivered";
  paymentMethod: string;
  total: number;
  createdAt: string;
  pickupDate: string;
  pickupTime: string;
};

type GPSLocation = {
  lat: number;
  lng: number;
  timestamp: string;
};

export function DeliveryDashboard() {
  const { t } = useLanguage();
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"disconnected" | "connected" | "denied">("disconnected");
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const values = await dbGetByPrefix("order:");
      // Only show orders that are ready for delivery, delivering, or currently in progress
      const relevantOrders = values.filter((o: any) => 
        o.status === 'ready' || o.status === 'delivering' || o.status === 'delivered' || o.status === 'cleaning'
      );
      const sorted = relevantOrders.sort((a: Order, b: Order) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
    } catch (error) {
      console.error("Error fetching delivery orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || (role !== "delivery" && role !== "admin"))) {
      navigate("/admin-login");
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const deliveringOrder = orders.find(o => o.status === "delivering");
    if (!deliveringOrder) return;

    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await dbSet(`driver_location:${deliveringOrder.id}`, {
          lat: latitude,
          lng: longitude,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        console.error("Error watching position:", error);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [orders]);

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const updatedOrder: Order = { ...order, status: newStatus };
    try {
      await dbSet(`order:${orderId}`, updatedOrder);
      setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const toggleGPS = () => {
    if (gpsEnabled) {
      // Stop GPS
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setGpsEnabled(false);
      setGpsStatus("disconnected");
    } else {
      // Start GPS
      if (!navigator.geolocation) {
        setGpsStatus("denied");
        return;
      }

      const newWatchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const location: GPSLocation = {
            lat: latitude,
            lng: longitude,
            timestamp: new Date().toISOString()
          };
          setCurrentLocation(location);
          setGpsStatus("connected");
          await dbSet("driver_current_location", location);
          const allOrders = await dbGetByPrefix("order:");
          for (const o of allOrders.filter((x: Order) => x.status === "delivering")) {
            await dbSet(`driver_location:${o.id}`, location);
          }
        },
        (error) => {
          console.error("Error watching position:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setGpsStatus("denied");
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );

      setWatchId(newWatchId as unknown as number);
      setGpsEnabled(true);
    }
  };

  const activeDeliveries = orders.filter(o => o.status === 'ready' || o.status === 'delivering').length;

  return (
    <div className="space-y-8 min-h-screen pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Delivery Management</h1>
          <p className="text-gray-500">View and update active delivery status for dry cleaning orders.</p>
        </div>
        <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
           <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
           <div>
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300 uppercase tracking-wider">Ready to Deliver</p>
              <p className="text-xl font-bold text-blue-900 dark:text-white">{activeDeliveries}</p>
           </div>
        </div>
      </div>

      <Tabs defaultValue="my-location" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-location">
            <MapPin className="h-4 w-4 mr-2" />
            My Location
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Package className="h-4 w-4 mr-2" />
            Orders
          </TabsTrigger>
        </TabsList>

        {/* My Location Tab */}
        <TabsContent value="my-location" className="space-y-6 mt-6">
          <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-800 space-y-6">
            {/* GPS Status Card */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  {t.delivery?.myLocation || "My Location"}
                </h3>
                <div className="flex items-center gap-2">
                  {gpsStatus === "connected" && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">{t.delivery?.gpsConnected || "Connected"}</span>
                    </div>
                  )}
                  {gpsStatus === "disconnected" && (
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <CircleOff className="h-4 w-4" />
                      <span className="text-xs font-medium">{t.delivery?.gpsDisconnected || "Disconnected"}</span>
                    </div>
                  )}
                  {gpsStatus === "denied" && (
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">{t.delivery?.gpsDenied || "Permission Denied"}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={toggleGPS}
                className={gpsEnabled ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                size="lg"
                disabled={gpsStatus === "denied"}
              >
                {gpsEnabled ? `${t.delivery?.disableLocation || "Disable GPS Tracking"}` : `${t.delivery?.enableLocation || "Enable GPS Tracking"}`}
              </Button>
            </div>

            {/* Current Location Display */}
            {currentLocation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{t.delivery?.currentLocation || "Current Location"}</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.delivery?.latitude || "Latitude"}</p>
                    <p className="font-mono font-bold text-gray-900 dark:text-white">{currentLocation.lat.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.delivery?.longitude || "Longitude"}</p>
                    <p className="font-mono font-bold text-gray-900 dark:text-white">{currentLocation.lng.toFixed(6)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.delivery?.lastUpdated || "Last Updated"}: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </p>
              </motion.div>
            )}

            {/* Map Embed */}
            {currentLocation && (
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-96">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.lng - 0.01},${currentLocation.lat - 0.01},${currentLocation.lng + 0.01},${currentLocation.lat + 0.01}&layer=mapnik&marker=${currentLocation.lat},${currentLocation.lng}`}
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6 mt-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed dark:border-gray-800">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : orders.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
             {orders.map((order) => (
               <motion.div 
                 key={order.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="group relative rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-gray-900 dark:border-gray-800"
               >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === 'ready' ? 'secondary' : order.status === 'delivering' ? 'outline' : 'default'} className="uppercase font-mono text-[10px]">
                        {order.status}
                      </Badge>
                      {order.status === 'delivering' && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-gray-400">#{order.id.split('_')[1]}</p>
                  </div>
                 
                 <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                         <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{order.name}</p>
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                           <Phone className="h-3 w-3" /> {order.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
                         <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{order.address}</p>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3 dark:border-gray-800 mt-4">
                       <div className="flex flex-col">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Total</p>
                          <p className="font-bold text-gray-900 dark:text-white">{order.total} EGP</p>
                       </div>
                       <Select defaultValue={order.status} onValueChange={(val) => updateOrderStatus(order.id, val as any)}>
                         <SelectTrigger className="w-[120px] h-9 text-xs">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="ready">Ready</SelectItem>
                           <SelectItem value="delivering">Delivering</SelectItem>
                           <SelectItem value="delivered">Delivered</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                 </div>
               </motion.div>
             ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed dark:border-gray-800">
             <Package className="h-10 w-10 text-gray-300 mb-2" />
             <p className="text-gray-500 font-medium">No orders ready for delivery.</p>
          </div>
        )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
