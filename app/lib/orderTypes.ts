export type OrderItem = {
  serviceId: string;
  name: string;
  quantity: number;
  price: number;
  isOther?: boolean;
  otherDescription?: string;
  category?: string;
  wasFreeByPlan?: boolean;
};

export type OrderRecord = {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: "pending" | "cleaning" | "ready" | "delivering" | "delivered";
  paymentMethod?: string;
  paymentStatus?: "pending" | "confirmed" | "failed";
  total: number;
  tips?: number;
  deliveryTip?: number;
  createdAt: string;
  userId?: string | null;
  userEmail?: string | null;
  items?: OrderItem[];
  priceByAdmin?: boolean;
  otherPriceSet?: boolean;
  awaitingClientPayment?: boolean;
  assignedDriverUserId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  driverName?: string;
  deliveredAt?: string;
  pickupDate?: string;
  pickupTime?: string;
  fastPickupFee?: number;
  planSubscriptionFee?: number;
  isPlanPayment?: boolean;
  planName?: string;
  appliedPlanId?: string;
  planDiscount?: number;
};

