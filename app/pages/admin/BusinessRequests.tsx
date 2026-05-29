import { useEffect, useState } from "react";
import { dbGetByPrefix, dbSet } from "../../lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loader2, RefreshCw, Check, X, Users, Mail, Phone, Building2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

type AccountRequest = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  volume: string;
  notes: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export function AdminBusinessRequests() {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const values = await dbGetByPrefix("account_request:");
      setRequests(values.sort((a: AccountRequest, b: AccountRequest) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      toast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateRequestStatus = async (requestId: string, newStatus: "approved" | "rejected") => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    const updatedRequest = { ...request, status: newStatus };
    try {
      await dbSet(`account_request:${requestId}`, updatedRequest);
      setRequests(requests.map(r => r.id === requestId ? updatedRequest : r));
      toast.success(`Request marked as ${newStatus}`);
    } catch (error) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="h-7 w-7 text-blue-600" />
            Business Account Requests
          </h1>
          <p className="text-gray-500 text-sm">Review corporate and enterprise partnership applications</p>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 h-10 w-10" /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 font-medium">No business requests found</p>
          </div>
        ) : requests.map((request) => (
          <div key={request.id} className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{request.companyName}</h3>
                  </div>
                  <Badge variant={
                    request.status === 'approved' ? 'default' : 
                    request.status === 'rejected' ? 'destructive' : 'secondary'
                  }>
                    {request.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <UserCircle2 className="h-4 w-4" />
                      <span className="font-medium text-gray-900 dark:text-white">{request.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">{request.email}</a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${request.phone}`} className="text-gray-600 dark:text-gray-300">{request.phone}</a>
                    </div>
                  </div>
                  
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Monthly Volume Estimate</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{request.volume || "Not provided"}</p>
                    {request.notes && (
                      <>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-2">Notes</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{request.notes}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="flex flex-col gap-2 shrink-0 md:pt-1">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 w-full md:w-32 shadow-sm"
                    onClick={() => updateRequestStatus(request.id, 'approved')}
                  >
                    <Check className="h-4 w-4 mr-2" /> Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50 h-10 w-full md:w-32 shadow-sm"
                    onClick={() => updateRequestStatus(request.id, 'rejected')}
                  >
                    <X className="h-4 w-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400">
              <span>Applied on {new Date(request.createdAt).toLocaleDateString()}</span>
              <span>Ref ID: {request.id.slice(-8)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
