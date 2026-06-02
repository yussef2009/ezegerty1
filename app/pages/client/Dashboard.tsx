import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { dbGet, dbGetByPrefix } from "../../lib/db";
import type { AppNotification } from "../../lib/notifications";
import type { OrderRecord } from "../../lib/orderTypes";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loader2, Package, LogOut, Clock, CreditCard, Bell } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { ClientOtherPaymentCard } from "../../components/ClientOtherPaymentCard";

export function ClientDashboard() {
  const { t } = useLanguage();
  const c = t.client;
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [instapayNumber, setInstapayNumber] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/client-login");
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const values = (await dbGetByPrefix("order:")) as OrderRecord[];
      const myOrders = values.filter((o) => o.userId === user.id || o.userEmail === user.email);
      myOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(myOrders);

      const notifs = ((await dbGet(`notifications:${user.id}`)) as AppNotification[] | null) || [];
      setNotifications(notifs.filter((n) => !n.read));

      const instapay = await dbGet("instapay_account");
      if (instapay?.number) setInstapayNumber(instapay.number);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-950">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border dark:bg-gray-900 dark:border-gray-800">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome, {user.user_metadata?.name || "Customer"}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Manage orders and payment notifications</p>
          </div>
          <div className="flex flex-wrap gap-3">
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

        {(notifications.length > 0 || awaitingPaymentOrders.length > 0) && (
          <div className="mb-8 space-y-4">
            <h2 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Bell className="h-5 w-5 text-orange-500" /> {c.notifications}
            </h2>
            {awaitingPaymentOrders.map((order) => {
              const ntf = notifications.find((n) => n.orderId === order.id && n.type === "other_price_ready");
              return (
                <ClientOtherPaymentCard
                  key={order.id}
                  order={order}
                  userId={user.id}
                  notificationId={ntf?.id}
                  instapayNumber={instapayNumber}
                  onPaid={fetchData}
                />
              );
            })}
            {notifications
              .filter((n) => n.type !== "other_price_ready" || !awaitingPaymentOrders.some((o) => o.id === n.orderId))
              .map((n) => (
                <div key={n.id} className="rounded-lg border bg-white p-4 dark:bg-gray-900 dark:border-gray-800">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-gray-500">{n.message}</p>
                </div>
              ))}
          </div>
        )}

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
            <Button variant="ghost" size="sm" onClick={fetchData} className="text-blue-600">
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
                      <div className="flex items-center gap-3">
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
