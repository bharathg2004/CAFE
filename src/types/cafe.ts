export type ItemCategory = 
  | 'Coffee & Tea'
  | 'Cold Brews & Shakes'
  | 'Pizzas'
  | 'Burgers & Fries'
  | 'Desserts'
  | 'Retail & Counter'; // Cigarettes, packaged drinks, chips

export interface MenuItem {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  isKitchenItem: boolean; // false for cigarettes and retail items (hidden from chef)
  prepTimeMinutes: number; // For chef preparation countdown
  inStock: boolean;
  type: 'prepared' | 'packaged';
  stockQuantity?: number; // For packaged items
  lowStockThreshold?: number; // Alert threshold %
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  cookingInstruction?: string; // Specific per dish (e.g. "Less sugar", "Spicy")
  isVeg: boolean;
  isKitchenItem: boolean;
  prepTimeMinutes: number;
  startedAt?: number; // Timestamp when cooking started
}

export type PaymentMode = 'UPI' | 'COUNTER';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: number;
  tableNumber: number;
  sessionToken: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: number;
  paidAt?: number;
  servedAt?: number;
  completedAt?: number;
  chefHelpRequested?: boolean;
  upiTransactionId?: string;
}

export interface CafeSettings {
  cafeName: string;
  tagline: string;
  upiVpa: string;
  merchantName: string;
  address: string;
  phone: string;
  gstin?: string;
  tableCount: number;
  qrBaseUrl: string;
  // Extended optional fields used in Owner Settings UI
  cafePhone?: string;
  cafeAddress?: string;
  showGst?: boolean;
}

export interface TableSession {
  tableNumber: number;
  sessionToken: string;
  status: 'FREE' | 'OCCUPIED' | 'BILLING' | 'SERVED';
  customerName?: string;
  customerPhone?: string;
  sessionStartedAt?: number;
  servedAt?: number;
  activeOrderId?: string;
}

export interface StockInwardLog {
  id: string;
  itemId: string;
  itemName: string;
  quantityAdded: number;
  supplierName: string;
  loggedBy: string; // 'Biller'
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

export interface CustomerProfile {
  phone: string;
  name: string;
  totalOrders: number;
  lifetimeSpend: number;
  averageSpend: number;
  firstVisit: number;
  lastVisit: number;
  favoriteItems: { [itemName: string]: number };
}

export interface Coupon {
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrder: number;
  isActive: boolean;
  description: string;
}
