import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Plus, Trash2, Tag, X, Check, Loader2 } from "lucide-react";
import { dbGet, dbSet } from "../../lib/db";
import { toast } from "sonner";

type Discount = {
  id: string;
  code: string;
  amount: number;
  type: "percentage" | "fixed";
};

export function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newDiscount, setNewDiscount] = useState({ code: "", amount: "", type: "percentage" as "percentage" | "fixed" });

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const data = await dbGet("discounts");
      if (data) setDiscounts(data || []);
    } catch (error) {
      toast.error("Failed to fetch discounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDiscounts(); }, []);

  const handleAdd = async () => {
    if (!newDiscount.code || !newDiscount.amount) return;
    const newItem: Discount = {
      id: Math.random().toString(36).substr(2, 9),
      code: newDiscount.code.toUpperCase(),
      amount: parseFloat(newDiscount.amount),
      type: newDiscount.type
    };
    const updated = [...discounts, newItem];
    try {
      await dbSet("discounts", updated);
      setDiscounts(updated);
      setNewDiscount({ code: "", amount: "", type: "percentage" });
      setIsAdding(false);
      toast.success("Promo code created!");
    } catch (e) {
      toast.error("Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    const updated = discounts.filter(d => d.id !== id);
    try {
      await dbSet("discounts", updated);
      setDiscounts(updated);
      toast.success("Code deleted");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  if (isAdding) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setIsAdding(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
          <h2 className="text-2xl font-bold">Create Promo Code</h2>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border dark:border-gray-800 shadow-lg space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Coupon Code</label>
            <Input 
              placeholder="e.g. SUMMER50" 
              className="h-12 text-lg font-mono"
              value={newDiscount.code} 
              onChange={e => setNewDiscount({...newDiscount, code: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Discount Value</label>
              <Input 
                type="number" 
                placeholder="0" 
                className="h-12 text-lg"
                value={newDiscount.amount} 
                onChange={e => setNewDiscount({...newDiscount, amount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Discount Type</label>
              <select 
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={newDiscount.type}
                onChange={(e: any) => setNewDiscount({...newDiscount, type: e.target.value})}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (EGP)</option>
              </select>
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
            Generate Code
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promo Codes</h2>
          <p className="text-gray-500 text-sm">Manage discounts and seasonal promotions</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700 h-10 gap-2">
          <Plus className="h-4 w-4" /> Add Code
        </Button>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableHead className="py-4">Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="animate-spin inline h-8 w-8 text-blue-600" /></TableCell></TableRow>
            ) : discounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4 opacity-20" />
                  <p className="text-gray-500 font-medium">No promo codes active.</p>
                </TableCell>
              </TableRow>
            ) : (
              discounts.map(d => (
                <TableRow key={d.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                  <TableCell className="font-mono font-bold py-4 text-lg tracking-wider text-blue-600 dark:text-blue-400">{d.code}</TableCell>
                  <TableCell className="font-semibold text-gray-900 dark:text-white">{d.amount}{d.type === 'percentage' ? '%' : ' EGP'}</TableCell>
                  <TableCell className="capitalize text-gray-500">{d.type}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(d.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
