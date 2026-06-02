/// <reference types="vite/client" />
import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  Tag, 
  Sparkles, 
  WashingMachine, 
  Truck, 
  LogOut, 
  Bell,
  Menu,
  X,
  User as UserIcon,
  Landmark,
  Settings2
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../../components/ui/dropdown-menu";
import { Badge } from "../../components/ui/badge";

export function AdminLayout() {
  const { user, signOut, role, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Development bypass: append ?dev=1 to the URL to view admin pages without auth in dev
  const devBypass = import.meta.env.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dev") === "1";
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && (!user || role !== "admin") && !devBypass) {
      navigate("/admin-login");
    }
  }, [user, role, loading, navigate, devBypass]);

  if (!devBypass && (loading || (!user || role !== "admin"))) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Clients", path: "/admin/clients", icon: Users },
    { name: "Delivery Tracking", path: "/admin/tracking", icon: Truck },
    { name: "Delivery Dashboard", path: "/admin/delivery-dashboard", icon: Truck },
    { name: "Assign Deliveries", path: "/admin/delivery", icon: Truck },
    { name: "Services Stats", path: "/admin/services-dashboard", icon: Sparkles },
    { name: "Manage Services", path: "/admin/services", icon: WashingMachine },
    { name: "Premium Plans", path: "/admin/plans", icon: Sparkles },
    { name: "Promo Codes", path: "/admin/discounts", icon: Tag },
    { name: "Pending Payments", path: "/admin/payments", icon: Landmark },
    { name: "Payment Settings", path: "/admin/settings", icon: Settings2 },
    { name: "Business Requests", path: "/admin/business-requests", icon: Users },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin-login");
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-white dark:bg-gray-900 border-r dark:border-gray-800 transition-all duration-300 flex flex-col z-50
      `}>
        <div className="p-6 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold">E</span>
            </div>
            {isSidebarOpen && <span className="font-bold text-xl tracking-tight">Ezgerty</span>}
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1" 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}
                `}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t dark:border-gray-800">
          <Button 
            variant="ghost" 
            className="w-full flex items-center gap-3 justify-start px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isSidebarOpen && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-800 flex items-center justify-between px-8">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">
            {menuItems.find(item => item.path === location.pathname)?.name || "Dashboard"}
          </h2>

          <div className="flex items-center gap-4">
            {/* Notification Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-gray-400">0</Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 text-center text-sm text-gray-500">
                  <p>No notifications</p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="hidden sm:inline font-medium text-sm">Admin</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}