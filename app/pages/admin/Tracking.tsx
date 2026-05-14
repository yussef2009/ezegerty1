import { useState, useEffect } from "react";
import { 
  Loader2, 
  MapPin, 
  Truck, 
  Search, 
  Phone, 
  MessageSquare, 
  Navigation,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "../../components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "../../components/ui/tabs";

// Simulated Alexandria coordinates
const MAP_CENTER = { lat: 31.2001, lng: 29.9187 };

type Driver = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "idle" | "delivering" | "pickup" | "offline";
  currentOrder?: string;
  phone: string;
  lastUpdate: string;
  battery: number;
};

export function AdminTracking() {
  const [drivers, setDrivers] = useState<Driver[]>([
    { 
      id: "d1", 
      name: "Ahmed Hassan", 
      lat: 31.205, 
      lng: 29.92, 
      status: "delivering", 
      currentOrder: "#ORD-123", 
      phone: "01012345678", 
      lastUpdate: new Date().toISOString(),
      battery: 85
    },
    { 
      id: "d2", 
      name: "Mohamed Ali", 
      lat: 31.195, 
      lng: 29.91, 
      status: "pickup", 
      currentOrder: "#ORD-456", 
      phone: "01122233344", 
      lastUpdate: new Date().toISOString(),
      battery: 42
    },
    { 
      id: "d3", 
      name: "Sayed Ibrahim", 
      lat: 31.21, 
      lng: 29.93, 
      status: "idle", 
      phone: "01255566677", 
      lastUpdate: new Date().toISOString(),
      battery: 98
    },
    { 
      id: "d4", 
      name: "Khaled Saeed", 
      lat: 31.18, 
      lng: 29.89, 
      status: "offline", 
      phone: "01588899900", 
      lastUpdate: new Date(Date.now() - 3600000).toISOString(),
      battery: 12
    }
  ]);
  
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers(prev => prev.map(d => {
        if (d.status === 'idle' || d.status === 'offline') return d;
        // Move towards center or randomly
        return {
          ...d,
          lat: d.lat + (Math.random() - 0.5) * 0.0005,
          lng: d.lng + (Math.random() - 0.5) * 0.0005,
          lastUpdate: new Date().toISOString()
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivering': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pickup': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'idle': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'offline': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Real-Time Driver Tracking</h2>
          <p className="text-sm text-gray-500">Monitor active deliveries and logistics in Alexandria</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search drivers..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setSelectedDriver(null)}>
            Reset View
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Panel: Drivers List */}
        <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2">
          {filteredDrivers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-xl border dark:bg-gray-900 dark:border-gray-800">
              No drivers match search
            </div>
          ) : (
            filteredDrivers.map(driver => (
              <Card 
                key={driver.id} 
                className={`cursor-pointer transition-all hover:border-blue-500 ${selectedDriver?.id === driver.id ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                onClick={() => setSelectedDriver(driver)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">{driver.name}</CardTitle>
                    <Badge variant="outline" className={getStatusColor(driver.status)}>
                      {driver.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Updated {new Date(driver.lastUpdate).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {driver.currentOrder ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 font-medium">
                      <Truck className="h-4 w-4" /> Order: {driver.currentOrder}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-400">No active order</div>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Navigation className="h-3 w-3" /> {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
                    </span>
                    <span className={`font-medium ${driver.battery < 20 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                      🔋 {driver.battery}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Right Panel: Map View (Simulated) */}
        <div className="lg:col-span-3 rounded-2xl border bg-gray-100 overflow-hidden relative h-[700px] dark:bg-gray-800 shadow-inner">
          {/* Simulated Map Background */}
          <div 
            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center grayscale opacity-40" 
            style={{ mixBlendMode: 'multiply' }}
          />
          
          {/* Overlay Map Labels (Simulated) */}
          <div className="absolute top-1/4 left-1/4 bg-white/80 dark:bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold z-0 backdrop-blur-sm">CORNICHE ROAD</div>
          <div className="absolute bottom-1/3 right-1/4 bg-white/80 dark:bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold z-0 backdrop-blur-sm">SMOUHA DISTRICT</div>
          <div className="absolute top-1/2 left-1/2 bg-white/80 dark:bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold z-0 backdrop-blur-sm">SIDI GABER</div>

          {/* Map Grid Lines */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ 
              backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', 
              backgroundSize: '30px 30px' 
            }} 
          />
          
          {/* Driver Markers */}
          {drivers.map(driver => (
            <motion.div
              key={driver.id}
              className={`absolute flex flex-col items-center cursor-pointer z-10 ${driver.status === 'offline' ? 'opacity-40' : 'opacity-100'}`}
              initial={{ x: 0, y: 0 }}
              animate={{
                // Enhanced projection for Alexandria area
                x: (driver.lng - MAP_CENTER.lng) * 15000 + 400, 
                y: -(driver.lat - MAP_CENTER.lat) * 15000 + 350
              }}
              transition={{ duration: 3, ease: "linear" }}
              onClick={() => setSelectedDriver(driver)}
            >
              <div className={`
                ${driver.id === selectedDriver?.id ? 'ring-4 ring-blue-400 ring-offset-2 scale-110' : ''}
                ${driver.status === 'delivering' ? 'bg-green-600' : 
                  driver.status === 'pickup' ? 'bg-blue-600' : 
                  driver.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'} 
                text-white p-2.5 rounded-full shadow-2xl transition-all duration-300
              `}>
                <Truck className="h-5 w-5" />
              </div>
              <div className="bg-white/95 dark:bg-gray-900/95 px-2 py-1 rounded shadow-lg text-[10px] mt-1 font-bold whitespace-nowrap border dark:border-gray-700">
                {driver.name.split(' ')[0]}
              </div>
            </motion.div>
          ))}
          
          {/* Floating Driver Info Card */}
          {selectedDriver && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border dark:border-gray-700 z-20 overflow-hidden"
            >
              <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${selectedDriver.status === 'offline' ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`} />
                  <h3 className="font-bold">{selectedDriver.name}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDriver(null)}>
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Active Order</span>
                  <span className="font-medium text-blue-600">{selectedDriver.currentOrder || "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium">{selectedDriver.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Battery</span>
                  <span className={`font-medium ${selectedDriver.battery < 20 ? 'text-red-500' : 'text-green-600'}`}>
                    {selectedDriver.battery}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t dark:border-gray-800">
                  <Button size="sm" className="w-full">
                    <Phone className="h-4 w-4 mr-2" /> Call
                  </Button>
                  <Button size="sm" variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" /> Message
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Map Controls */}
          <div className="absolute top-6 right-6 flex flex-col gap-2">
            <div className="bg-white/90 dark:bg-gray-900/90 p-1.5 rounded-lg shadow-lg border dark:border-gray-700 flex flex-col gap-1 backdrop-blur-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8">+</Button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8">-</Button>
            </div>
            <div className="bg-white/90 dark:bg-gray-900/90 p-1.5 rounded-lg shadow-lg border dark:border-gray-700 backdrop-blur-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 hidden lg:flex items-center gap-4 bg-white/90 dark:bg-gray-900/90 p-3 rounded-xl shadow-lg border dark:border-gray-700 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-600" />
              <span className="text-xs font-medium">Delivering</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-600" />
              <span className="text-xs font-medium">Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-xs font-medium">Idle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-400" />
              <span className="text-xs font-medium">Offline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
