import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { LayoutDashboard, Truck, Loader2, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  verifyAdminCode,
  verifyDeliveryCode,
  setStaffPortal,
  getStaffPortal,
} from "../../lib/staffAccess";

export function StaffPortalChoice() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [adminCode, setAdminCode] = useState("");
  const [deliveryCode, setDeliveryCode] = useState("");
  const [submitting, setSubmitting] = useState<"admin" | "delivery" | null>(null);

  const canAdmin = role === "admin";
  const canDelivery = role === "admin" || role === "delivery";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/admin-login");
      return;
    }
    const portal = getStaffPortal();
    if (portal === "admin" && canAdmin) {
      navigate("/admin/dashboard");
    } else if (portal === "delivery" && canDelivery) {
      navigate("/delivery/dashboard");
    }
  }, [user, role, loading, navigate, canAdmin, canDelivery]);

  const enterAdmin = () => {
    if (!canAdmin) {
      toast.error("This account is not authorized for admin.");
      return;
    }
    if (!verifyAdminCode(adminCode)) {
      toast.error("Invalid admin access code");
      return;
    }
    setSubmitting("admin");
    setStaffPortal("admin");
    navigate("/admin/dashboard");
  };

  const enterDelivery = () => {
    if (!canDelivery) {
      toast.error("This account is not authorized for delivery.");
      return;
    }
    if (!verifyDeliveryCode(deliveryCode)) {
      toast.error("Invalid delivery access code");
      return;
    }
    setSubmitting("delivery");
    setStaffPortal("delivery");
    navigate("/delivery/dashboard");
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-indigo-600 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff portal</h1>
          <p className="text-sm text-gray-500 mt-1">Choose your workspace and enter the access code</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-lg">Admin dashboard</h2>
            </div>
            <p className="text-sm text-gray-500">Orders, clients, payments, services</p>
            {!canAdmin ? (
              <p className="text-sm text-amber-600">Not available for this account.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Lock className="h-3 w-3" /> Admin secret code
                  </Label>
                  <Input
                    type="password"
                    placeholder="Enter admin code"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    disabled={submitting !== null}
                  />
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={enterAdmin}
                  disabled={!adminCode || submitting !== null}
                >
                  {submitting === "admin" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter admin"}
                </Button>
              </>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              <h2 className="font-bold text-lg">Delivery app</h2>
            </div>
            <p className="text-sm text-gray-500">GPS tracking and assigned deliveries</p>
            {!canDelivery ? (
              <p className="text-sm text-amber-600">Not available for this account.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Lock className="h-3 w-3" /> Delivery secret code
                  </Label>
                  <Input
                    type="password"
                    placeholder="Enter delivery code"
                    value={deliveryCode}
                    onChange={(e) => setDeliveryCode(e.target.value)}
                    disabled={submitting !== null}
                  />
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={enterDelivery}
                  disabled={!deliveryCode || submitting !== null}
                >
                  {submitting === "delivery" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter delivery"}
                </Button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Signed in as {user.email}.{" "}
          <button type="button" className="underline" onClick={() => navigate("/admin-login")}>
            Use another account
          </button>
        </p>
      </div>
    </div>
  );
}
