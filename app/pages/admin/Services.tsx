import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Loader2, Plus, Trash2, Edit2, Save, X, WashingMachine } from "lucide-react";
import { dbGet, dbSet } from "../../lib/db";

type Service = {
  id: string;
  name: string;
  price: number;
  description: string;
  category?: string;
};

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newService, setNewService] = useState({ name: "", price: "", description: "", category: "Delivery" });
  const [editForm, setEditForm] = useState<Service | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await dbGet("services");
      if (data) setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const saveServices = async (updatedServices: Service[]) => {
    try {
      await dbSet("services", updatedServices);
      setServices(updatedServices);
    } catch (error) {
      console.error("Error saving services:", error);
    }
  };

  const handleAdd = async () => {
    if (!newService.name || !newService.price) return;
    const newItem: Service = {
      id: Math.random().toString(36).substr(2, 9),
      name: newService.name,
      price: parseFloat(newService.price),
      description: newService.description,
      category: newService.category || "Delivery"
    };
    const updated = [...services, newItem];
    await saveServices(updated);
    setNewService({ name: "", price: "", description: "", category: "Delivery" });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    const updated = services.filter(s => s.id !== id);
    await saveServices(updated);
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setEditForm(service);
  };

  const saveEdit = async () => {
    if (!editForm) return;
    const updated = services.map(s => s.id === editForm.id ? editForm : s);
    await saveServices(updated);
    setEditingId(null);
    setEditForm(null);
  };

  if (isAdding) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setIsAdding(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
          <h2 className="text-2xl font-bold">Add New Service</h2>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border dark:border-gray-800 shadow-lg space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Service Name</label>
            <Input 
              placeholder="e.g. Dry Clean Suit" 
              className="h-12 text-lg"
              value={newService.name} 
              onChange={e => setNewService({...newService, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select 
              className="w-full h-12 px-3 rounded-md border border-input bg-background dark:bg-gray-800 dark:border-gray-700"
              value={newService.category} 
              onChange={e => setNewService({...newService, category: e.target.value})}
            >
              <option value="Delivery">Delivery</option>
              <option value="In-Store Service">In-Store Service</option>
              <option value="Pickup">Pickup</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Base Price (EGP)</label>
            <Input 
              type="number" 
              placeholder="0.00" 
              className="h-12 text-lg font-mono"
              value={newService.price} 
              onChange={e => setNewService({...newService, price: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input 
              placeholder="What's included?" 
              className="h-12"
              value={newService.description} 
              onChange={e => setNewService({...newService, description: e.target.value})}
            />
          </div>
          <Button onClick={handleAdd} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
            Create Service
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Services</h2>
          <p className="text-gray-500 text-sm">Update your pricing and service offerings</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700 h-10 gap-2">
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableHead className="py-4">Service Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="animate-spin inline h-8 w-8 text-blue-600" /></TableCell></TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <WashingMachine className="mx-auto h-12 w-12 text-gray-400 mb-4 opacity-20" />
                  <p className="text-gray-500 font-medium">No services defined yet.</p>
                </TableCell>
              </TableRow>
            ) : (
              services.map(service => (
                <TableRow key={service.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 group">
                  <TableCell className="font-semibold py-4">
                    {editingId === service.id && editForm ? (
                      <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="h-9" />
                    ) : service.name}
                  </TableCell>
                  <TableCell>
                    {editingId === service.id && editForm ? (
                      <select 
                        className="w-full h-9 px-2 rounded-md border border-input bg-background dark:bg-gray-800 dark:border-gray-700 text-sm"
                        value={editForm.category || "Delivery"}
                        onChange={e => setEditForm({...editForm, category: e.target.value})}
                      >
                        <option value="Delivery">Delivery</option>
                        <option value="In-Store Service">In-Store Service</option>
                        <option value="Pickup">Pickup</option>
                      </select>
                    ) : (
                      <span className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                        {service.category || "Delivery"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {editingId === service.id && editForm ? (
                      <Input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})} className="h-9" />
                    ) : `${service.price} EGP`}
                  </TableCell>
                  <TableCell className="text-gray-500 max-w-xs truncate">
                    {editingId === service.id && editForm ? (
                      <Input value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="h-9" />
                    ) : service.description}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === service.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={saveEdit} className="h-8 bg-green-600 hover:bg-green-700">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8">Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(service)} className="h-8 w-8 p-0"><Edit2 className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0" onClick={() => handleDelete(service.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
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
