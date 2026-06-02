import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { dbGet, dbGetByPrefix } from "../lib/db";
import { Search, Package, Truck, CheckCircle, Clock, MapPin, RefreshCw, ChevronLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";

const DRIVER_IMAGE = "https://images.unsplash.com/photo-1762712393981-e14cf0ac9f7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMGRyaXZlciUyMG1hbiUyMHNtaWxpbmclMjB1bmlmb3JtfGVufDF8fHx8MTc3MjM0MjYzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export function Tracker() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!order || order.status !== "delivering") {
      setDriverLocation(null);
      return;
    }

    const fetchLocation = async () => {
      try {
        const loc = await dbGet(`driver_location:${order.id}`);
        if (loc && loc.lat && loc.lng) {
          setDriverLocation({ lat: loc.lat, lng: loc.lng });
        }
      } catch (err) {
        console.error("Error fetching driver location:", err);
      }
    };

    // Initial fetch
    fetchLocation();
    // Auto-refresh every 3 seconds
    const interval = setInterval(fetchLocation, 3000);
    return () => clearInterval(interval);
  }, [order]);

  // Auto-refresh order status every 5 seconds
  useEffect(() => {
    if (!order) return;

    const refreshOrder = async () => {
      try {
        const updatedOrder = await dbGet(`order:${order.id}`);
        if (updatedOrder) {
          setOrder(updatedOrder);
        }
      } catch (err) {
        console.error("Error auto-refreshing order:", err);
      }
    };

    const interval = setInterval(refreshOrder, 5000);
    return () => clearInterval(interval);
  }, [order?.id]);


  const fetchOrder = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const value = await dbGet(`order:${id}`);
      if (value) {
        setOrder(value);
      } else {
        setError("Order not found. Please check your Order ID.");
      }
    } catch (err) {
      setError("An error occurred while tracking your order.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestOrder = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const values = await dbGetByPrefix("order:");
      const userOrders = values.filter((o: any) => o.userId === user.id || o.userEmail === user.email);
      if (userOrders.length > 0) {
        const latest = userOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        setOrder(latest);
        setValue("orderId", latest.id);
      }
    } catch (err) {
      console.error("Error fetching latest order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const orderIdParam = searchParams.get("id");
    if (orderIdParam) {
      setValue("orderId", orderIdParam);
      fetchOrder(orderIdParam);
    } else if (user) {
      fetchLatestOrder();
    }
  }, [searchParams, setValue, user]);

  const onSubmit = (data: any) => {
    fetchOrder(data.orderId);
  };

  const handleManualRefresh = async () => {
    if (!order) return;
    setRefreshing(true);
    try {
      await fetchOrder(order.id);
    } finally {
      setRefreshing(false);
    }
  };

  const steps = [
    { status: "pending", label: "Order Received", icon: Clock },
    { status: "cleaning", label: "Cleaning in Progress", icon: Package },
    { status: "ready", label: "Ready for Pickup/Delivery", icon: CheckCircle },
    { status: "delivering", label: "Out for Delivery", icon: Truck },
    { status: "delivered", label: "Delivered", icon: CheckCircle },
  ];

  const getCurrentStep = (status: string) => {
    return steps.findIndex(s => s.status === status);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-950">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Track Your Order</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Enter your Order ID to see the current status.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_350px]">
          {/* Main Status Column */}
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900 dark:border dark:border-gray-800">
              <form onSubmit={handleSubmit(onSubmit)} className="mb-8 flex gap-2">
                <Input
                  placeholder="Enter Order ID (e.g., ord_12345)"
                  {...register("orderId", { required: true })}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Searching..." : <Search className="h-4 w-4" />}
                </Button>
                {order && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                )}
              </form>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              {order && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="mb-6 flex items-center justify-between border-b pb-4 dark:border-gray-800">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
                      <p className="font-mono font-medium text-gray-900 dark:text-white">{order.id}</p>
                    </div>
                    <Badge variant="outline" className="text-lg uppercase">
                      {order.status}
                    </Badge>
                  </div>

                  <div className="relative space-y-8 pl-8 before:absolute before:left-3 before:top-2 before:h-full before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
                    {steps.map((step, index) => {
                      const currentStepIndex = getCurrentStep(order.status);
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;

                      return (
                        <div key={step.status} className="relative">
                          <div className={`absolute -left-11 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900 ${isCompleted ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`}>
                            <step.icon className={`h-3 w-3 text-white`} />
                          </div>
                          <div className={`${isCompleted ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>
                            <h3 className={`font-medium ${isCurrent ? "text-blue-600 dark:text-blue-400" : ""}`}>{step.label}</h3>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 border-t pt-4 dark:border-gray-800">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Items</p>
                        <p className="font-medium text-gray-900 dark:text-white">{order.itemsCount || "Standard Order"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium text-gray-900 dark:text-white">{order.total ? `${order.total} EGP` : "-"}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Side Column - Driver & Location */}
          {order && (
            <div className="space-y-6">
               <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900 dark:border dark:border-gray-800"
               >
                  <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Delivery Details</h3>
                  
                  {order.status === "delivering" || order.status === "delivered" ? (
                    <>
                      <div className="mb-6 flex items-center gap-4">
                        <img 
                          src={DRIVER_IMAGE} 
                          alt="Driver" 
                          className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{order.driverName || "Your driver"}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Delivery Associate</p>
                          <div className="mt-1 flex items-center text-xs text-yellow-500">
                            ★★★★★ (4.9)
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                           <MapPin className="h-4 w-4" />
                           {order.status === "delivered" ? "Delivered" : "Live Location"}
                        </div>
                        {order.status === "delivering" && driverLocation ? (
                          <div className="relative h-48 w-full overflow-hidden rounded-md border dark:border-gray-700">
                            <iframe
                              title="Driver Live Location"
                              width="100%"
                              height="100%"
                              className="border-0"
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${driverLocation.lng - 0.003}%2C${driverLocation.lat - 0.003}%2C${driverLocation.lng + 0.003}%2C${driverLocation.lat + 0.003}&layer=mapnik&marker=${driverLocation.lat}%2C${driverLocation.lng}`}
                            />
                          </div>
                        ) : order.status === "delivering" ? (
                          <div className="flex h-48 w-full flex-col items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                            Waiting for driver GPS signal...
                          </div>
                        ) : (
                          <div className="flex h-48 w-full flex-col items-center justify-center rounded-md bg-green-50 text-xs text-green-700 dark:bg-green-950/20 dark:text-green-400 font-semibold">
                            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                            Order delivered successfully!
                          </div>
                        )}
                        {order.status === "delivering" && (
                          <p className="mt-2 text-xs text-center text-gray-500">
                            Status: <span className="font-semibold text-blue-600 dark:text-blue-400 animate-pulse">Out for Delivery</span>
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 dark:text-gray-500">
                      <Truck className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-700" />
                      <p className="text-sm font-medium">Tracking is not active yet</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Live GPS tracking begins when your driver leaves the laundry center.</p>
                    </div>
                  )}
               </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
