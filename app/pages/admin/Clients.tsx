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

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await dbGet("clients_list");
      
      // If no data, provide some mock data for the stakeholder to see
      if (!data || data.length === 0) {
        const mockClients: Client[] = [
          { 
            id: "c1", 
            name: "Zeyad Mohamed", 
            email: "zeyad@example.com", 
            phone: "+20 123 456 7890", 
            address: "123 Corniche Road, Alexandria",
            lastActive: new Date().toISOString(), 
            blocked: false,
            totalOrders: 12,
            joinedAt: "2024-01-15T10:00:00Z",
            preferredPayment: "Instapay"
          },
          { 
            id: "c2", 
            name: "Laila Ahmed", 
            email: "laila@example.com", 
            phone: "+20 100 222 3333", 
            address: "Sidi Gaber, Alexandria",
            lastActive: new Date(Date.now() - 86400000 * 2).toISOString(), 
            blocked: true,
            totalOrders: 5,
            joinedAt: "2024-02-10T14:30:00Z",
            preferredPayment: "Cash"
          },
          { 
            id: "c3", 
            name: "Karim Hassan", 
            email: "karim@business.com", 
            phone: "+20 111 555 6666", 
            address: "Smouha, Alexandria",
            lastActive: new Date(Date.now() - 3600000 * 5).toISOString(), 
            blocked: false,
            totalOrders: 45,
            joinedAt: "2023-11-20T09:15:00Z",
            preferredPayment: "Visa"
          }
        ];
        setClients(mockClients);
        // Save mock data for next time
        await saveClients(mockClients);
      } else {
        setClients(data);
      }
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
  }, []);

  const toggleBlock = async (client: Client) => {
    const updatedClients = clients.map(c => 
      c.id === client.id ? { ...c, blocked: !c.blocked } : c
    );
    setClients(updatedClients);
    await saveClients(updatedClients);
  };

  const openDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
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

              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">Send Message</Button>
                  <Button variant="outline" size="sm">Reset Password</Button>
                  <Button variant="outline" size="sm" className="text-blue-600">Apply Manual Discount</Button>
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
