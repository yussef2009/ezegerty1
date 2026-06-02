import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Loader2, Landmark, Save } from "lucide-react";
import { dbGet, dbSet } from "../../lib/db";
import { toast } from "sonner";

export function AdminSettings() {
  const [instapayNumber, setInstapayNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await dbGet("instapay_account");
        if (data?.number) setInstapayNumber(data.number);
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
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
      toast.error("Failed to save");
    } finally {
      setSaving(false);
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
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Landmark className="h-7 w-7 text-blue-600" />
          Payment Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure Instapay for pending payment verification on the Pending Payments page.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-800 space-y-4">
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
        <Button onClick={save} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>
    </div>
  );
}
