import { createBrowserRouter, Outlet } from "react-router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Services } from "./pages/Services";
import { Order } from "./pages/Order";
import { Contact } from "./pages/Contact";
import { Entry } from "./pages/Entry";
import { AdminLogin } from "./pages/admin/Login";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminClients } from "./pages/admin/Clients";
import { AdminDiscounts } from "./pages/admin/Discounts";
import { AdminPlans } from "./pages/admin/Plans";
import { AdminServices } from "./pages/admin/Services";
import { AdminTracking } from "./pages/admin/Tracking";
import { AdminDelivery } from "./pages/admin/Delivery";
import { AdminDeliveryDashboard } from "./pages/admin/AdminDeliveryDashboard";
import { AdminServicesDashboard } from "./pages/admin/ServicesDashboard";
import { AdminPayments } from "./pages/admin/Payments";
import { AdminBusinessRequests } from "./pages/admin/BusinessRequests";
import { AdminSettings } from "./pages/admin/Settings";
import { Tracker } from "./pages/Tracker";
import { ClientLogin } from "./pages/client/Login";
import { ClientSignup } from "./pages/client/Signup";
import { ClientDashboard } from "./pages/client/Dashboard";
import { ClientSettings } from "./pages/client/Settings";
import { ClientHistory } from "./pages/client/History";
import { ClientAccountRequest } from "./pages/client/AccountRequest";
import { DeliveryDashboard } from "./pages/delivery/Dashboard";

function Root() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    index: true,
    Component: Entry,
  },
  {
    path: "/admin-login",
    Component: AdminLogin,
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { path: "dashboard", Component: AdminDashboard },
      { path: "clients", Component: AdminClients },
      { path: "discounts", Component: AdminDiscounts },
      { path: "plans", Component: AdminPlans },
      { path: "services", Component: AdminServices },
      { path: "tracking", Component: AdminTracking },
      { path: "delivery", Component: AdminDelivery },
      { path: "delivery-dashboard", Component: AdminDeliveryDashboard },
      { path: "services-dashboard", Component: AdminServicesDashboard },
      { path: "payments", Component: AdminPayments },
      { path: "business-requests", Component: AdminBusinessRequests },
      { path: "settings", Component: AdminSettings },
    ]
  },
  {
    path: "/client-login",
    Component: ClientLogin,
  },
  {
    path: "/client-signup",
    Component: ClientSignup,
  },
  {
    Component: Root,
    children: [
      { path: "home", Component: Home },
      { path: "services", Component: Services },
      { path: "order", Component: Order },
      { path: "contact", Component: Contact },
      { path: "about", Component: Contact }, 
      { path: "track", Component: Tracker },
      { path: "client/dashboard", Component: ClientDashboard },
      { path: "client/settings", Component: ClientSettings },
      { path: "client/history", Component: ClientHistory },
      { path: "client/account-request", Component: ClientAccountRequest },
      { path: "delivery/dashboard", Component: DeliveryDashboard },
      { path: "*", Component: Home },
    ],
  },
]);