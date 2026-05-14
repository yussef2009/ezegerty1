import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Loader2, Package, MapPin, Truck, CheckCircle, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

type OrderStatus = "pending" | "cleaning" | "ready" | "delivered";

type OrderDetails = {
  id: string;
  status: OrderStatus;
  driverName?: string;
  driverLat?: number;
  driverLng?: number;
  createdAt: string;
};

// Simulated driver movement
const MAP_CENTER = { lat: 31.2001, lng: 29.9187 };

export function TrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState("");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [driverPos, setDriverPos] = useState({ lat: 31.205, lng: 29.92 });

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  useEffect(() => {
    if (order?.status === 'cleaning' || order?.status === 'ready') {
      const interval = setInterval(() => {
        setDriverPos(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001
        }));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [order]);

  const fetchOrder = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/kv/get/order:${id}`, {
        headers: { "Authorization": `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data) {
        setOrder(data);
      } else {
        setOrder(null);
        // alert("Order not found");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchId) navigate(`/track/${searchId}`);
  };

  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 1;
      case 'cleaning': return 2;
      case 'ready': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-950 md:p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        
        {/* Search Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm dark:bg-gray-900 border dark:border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Track Your Order</h1>
          <div className="flex gap-2">
            <Input 
              placeholder="Enter Order ID (e.g. ord_...)" 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <Button onClick={handleSearch}>Track</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : order ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm dark:bg-gray-900 border dark:border-gray-800 space-y-8"
          >
            <div className="flex items-center justify-between border-b pb-4 dark:border-gray-800">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-mono font-bold text-lg">{order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Placed On</p>
                <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Status Steps */}
            <div className="relative">
              <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -translate-y-1/2 rounded dark:bg-gray-800" />
              <div 
                className="absolute left-0 top-1/2 h-1 bg-green-500 -translate-y-1/2 rounded transition-all duration-500" 
                style={{ width: `${(getStatusStep(order.status) - 1) * 33}%` }} 
              />
              
              <div className="relative flex justify-between">
                {['Pending', 'Cleaning', 'On Way', 'Delivered'].map((step, idx) => {
                  const isActive = getStatusStep(order.status) > idx;
                  const isCurrent = getStatusStep(order.status) === idx + 1;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        isActive || isCurrent ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-800'
                      }`}>
                        {idx === 0 && <Clock className="h-4 w-4" />}
                        {idx === 1 && <Package className="h-4 w-4" />}
                        {idx === 2 && <Truck className="h-4 w-4" />}
                        {idx === 3 && <CheckCircle className="h-4 w-4" />}
                      </div>
                      <span className={`text-xs font-medium ${isActive || isCurrent ? 'text-green-600' : 'text-gray-500'}`}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Driver Map */}
            {(order.status === 'ready' || order.status === 'cleaning' || order.status === 'delivered') && (
              <div className="rounded-xl overflow-hidden border bg-gray-100 relative h-[300px] dark:bg-gray-800 dark:border-gray-700">
                <div className="absolute inset-0 opacity-30 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_Alexandria.jpg')] bg-cover bg-center" />
                
                {/* Driver Marker */}
                <motion.div
                  className="absolute flex flex-col items-center"
                  animate={{
                    x: (driverPos.lng - MAP_CENTER.lng) * 10000 + 150,
                    y: -(driverPos.lat - MAP_CENTER.lat) * 10000 + 150
                  }}
                  transition={{ duration: 2, ease: "linear" }}
                >
                  <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg z-10 border-2 border-white">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="bg-white px-2 py-1 rounded shadow text-xs mt-1 font-bold whitespace-nowrap dark:text-black">
                    Driver
                  </div>
                </motion.div>

                <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-sm backdrop-blur text-sm dark:bg-gray-900/90 dark:text-white">
                  <p className="font-semibold">Your Driver</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop" alt="Driver" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">Ahmed Hassan</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> 5 mins away
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </motion.div>
        ) : orderId ? (
           <div className="text-center py-12 text-gray-500">Order not found. Please check the ID.</div>
        ) : (
          <div className="text-center py-12 text-gray-500">Enter an Order ID to start tracking.</div>
        )}
      </div>
    </div>
  );
}
