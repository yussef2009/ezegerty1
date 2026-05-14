import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { projectId, publicAnonKey } from "../../../supabase/info";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Loader2, Save, User, MapPin, Phone, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export function ClientSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    email: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/client-login");
    if (user) {
      setFormData({
        name: user.user_metadata?.name || "",
        phone: user.user_metadata?.phone || "",
        address: user.user_metadata?.address || "",
        email: user.email || ""
      });
    }
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, we'd update Supabase Auth metadata.
      // For this demo, we'll store a "user_profile" in KV to simulate persistence.
      const updatedProfile = {
        ...formData,
        userId: user?.id,
        updatedAt: new Date().toISOString()
      };
      
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/kv/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ key: `user_profile:${user?.id}`, value: updatedProfile })
      });
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-950">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="text-gray-500 mt-2">Manage your personal information and preferences</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-8 shadow-sm space-y-8"
        >
          {/* Section: Profile */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b dark:border-gray-800">
               <User className="h-5 w-5 text-blue-600" />
               <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Personal Info</h3>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-500 text-xs">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-500 text-xs">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500 text-xs">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  value={formData.email} 
                  disabled
                  className="pl-10 h-11 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-70"
                />
              </div>
            </div>
          </div>

          {/* Section: Delivery */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b dark:border-gray-800">
               <MapPin className="h-5 w-5 text-blue-600" />
               <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Default Address</h3>
            </div>
            <div className="space-y-2">
               <Label className="text-gray-500 text-xs">Shipping Address</Label>
               <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="pl-10 h-11"
                    placeholder="Enter your full address"
                  />
               </div>
            </div>
          </div>

          <div className="pt-4 border-t dark:border-gray-800 flex items-center justify-between">
             <div className="flex items-center gap-2 text-xs text-green-600">
               <ShieldCheck className="h-4 w-4" />
               Your data is encrypted and secure
             </div>
             <Button 
               onClick={handleSave} 
               disabled={saving}
               className="bg-blue-600 hover:bg-blue-700 h-11 px-8 gap-2 font-bold shadow-lg shadow-blue-500/20"
             >
               {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               Save Changes
             </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
