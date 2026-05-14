import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Plus, Trash2, X, Sparkles, Loader2 } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { toast } from "sonner";

type Plan = {
  id: string;
  name: string;
  price: number;
  interval: "monthly" | "yearly";
  features: string;
};

export function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: "", price: "", interval: "monthly", features: "" });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/kv/get/plans`, {
        headers: { "Authorization": `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.value) setPlans(data.value || []);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleAdd = async () => {
    if (!newPlan.name || !newPlan.price) return;
    const newItem: Plan = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlan.name,
      price: parseFloat(newPlan.price),
      interval: newPlan.interval as "monthly" | "yearly",
      features: newPlan.features
    };
    const updated = [...plans, newItem];
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/kv/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ key: "plans", value: updated })
      });
      setPlans(updated);
      setNewPlan({ name: "", price: "", interval: "monthly", features: "" });
      setIsAdding(false);
      toast.success("Subscription plan created");
    } catch (e) {
      toast.error("Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    const updated = plans.filter(p => p.id !== id);
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/kv/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ key: "plans", value: updated })
      });
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
          <Button variant="ghost" onClick={() => setIsAdding(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Premium Plan</h2>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border dark:border-gray-800 shadow-lg space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Name</label>
              <Input 
                placeholder="e.g. Platinum" 
                className="h-12"
                value={newPlan.name} 
                onChange={e => setNewPlan({...newPlan, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pricing Interval</label>
              <select 
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={newPlan.interval}
                onChange={(e: any) => setNewPlan({...newPlan, interval: e.target.value})}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
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
              onChange={e => setNewPlan({...newPlan, price: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Included Features</label>
            <Input 
              placeholder="e.g. Unlimited pickup, 10% off, Priority support" 
              className="h-12"
              value={newPlan.features} 
              onChange={e => setNewPlan({...newPlan, features: e.target.value})}
            />
            <p className="text-[10px] text-gray-400">Separate features with commas</p>
          </div>
          <Button onClick={handleAdd} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
            Publish Subscription Plan
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
          <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed">
             <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-4" />
             <p className="text-gray-500">No premium plans available yet.</p>
          </div>
        ) : plans.map((p) => (
          <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-8 shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            
            <ul className="space-y-3 mb-8">
              {p.features.split(',').map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {f.trim()}
                </li>
              ))}
            </ul>

            <Button variant="outline" className="w-full rounded-xl border-blue-100 dark:border-gray-800 text-blue-600 pointer-events-none">
              Active Plan
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
