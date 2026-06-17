import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Plus, Trash2, X, Sparkles, Loader2, Edit2, Zap } from "lucide-react";
import { dbGet, dbSet } from "../../lib/db";
import { toast } from "sonner";

type ServiceAllowance = { serviceId: string; serviceName: string; qty: number };

type Plan = {
  id: string;
  name: string;
  price: number;
  interval: "weekly" | "monthly" | "yearly" | "pieces";
  features: string;
  discountPercent?: number;
  freePieces?: number;
  freeServices?: number;
  priorityDelivery?: boolean;
  firstDeliveryFree?: boolean;
  includedServices?: ServiceAllowance[];
  fastPickupIncluded?: boolean;
};

type Service = {
  id: string;
  name: string;
  price: number;
  description: string;
  category?: string;
};

export function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    interval: "monthly",
    features: "",
    discountPercent: "",
    freePieces: "",
    freeServices: "",
    priorityDelivery: false,
    firstDeliveryFree: false,
  });

  const [selectedServices, setSelectedServices] = useState<{ [serviceId: string]: number }>({});
  const [fastPickupIncluded, setFastPickupIncluded] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const plansData = await dbGet("plans");
      if (plansData) setPlans(plansData || []);
      const servicesData = await dbGet("services");
      if (servicesData) setAvailableServices(servicesData || []);
    } catch (error) {
      toast.error("Failed to load plans or services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async () => {
    if (!newPlan.name || !newPlan.price) {
      toast.error("Please fill in plan name and price");
      return;
    }

    const allowances: ServiceAllowance[] = Object.keys(selectedServices).map((id) => {
      const svc = availableServices.find((s) => s.id === id);
      return {
        serviceId: id,
        serviceName: svc?.name || "Unknown Service",
        qty: selectedServices[id],
      };
    });

    const planData: Plan = {
      id: editingPlanId || Math.random().toString(36).substr(2, 9),
      name: newPlan.name,
      price: parseFloat(newPlan.price),
      interval: newPlan.interval as Plan["interval"],
      features: newPlan.features,
      discountPercent: newPlan.discountPercent ? parseFloat(newPlan.discountPercent) : undefined,
      freePieces: newPlan.freePieces ? parseInt(newPlan.freePieces, 10) : undefined,
      freeServices: newPlan.freeServices ? parseInt(newPlan.freeServices, 10) : undefined,
      priorityDelivery: newPlan.priorityDelivery,
      firstDeliveryFree: newPlan.firstDeliveryFree,
      includedServices: allowances,
      fastPickupIncluded,
    };

    let updated: Plan[];
    if (editingPlanId) {
      updated = plans.map((p) => (p.id === editingPlanId ? planData : p));
    } else {
      updated = [...plans, planData];
    }

    try {
      await dbSet("plans", updated);
      setPlans(updated);
      resetForm();
      toast.success(editingPlanId ? "Subscription plan updated" : "Subscription plan created");
    } catch (e) {
      toast.error("Save failed");
    }
  };

  const startEdit = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setNewPlan({
      name: plan.name,
      price: String(plan.price),
      interval: plan.interval,
      features: plan.features,
      discountPercent: plan.discountPercent ? String(plan.discountPercent) : "",
      freePieces: plan.freePieces ? String(plan.freePieces) : "",
      freeServices: plan.freeServices ? String(plan.freeServices) : "",
      priorityDelivery: !!plan.priorityDelivery,
      firstDeliveryFree: !!plan.firstDeliveryFree,
    });

    const mapped: { [id: string]: number } = {};
    if (plan.includedServices) {
      plan.includedServices.forEach((allowance) => {
        mapped[allowance.serviceId] = allowance.qty;
      });
    }
    setSelectedServices(mapped);
    setFastPickupIncluded(!!plan.fastPickupIncluded);
    setIsAdding(true);
  };

  const resetForm = () => {
    setNewPlan({
      name: "",
      price: "",
      interval: "monthly",
      features: "",
      discountPercent: "",
      freePieces: "",
      freeServices: "",
      priorityDelivery: false,
      firstDeliveryFree: false,
    });
    setSelectedServices({});
    setFastPickupIncluded(false);
    setEditingPlanId(null);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    const updated = plans.filter((p) => p.id !== id);
    try {
      await dbSet("plans", updated);
      setPlans(updated);
      toast.success("Plan removed");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  if (isAdding) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={resetForm}>
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingPlanId ? "Edit Premium Plan" : "Create Premium Plan"}
          </h2>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border dark:border-gray-800 shadow-lg space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Name</label>
              <Input
                placeholder="e.g. Platinum"
                className="h-12"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pricing Interval</label>
              <select
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={newPlan.interval}
                onChange={(e) => setNewPlan({ ...newPlan, interval: e.target.value })}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="pieces">Pay per piece (no subscription)</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Price (EGP)</label>
            <Input
              type="number"
              placeholder="0.00"
              className="h-12 text-lg font-bold"
              value={newPlan.price}
              onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Extra discount %</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newPlan.discountPercent}
                onChange={(e) => setNewPlan({ ...newPlan, discountPercent: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Free pieces / month (Legacy)</label>
              <Input
                type="number"
                min={0}
                value={newPlan.freePieces}
                onChange={(e) => setNewPlan({ ...newPlan, freePieces: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Free services / month (Legacy, total count)</label>
              <Input
                type="number"
                min={0}
                value={newPlan.freeServices}
                onChange={(e) => setNewPlan({ ...newPlan, freeServices: e.target.value })}
              />
            </div>
          </div>

          {/* Included Services Selector */}
          <div className="space-y-2 border-t pt-4 dark:border-gray-800">
            <label className="text-sm font-semibold block text-gray-800 dark:text-gray-200">
              Specific Included Services & Quantities (per cycle)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Check services and assign their limit for this subscription period.
            </p>
            <div className="grid gap-3 max-h-48 overflow-y-auto border rounded-md p-3 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              {availableServices.map((service) => {
                const isChecked = selectedServices[service.id] !== undefined;
                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-4 py-1 border-b last:border-0 dark:border-gray-800"
                  >
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedServices({ ...selectedServices, [service.id]: 1 });
                          } else {
                            const updated = { ...selectedServices };
                            delete updated[service.id];
                            setSelectedServices(updated);
                          }
                        }}
                      />
                      <span className="font-medium">{service.name}</span>
                    </label>
                    {isChecked && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Allowance:</span>
                        <Input
                          type="number"
                          min="1"
                          className="w-16 h-8 text-center text-xs dark:bg-gray-800 dark:border-gray-700"
                          value={selectedServices[service.id] || 1}
                          onChange={(e) => {
                            setSelectedServices({
                              ...selectedServices,
                              [service.id]: Math.max(1, parseInt(e.target.value) || 1),
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {availableServices.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No services available to select.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 border-t pt-4 dark:border-gray-800">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newPlan.priorityDelivery}
                onChange={(e) => setNewPlan({ ...newPlan, priorityDelivery: e.target.checked })}
              />
              Priority delivery
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newPlan.firstDeliveryFree}
                onChange={(e) => setNewPlan({ ...newPlan, firstDeliveryFree: e.target.checked })}
              />
              First delivery free
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer font-semibold text-blue-600 dark:text-blue-400 w-full mt-2">
              <input
                type="checkbox"
                checked={fastPickupIncluded}
                onChange={(e) => setFastPickupIncluded(e.target.checked)}
              />
              <Zap className="h-4 w-4 inline mr-1" />
              Include Fast Pickup Free (⚡)
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Included Features (text-based list)</label>
            <Input
              placeholder="One feature per line"
              className="h-12"
              value={newPlan.features}
              onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
            />
            <p className="text-[10px] text-gray-400">One feature per line (shown on home page marketing card)</p>
          </div>
          <Button onClick={handleAdd} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
            {editingPlanId ? "Update Subscription Plan" : "Publish Subscription Plan"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-gray-500 text-sm">Create value for recurring business clients</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700 h-10 gap-2">
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed">
            <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No premium plans available yet.</p>
          </div>
        ) : (
          plans.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-8 shadow-sm relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button size="icon" variant="ghost" className="text-blue-500 h-8 w-8" onClick={() => startEdit(p)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-red-500 h-8 w-8" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{p.name}</h3>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black text-gray-900 dark:text-white">{p.price}</span>
                <span className="text-gray-500 ml-1">EGP / {p.interval}</span>
              </div>

              {(p.discountPercent || p.freePieces || p.priorityDelivery || p.fastPickupIncluded || (p.includedServices && p.includedServices.length > 0)) && (
                <div className="text-xs text-blue-600 mb-4 space-y-1 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border dark:border-blue-900">
                  {p.discountPercent ? <div>• {p.discountPercent}% extra discount on orders</div> : null}
                  {p.freePieces ? <div>• {p.freePieces} free pieces / month</div> : null}
                  {p.freeServices ? <div>• {p.freeServices} free services / month</div> : null}
                  {p.priorityDelivery ? <div>• Priority delivery service</div> : null}
                  {p.firstDeliveryFree ? <div>• First delivery is completely free</div> : null}
                  {p.fastPickupIncluded ? (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Zap className="h-3 w-3 fill-amber-500 text-amber-500" /> Free Fast Pickup Included
                    </div>
                  ) : null}
                  {p.includedServices && p.includedServices.length > 0 ? (
                    <div className="pt-1 border-t dark:border-blue-800">
                      <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Service allowances:</div>
                      {p.includedServices.map((allowance, idx) => (
                        <div key={idx} className="text-gray-600 dark:text-gray-400 ml-2">
                          – {allowance.qty} × {allowance.serviceName}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
              <ul className="space-y-3 mb-8">
                {p.features
                  .split(/\n|,/)
                  .filter(Boolean)
                  .map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {f.trim()}
                    </li>
                  ))}
              </ul>

              <Button
                variant="outline"
                className="w-full rounded-xl border-blue-100 dark:border-gray-800 text-blue-600 pointer-events-none"
              >
                Plan Active
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
