import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { dbGet, dbGetByPrefix } from "../../lib/db";
import type { OrderRecord } from "../../lib/orderTypes";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loader2, Package, LogOut, Clock, CreditCard, Bell, Crown, Zap, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { ClientOtherPaymentCard } from "../../components/ClientOtherPaymentCard";
import { useClientNotifications } from "../../hooks/useClientNotifications";
import { markNotificationRead } from "../../lib/notifications";
import { getBillingCycleStartDate } from "../../lib/orderFinance";


export function ClientDashboard() {
  const { t } = useLanguage();
  const c = t.client;
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [instapayNumber, setInstapayNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const { unread, unreadCount, refresh: refreshNotifications } = useClientNotifications(user?.id, 8000);

  useEffect(() => {
    if (!authLoading && !user) navigate("/client-login");
    if (!authLoading && user && (role === "admin" || role === "delivery")) {
      navigate(role === "admin" ? "/admin/dashboard" : "/delivery/dashboard");
    }
  }, [user, role, authLoading, navigate]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const values = (await dbGetByPrefix("order:")) as OrderRecord[];
      const myOrders = values.filter((o) => o && (o.userId === user.id || o.userEmail === user.email));
      myOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(myOrders);

      const instapay = await dbGet("instapay_account");
      if (instapay?.number) setInstapayNumber(instapay.number);

      const sub = await dbGet(`user_subscription:${user.id}`);
      setSubscription(sub);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (user && role !== "admin" && role !== "delivery") {
      fetchOrders();
      const interval = setInterval(fetchOrders, 12000);
      return () => clearInterval(interval);
    }
  }, [user, role]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const dismissNotification = async (id: string) => {
    if (!user) return;
    await markNotificationRead(user.id, id);
    await refreshNotifications();
  };

  const getQuotaStatus = () => {
    if (!subscription || !subscription.active) return [];
    const cycleStart = getBillingCycleStartDate(subscription.startedAt, subscription.interval);
    
    // Filter orders in current billing cycle
    const cycleOrders = orders.filter(o => o && o.createdAt && new Date(o.createdAt).getTime() >= cycleStart.getTime());
    
    // Calculate consumed quantities for each service in the subscription plan
    const allowances = subscription.includedServices || [];
    return allowances.map((allowance: any) => {
      let consumed = 0;
      for (const order of cycleOrders) {
        if (order.items) {
          for (const item of order.items) {
            if (item.serviceId === allowance.serviceId && (item.price === 0 || item.wasFreeByPlan)) {
              consumed += item.quantity;
            }
          }
        }
      }
      return {
        ...allowance,
        consumed,
        remaining: Math.max(0, allowance.qty - consumed)
      };
    });
  };

  const awaitingPaymentOrders = orders.filter((o) => o.awaitingClientPayment && o.otherPriceSet);


  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const confirmedSpent = orders
    .filter((o) => o.paymentStatus === "confirmed" || o.paymentMethod === "cash")
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const otherUnread = unread.filter(
    (n) => n.type !== "other_price_ready" || !awaitingPaymentOrders.some((o) => o.id === n.orderId)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-950">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border dark:bg-gray-900 dark:border-gray-800">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome, {user.user_metadata?.name || "Customer"}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{c.notificationsActive || "Notifications are on — you'll be alerted here"}</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {unreadCount > 0 && (
              <Badge className="bg-orange-500 text-white px-3 py-1">
                <Bell className="h-3 w-3 mr-1 inline" />
                {unreadCount} {c.newAlerts || "new"}
              </Badge>
            )}
            <Button variant="outline" onClick={() => navigate("/client/account-request")}>
              Business Account
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSignOut}
              className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Subscription / Plan Widget */}
        <div className="mb-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between bg-blue-50/30 dark:bg-blue-950/10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              My Premium Plan Status
            </h2>
            {subscription?.active && (
              <Badge className={subscription.paymentStatus === 'confirmed' ? "bg-green-600 text-white" : "bg-amber-500 text-white"}>
                {subscription.paymentStatus === 'confirmed' ? "Active / Verified" : "Pending Payment Verification"}
              </Badge>
            )}
          </div>
          <div className="p-6 space-y-6">
            {subscription && subscription.active ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-2xl font-black text-blue-900 dark:text-blue-400">
                      {subscription.planName} Plan
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Started: {new Date(subscription.startedAt).toLocaleDateString()} ({subscription.interval} cycle)
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Plan Benefits Summary:</p>
                    {subscription.discountPercent > 0 && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        {subscription.discountPercent}% extra discount on all items
                      </p>
                    )}
                    {subscription.fastPickupIncluded && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                        <Zap className="h-4 w-4 fill-amber-500 text-amber-500 shrink-0" />
                        Free Fast Pickup (⚡) included
                      </p>
                    )}
                    {subscription.firstDeliveryFree && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        First order is completely free
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border dark:border-gray-800">
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                    Service Quotas This Billing Month:
                  </h4>
                  {getQuotaStatus().length === 0 ? (
                    <p className="text-xs text-gray-500 py-2">No service quotas configured for this plan.</p>
                  ) : (
                    <div className="space-y-3">
                      {getQuotaStatus().map((quota: any, idx: number) => {
                        const percentConsumed = Math.min(100, Math.round((quota.consumed / quota.qty) * 100));
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{quota.serviceName}</span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {quota.consumed} / {quota.qty} used ({quota.remaining} remaining)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${percentConsumed}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Crown className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-2 font-light" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  You do not have an active premium subscription plan.
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Subscribe to a premium plan on the home page to get extra discounts, free fast pickup, and free services!
                </p>
                <Button 
                  onClick={() => navigate("/")} 
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-xs h-9"
                >
                  View Premium Plans
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between bg-orange-50/50 dark:bg-orange-900/10">

            <h2 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Bell className="h-5 w-5 text-orange-500" /> {c.notifications}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => { fetchOrders(); refreshNotifications(); }}>
              Refresh
            </Button>
          </div>
          <div className="p-4 space-y-4">
            {awaitingPaymentOrders.map((order) => {
              const ntf = unread.find((n) => n.orderId === order.id && n.type === "other_price_ready");
              return (
                <ClientOtherPaymentCard
                  key={order.id}
                  order={order}
                  userId={user.id}
                  notificationId={ntf?.id}
                  instapayNumber={instapayNumber}
                  onPaid={() => {
                    fetchOrders();
                    refreshNotifications();
                  }}
                />
              );
            })}
            {otherUnread.map((n) => (
              <div
                key={n.id}
                className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:bg-blue-900/10 dark:border-blue-800 flex justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{n.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {n.orderId && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/track?id=${n.orderId}`)}>
                      Track
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => dismissNotification(n.id)}>
                    {c.dismiss || "Dismiss"}
                  </Button>
                </div>
              </div>
            ))}
            {unreadCount === 0 && awaitingPaymentOrders.length === 0 && (
              <p className="text-center text-gray-500 py-6 text-sm">{c.noNotifications}</p>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-blue-100 text-sm font-medium mb-1">{c.totalOrders}</h3>
            <div className="text-3xl font-bold">{orders.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border dark:bg-gray-900 dark:border-gray-800">
            <h3 className="text-gray-500 text-sm font-medium mb-1">{c.totalSpent}</h3>
            <div className="text-3xl font-bold dark:text-white">{confirmedSpent} EGP</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" /> Order History
            </h2>
            <Button variant="ghost" size="sm" onClick={fetchOrders} className="text-blue-600">
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 text-lg">No orders yet.</p>
              <Button className="mt-4 bg-blue-600" onClick={() => navigate("/order")}>
                Place order
              </Button>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-800">
              {orders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          #{order.id.slice(-8)}
                        </span>
                        <Badge className="capitalize">{order.status}</Badge>
                        {order.awaitingClientPayment && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Payment required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        {order.paymentMethod && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" /> {order.paymentMethod}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-lg font-bold">{order.total} EGP</div>
                      </div>
                      <Button size="sm" className="bg-blue-600" onClick={() => navigate(`/track?id=${order.id}`)}>
                        Track
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
