import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Loader2, Landmark, Save, Settings, Zap } from "lucide-react";
import { dbGet, dbSet } from "../../lib/db";
import { toast } from "sonner";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";

export function AdminSettings() {
  const [instapayNumber, setInstapayNumber] = useState("");
  const [fastPickupEnabled, setFastPickupEnabled] = useState(false);
  const [fastPickupPrice, setFastPickupPrice] = useState<number>(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFastPickup, setSavingFastPickup] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [instapayData, fastPickupData] = await Promise.all([
          dbGet("instapay_account"),
          dbGet("fast_pickup_settings"),
        ]);
        if (instapayData?.number) setInstapayNumber(instapayData.number);
        if (fastPickupData) {
          setFastPickupEnabled(!!fastPickupData.enabled);
          setFastPickupPrice(fastPickupData.price != null ? Number(fastPickupData.price) : 50);
        }
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveInstapay = async () => {
    const trimmed = instapayNumber.trim();
    if (!trimmed) {
      toast.error("Enter a valid Instapay phone number");
      return;
    }
    setSaving(true);
    try {
      await dbSet("instapay_account", { number: trimmed });
      toast.success("Instapay number saved. Clients will see it at checkout.");
    } catch {
      toast.error("Failed to save Instapay settings");
    } finally {
      setSaving(false);
    }
  };

  const saveFastPickup = async () => {
    if (fastPickupPrice < 0) {
      toast.error("Price cannot be negative");
      return;
    }
    setSavingFastPickup(true);
    try {
      await dbSet("fast_pickup_settings", {
        enabled: fastPickupEnabled,
        price: fastPickupPrice,
      });
      toast.success("Fast pickup settings saved. Clients will see it in checkout options.");
    } catch {
      toast.error("Failed to save Fast Pickup settings");
    } finally {
      setSavingFastPickup(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="h-7 w-7 text-blue-600" />
          System Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure payment integrations, service fees, and express pickup availability.
        </p>
      </div>

      {/* Payment Settings Card */}
      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-800 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Landmark className="h-5 w-5 text-blue-600" />
          Payment Settings
        </h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">Instapay phone number</label>
          <Input
            placeholder="01xxxxxxxxx"
            value={instapayNumber}
            onChange={(e) => setInstapayNumber(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Shown to customers who choose Instapay on the order page.
          </p>
        </div>
        <Button onClick={saveInstapay} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Payment Settings
        </Button>
      </div>

      {/* Fast Pickup Options Card */}
      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-800 space-y-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Fast Pickup Settings
        </h2>
        
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 bg-gray-50/50 dark:bg-gray-800/20 dark:border-gray-800">
          <div className="space-y-0.5">
            <Label htmlFor="fast-pickup-toggle" className="text-sm font-medium">Fast Pickup Availability</Label>
            <p className="text-xs text-gray-500">
              Enable or disable the same-day express pickup option for customers.
            </p>
          </div>
          <Switch
            id="fast-pickup-toggle"
            checked={fastPickupEnabled}
            onCheckedChange={setFastPickupEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fast-pickup-price" className="text-sm font-medium">Fast Pickup Fee (EGP)</Label>
          <Input
            id="fast-pickup-price"
            type="number"
            min="0"
            placeholder="50"
            value={fastPickupPrice}
            onChange={(e) => setFastPickupPrice(Number(e.target.value) || 0)}
            disabled={!fastPickupEnabled}
          />
          <p className="text-xs text-gray-500 font-normal">
            This fee is added to the order total when a customer selects Fast Pickup.
          </p>
        </div>

        <Button onClick={saveFastPickup} disabled={savingFastPickup} className="gap-2 bg-blue-600 hover:bg-blue-700">
          {savingFastPickup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Fast Pickup Settings
        </Button>
      </div>
    </div>
  );
}
