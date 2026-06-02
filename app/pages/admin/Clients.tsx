import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { 
  Loader2, 
  Ban, 
  CheckCircle, 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CreditCard,
  ShoppingBag
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "../../components/ui/dialog";
import { dbGet, dbSet } from "../../lib/db";
import { Crown } from "lucide-react";
import { toast } from "sonner";

type Client = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  lastActive: string;
  blocked: boolean;
  totalOrders: number;
  joinedAt: string;
  preferredPayment: string;
};

export function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [activatingPremium, setActivatingPremium] = useState(false);
  const [clientPremium, setClientPremium] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await dbGet("clients_list");
      setClients(data && Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveClients = async (updatedClients: Client[]) => {
    try {
      await dbSet("clients_list", updatedClients);
    } catch (error) {
      console.error("Error saving clients:", error);
    }
  };

  useEffect(() => {
    fetchClients();
    dbGet("plans").then((data) => {
      if (data && Array.isArray(data)) setPlans(data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
    });
  }, []);

  const toggleBlock = async (client: Client) => {
    const updatedClients = clients.map(c => 
      c.id === client.id ? { ...c, blocked: !c.blocked } : c
    );
    setClients(updatedClients);
    await saveClients(updatedClients);
  };

  const openDetails = async (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
    setClientPremium(null);
    try {
      const sub = await dbGet(`user_subscription:${client.id}`);
      if (sub?.active && sub.planName) setClientPremium(sub.planName);
    } catch {
      /* ignore */
    }
  };

  const activatePremium = async () => {
    if (!selectedClient || !selectedPlanId) {
      toast.error("Select a plan");
      return;
    }
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return;
    setActivatingPremium(true);
    try {
      await dbSet(`user_subscription:${selectedClient.id}`, {
        planId: plan.id,
        planName: plan.name,
        active: true,
        startedAt: new Date().toISOString(),
        activatedBy: "admin",
      });
      setClientPremium(plan.name);
      toast.success(`Premium activated for ${selectedClient.name}`);
    } catch {
      toast.error("Failed to activate premium");
    } finally {
      setActivatingPremium(false);
    }
  };

  const deactivatePremium = async () => {
    if (!selectedClient) return;
    try {
      await dbSet(`user_subscription:${selectedClient.id}`, { active: false, endedAt: new Date().toISOString() });
      setClientPremium(null);
      toast.success("Premium deactivated");
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Client Directory</h2>
          <p className="text-sm text-gray-500">Manage your customer base and view profiles</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search clients..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin inline mr-2" /> Loading clients...</TableCell></TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No clients found</TableCell></TableRow>
            ) : (
              filteredClients.map(client => (
                <TableRow key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-gray-500">ID: {client.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{client.email}</div>
                    <div className="text-xs text-gray-500">{client.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(client.joinedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {client.blocked ? (
                      <Badge variant="destructive" className="flex w-fit items-center gap-1">
                        <Ban className="h-3 w-3" /> Blocked
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 flex w-fit items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDetails(client)}>
                        <Eye className="h-4 w-4 mr-2" /> Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant={client.blocked ? "default" : "destructive"}
                        onClick={() => toggleBlock(client)}
                        className={client.blocked ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {client.blocked ? "Unblock" : "Block"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Client Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          {selectedClient && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{selectedClient.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      {selectedClient.blocked ? (
                        <Badge variant="destructive">Blocked Account</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Active Member</Badge>
                      )}
                      <span className="text-gray-500">• Joined {new Date(selectedClient.joinedAt).toLocaleDateString()}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <span>{selectedClient.phone || "No phone provided"}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span>{selectedClient.address || "No address on file"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500">Activity & Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <ShoppingBag className="h-3 w-3" /> Total Orders
                      </div>
                      <div className="text-xl font-bold">{selectedClient.totalOrders}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <CreditCard className="h-3 w-3" /> Payment
                      </div>
                      <div className="text-sm font-bold">{selectedClient.preferredPayment}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Last active: {new Date(selectedClient.lastActive).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-600" /> Premium
                </h3>
                {clientPremium ? (
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Active: {clientPremium}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={deactivatePremium}>
                      Remove Premium
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm dark:bg-gray-800"
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                    >
                      <option value="">Select plan…</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={activatePremium} disabled={activatingPremium}>
                      {activatingPremium ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate Premium"}
                    </Button>
                  </div>
                )}
                {plans.length === 0 && (
                  <p className="text-xs text-gray-500">Add plans under Admin → Premium Plans first.</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => { toggleBlock(selectedClient); setIsDetailsOpen(false); }}>
                    {selectedClient.blocked ? "Unblock Account" : "Block Account"}
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsDetailsOpen(false)}>Close Profile</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
