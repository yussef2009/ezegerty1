import { useState, useMemo, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { motion } from "motion/react";
import { CheckCircle, Copy, Loader2, Info } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { projectId, publicAnonKey } from "../../supabase/info";

type OrderFormData = {
  name: string;
  phone: string;
  address: string;
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
  instructions: string;
  paymentMethod: "cash" | "instapay";
  tips: number;
};

export function Order() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, control, formState: { errors }, reset, setValue } = useForm<OrderFormData>({
    defaultValues: {
      paymentMethod: "cash",
      tips: 0
    }
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setValue("name", user.user_metadata?.name || "");
      setValue("phone", user.user_metadata?.phone || "");
    }
  }, [user, setValue]);

  const paymentMethod = useWatch({
    control,
    name: "paymentMethod",
  });

  const instapayNumber = useMemo(() => {
    const prefixes = ['010', '011', '012', '015'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `${prefix} ${suffix.slice(0, 4)} ${suffix.slice(4)}`;
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(instapayNumber.replace(/\s/g, ''));
    alert("Number copied to clipboard!");
  };

  const onSubmit = async (data: OrderFormData) => {
    setLoading(true);
    const newOrderId = `ord_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-97c3633e/kv/set`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          key: `order:${newOrderId}`,
          value: {
            id: newOrderId,
            ...data,
            userId: user?.id || null,
            userEmail: user?.email || null,
            status: "pending",
            createdAt: new Date().toISOString(),
            total: 150 + (data.tips || 0) // Basic fixed price for demo
          }
        })
      });
      
      setOrderId(newOrderId);
      setIsSubmitted(true);
      reset();
      // Optional: Automatically redirect after a delay or let user click
      setTimeout(() => {
        navigate(`/track?id=${newOrderId}`);
      }, 2000);
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Failed to submit order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <CheckCircle className="mb-6 h-24 w-24 text-green-500" />
        </motion.div>
        <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{t.order.successTitle}</h2>
        <p className="mb-8 max-w-md text-gray-600 dark:text-gray-400">
          {t.order.successMessage}
        </p>
        {orderId && (
          <div className="mb-8 rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Your Order ID:</p>
            <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{orderId}</p>
            <p className="mt-2 text-xs text-gray-500">Save this ID to track your order status.</p>
          </div>
        )}
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.location.href = '/client/dashboard'}>View My Orders</Button>
          <Button onClick={() => { setIsSubmitted(false); setOrderId(null); }}>{t.order.placeAnother}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-950">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl rounded-xl border bg-white p-6 shadow-sm md:p-10 dark:bg-gray-900 dark:border-gray-800">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{t.order.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t.order.subtitle}</p>
            {!user && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 flex items-center justify-center gap-2">
                <Info className="h-4 w-4" />
                <span>Tip: <a href="/client-login" className="font-bold underline">Login</a> to automatically save orders to your account.</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white">{t.order.name}</label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register("name", { required: String(t.order.required) })}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-xs text-red-500">{String(errors.name.message)}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white">{t.order.phone}</label>
                <Input
                  id="phone"
                  placeholder="+20 1xx xxx xxxx"
                  {...register("phone", { required: String(t.order.required) })}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-xs text-red-500">{String(errors.phone.message)}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white">{t.order.address}</label>
              <Textarea
                id="address"
                placeholder={String(t.order.address)}
                {...register("address", { required: String(t.order.required) })}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && <p className="text-xs text-red-500">{String(errors.address.message)}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="pickupDate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white">{t.order.pickupDate}</label>
                <Input
                  id="pickupDate"
                  type="date"
                  {...register("pickupDate", { required: String(t.order.required) })}
                  className={errors.pickupDate ? "border-red-500" : ""}
                />
                 {errors.pickupDate && <p className="text-xs text-red-500">{String(errors.pickupDate.message)}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="pickupTime" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white">{t.order.pickupTime}</label>
                <select
                  id="pickupTime"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  {...register("pickupTime")}
                >
                  <option value="morning">{t.order.morning}</option>
                  <option value="afternoon">{t.order.afternoon}</option>
                  <option value="evening">{t.order.evening}</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white">{t.order.payment}</label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="font-normal cursor-pointer dark:text-white">{t.order.cash}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="instapay" id="instapay" />
                      <Label htmlFor="instapay" className="font-normal cursor-pointer dark:text-white">{t.order.instapay}</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
            
            {paymentMethod === "instapay" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4"
              >
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:bg-purple-900/20 dark:border-purple-800">
                  <p className="mb-2 text-sm text-purple-800 dark:text-purple-300 font-medium">
                    {t.order.instapayNumber}
                  </p>
                  <div className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-gray-800">
                    <code className="text-lg font-mono font-bold text-gray-800 dark:text-white">{instapayNumber}</code>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyToClipboard}
                      className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tips" className="text-sm font-medium leading-none dark:text-white">Add a Tip (Optional)</label>
                  <div className="relative">
                    <Input
                      id="tips"
                      type="number"
                      min="0"
                      placeholder="Amount in EGP"
                      {...register("tips", { valueAsNumber: true })}
                      className="pl-12 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    />
                    <span className="absolute left-3 top-2.5 text-sm text-gray-500">EGP</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <label htmlFor="instructions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white">{t.order.instructions}</label>
              <Textarea
                id="instructions"
                placeholder={String(t.order.instructionsPlaceholder)}
                {...register("instructions")}
              />
            </div>

            <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t.order.submit}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
