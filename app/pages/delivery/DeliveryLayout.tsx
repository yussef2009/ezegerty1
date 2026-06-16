import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { isDeliveryPortalVerified, clearStaffPortal } from "../../lib/staffAccess";
import { Button } from "../../components/ui/button";
import { LogOut, Truck, MapPin, Package } from "lucide-react";

export function DeliveryLayout() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const devBypass =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("dev") === "1";

  useEffect(() => {
    if (loading || devBypass) return;
    if (!user) {
      navigate("/admin-login");
      return;
    }
    if (role !== "admin" && role !== "delivery") {
      navigate("/client/dashboard");
      return;
    }
    if (!isDeliveryPortalVerified()) {
      navigate("/staff/portal");
    }
  }, [user, role, loading, navigate, devBypass]);

  const handleSignOut = async () => {
    clearStaffPortal();
    await signOut();
    navigate("/admin-login");
  };

  if (!devBypass && (loading || !user || !isDeliveryPortalVerified())) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/delivery/dashboard" className="flex items-center gap-2 font-bold text-green-700 dark:text-green-400">
            <Truck className="h-5 w-5" />
            Ezgerty Delivery
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/delivery/dashboard">
              <Button variant="ghost" size="sm" className="gap-1">
                <Package className="h-4 w-4" /> Orders
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="gap-1 text-red-600" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
