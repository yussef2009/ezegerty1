import { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { motion } from "motion/react";
import { CheckCircle, Loader2, Info, Trash2, Plus, Zap } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { dbSet, dbGet } from "../lib/db";
import { applyCoupon, type Discount } from "../lib/orderFinance";

type Service = {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
};

type OrderItem = {
  serviceId: string;
  name: string;
  quantity: number;
  price: number;
  isOther: boolean;
  otherDescription?: string;
  category?: string;
};

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
  const [services, setServices] = useState<Service[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [otherDescription, setOtherDescription] = useState("");
  const [instapayNumber, setInstapayNumber] = useState("");
  const [servicesLoading, setServicesLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Discount | null>(null);
  const [couponError, setCouponError] = useState("");
  const [fastPickupSettings, setFastPickupSettings] = useState<{ enabled: boolean; price: number }>({ enabled: false, price: 0 });
  
  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setValue("name", user.user_metadata?.name || "");
      setValue("phone", user.user_metadata?.phone || "");
    }
  }, [user, setValue]);

  // Fetch services and Instapay number from DB
  useEffect(() => {
    const fetchData = async () => {
      setServicesLoading(true);
      try {
        const servicesData = await dbGet("services");
        if (servicesData && Array.isArray(servicesData)) {
          setServices(servicesData);
        }
        
        const instapay = await dbGet("instapay_account");
        if (instapay?.number) {
          setInstapayNumber(instapay.number);
        }

        const fastPickup = await dbGet("fast_pickup_settings");
        if (fastPickup) {
          setFastPickupSettings({
            enabled: !!fastPickup.enabled,
            price: Number(fastPickup.price) || 0,
          });
        }
        // discounts loaded on apply
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setServicesLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const paymentMethod = useWatch({
    control,
    name: "paymentMethod",
  });

  const pickupTimeValue = useWatch({
    control,
    name: "pickupTime",
  });

  const isFastPickup = pickupTimeValue === "fast" && fastPickupSettings.enabled;
  const fastFee = isFastPickup ? fastPickupSettings.price : 0;

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountedSubtotal = applyCoupon(subtotal, appliedCoupon);
  const grandTotal = discountedSubtotal + fastFee;
  const hasOtherPending = orderItems.some((i) => i.isOther);

  const applyCouponCode = async () => {
    setCouponError("");
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    try {
      const discounts = (await dbGet("discounts")) as Discount[] | null;
      const match = (discounts || []).find((d) => d.code?.toUpperCase() === code);
      if (!match) {
        setCouponError("Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(match);
      setCouponError("");
    } catch {
      setCouponError("Could not validate coupon");
    }
  };

  const addItem = () => {
    if (!selectedService) return;
    
    let newItem: OrderItem;
    if (selectedService === "other") {
      if (!otherDescription.trim()) {
        alert("Please describe what you need");
        return;
      }
      newItem = {
        serviceId: "other",
        name: t.order.other,
        quantity: 1,
        price: 0,
        isOther: true,
        otherDescription: otherDescription
      };
    } else {
      const service = services.find(s => s.id === selectedService);
      if (!service) return;
      
      newItem = {
        serviceId: service.id,
        name: service.name,
        quantity: parseInt(String(quantity)),
        price: service.price,
        isOther: false,
        category: service.category,
      };
    }
    
    setOrderItems([...orderItems, newItem]);
    setSelectedService("");
    setQuantity(1);
    setOtherDescription("");
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: OrderFormData) => {
    if (orderItems.length === 0) {
      alert("Please add at least one service to your order");
      return;
    }

    if (data.paymentMethod === "instapay" && !instapayNumber) {
      alert("Instapay is not available. Choose cash or contact us.");
      return;
    }

    setLoading(true);
    const newOrderId = `ord_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const orderData: any = {
        id: newOrderId,
        ...data,
        userId: user?.id || null,
        userEmail: user?.email || null,
        status: "pending",
        createdAt: new Date().toISOString(),
        items: orderItems,
        subtotal,
        couponCode: appliedCoupon?.code || null,
        discountAmount: subtotal - discountedSubtotal,
        fastPickupFee: isFastPickup ? fastFee : 0,
        total: grandTotal + (data.tips || 0),
        paymentStatus: data.paymentMethod === "instapay" ? "pending" : "confirmed",
        paymentMethod: data.paymentMethod.toLowerCase(),
        priceByAdmin: orderItems.some(item => item.isOther),
        instapayNumber: data.paymentMethod === "instapay" ? instapayNumber : null
      };
      
      await dbSet(`order:${newOrderId}`, orderData);
      
      setOrderId(newOrderId);
      setIsSubmitted(true);
      reset();
      setOrderItems([]);
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
            {/* Service Selection */}
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t.order.orderItems}</h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-white">{t.order.selectService}</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    disabled={servicesLoading}
                  >
                    <option value="">{t.order.selectServicePlaceholder}</option>
                    {services.filter(s => !s.category || s.category === "Delivery" || s.category === "In-Store Service" || s.category === "Pickup").map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} — {service.price} EGP{service.category ? ` (${service.category})` : ""}
                      </option>
                    ))}
                    <option value="other">{t.order.other}</option>
                  </select>
                  {!servicesLoading && services.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      No services yet. Admin can add them under Manage Services, or choose Other.
                    </p>
                  )}
                </div>

                {selectedService && selectedService !== "other" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium dark:text-white">{t.order.pieces}</label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                )}

                {selectedService === "other" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium dark:text-white">{t.order.otherDescription}</label>
                    <Textarea
                      placeholder={String(t.order.otherDescPlaceholder)}
                      value={otherDescription}
                      onChange={(e) => setOtherDescription(e.target.value)}
                      className="dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.order.priceByAdmin}</p>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={addItem}
                  variant="outline"
                  className="w-full gap-2"
                  disabled={!selectedService}
                >
                  <Plus className="h-4 w-4" /> {t.order.addItem}
                </Button>
              </div>

              {/* Order Items List */}
              {orderItems.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        {!item.isOther && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.quantity} × {item.price} EGP = {item.quantity * item.price} EGP
                          </p>
                        )}
                        {item.isOther && (
                          <>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.otherDescription}</p>
                            <p className="text-xs text-orange-600 dark:text-orange-400">{t.order.priceByAdmin}</p>
                          </>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Total */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800 mt-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900 dark:text-white">{t.order.orderTotal}</span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {hasOtherPending && subtotal === 0
                          ? "TBD"
                          : `${grandTotal} EGP`}
                      </span>
                    </div>
                    {appliedCoupon && subtotal > 0 && (
                      <p className="text-xs text-green-700 dark:text-green-400">
                        Coupon {appliedCoupon.code} applied (−{(subtotal - discountedSubtotal).toFixed(0)} EGP)
                      </p>
                    )}
                    {isFastPickup && fastFee > 0 && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Fast Pickup fee: +{fastFee} EGP
                      </p>
                    )}
                    {orderItems.some((i) => i.isOther) && (
                      <p className="text-xs text-orange-700 dark:text-orange-300">{t.order.priceByAdmin}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Information */}
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
                  {fastPickupSettings.enabled && (
                    <option value="fast">⚡ {t.order.fast} (+{fastPickupSettings.price} EGP)</option>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
              <label className="text-sm font-medium dark:text-white">Coupon code (optional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="PROMO2024"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="dark:bg-gray-900"
                />
                <Button type="button" variant="outline" onClick={applyCouponCode}>
                  Apply
                </Button>
              </div>
              {couponError && <p className="text-xs text-red-500">{couponError}</p>}
              {appliedCoupon && <p className="text-xs text-green-600">Coupon active: {appliedCoupon.code}</p>}
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
                      <RadioGroupItem value="instapay" id="instapay" disabled={!instapayNumber} />
                      <Label htmlFor="instapay" className={`font-normal cursor-pointer dark:text-white ${!instapayNumber ? "opacity-50" : ""}`}>{t.order.instapay}</Label>
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
                {instapayNumber ? (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:bg-purple-900/20 dark:border-purple-800">
                  <p className="mb-2 text-sm text-purple-800 dark:text-purple-300 font-medium">
                    {t.order.instapayNumber}
                  </p>
                  <div className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-gray-800">
                    <code className="text-lg font-mono font-bold text-gray-800 dark:text-white">{instapayNumber}</code>
                  </div>
                  <p className="mt-2 text-xs text-purple-700 dark:text-purple-300">
                    Payment will stay pending until admin confirms in Pending Payments.
                  </p>
                </div>
                ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-900/20 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200">
                  Instapay is not configured yet. Ask admin to set the number under Admin → Payment Settings, or pay with cash.
                </div>
                )}

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
