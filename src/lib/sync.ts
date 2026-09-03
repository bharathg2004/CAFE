import { Order, MenuItem, TableSession, StockInwardLog, CustomerProfile, Coupon, OrderItem, PaymentMode, CafeSettings } from '../types/cafe';
import { INITIAL_MENU_ITEMS, INITIAL_TABLES, INITIAL_COUPONS } from './mockData';
import { sound } from './audio';

export const DEFAULT_SETTINGS: CafeSettings = {
  cafeName: 'CafeOS Artisan Bistro',
  tagline: 'Fresh Brews & Gourmet Bites',
  upiVpa: 'bharathcafe@upi',
  merchantName: 'CafeOS',
  address: 'Main Street, Cafe Lane, Ground Floor',
  phone: '9876543210',
  gstin: '29ABCDE1234F1Z5',
  tableCount: 12,
  qrBaseUrl: typeof window !== 'undefined' 
    ? (window.location.origin + window.location.pathname).replace(/\/$/, '')
    : 'https://bharathg2004.github.io/CAFE'
};

type Listener = () => void;

class CafeStore {
  private orders: Order[] = [];
  private menu: MenuItem[] = [];
  private tables: TableSession[] = [];
  private stockLogs: StockInwardLog[] = [];
  private customers: Map<string, CustomerProfile> = new Map();
  private coupons: Coupon[] = [];
  private settings: CafeSettings = DEFAULT_SETTINGS;
  private listeners: Set<Listener> = new Set();
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Load from localStorage or initialize defaults
    const savedOrders = localStorage.getItem('cafeos_orders');
    const savedMenu = localStorage.getItem('cafeos_menu');
    const savedTables = localStorage.getItem('cafeos_tables');
    const savedStockLogs = localStorage.getItem('cafeos_stock_logs');
    const savedCustomers = localStorage.getItem('cafeos_customers');
    const savedCoupons = localStorage.getItem('cafeos_coupons');
    const savedSettings = localStorage.getItem('cafeos_settings');

    this.menu = savedMenu ? JSON.parse(savedMenu) : INITIAL_MENU_ITEMS;
    this.tables = savedTables ? JSON.parse(savedTables) : INITIAL_TABLES;
    this.orders = savedOrders ? JSON.parse(savedOrders) : this.getSeedOrders();
    this.stockLogs = savedStockLogs ? JSON.parse(savedStockLogs) : this.getSeedStockLogs();
    this.coupons = savedCoupons ? JSON.parse(savedCoupons) : INITIAL_COUPONS;
    this.settings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;

    if (savedCustomers) {
      const parsed = JSON.parse(savedCustomers);
      Object.entries(parsed).forEach(([k, v]) => this.customers.set(k, v as CustomerProfile));
    } else {
      this.rebuildCustomerDatabase();
    }

    // Cross-tab broadcast channel for real-time synchronization
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('cafeos_channel');
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC') {
          this.reloadFromStorage(false);
        }
      };
    }

    // Also listen to storage events as cross-origin / cross-window fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('cafeos_')) {
          this.reloadFromStorage(false);
        }
      });
    }
  }

  private getSeedOrders(): Order[] {
    const now = Date.now();
    return [
      {
        id: 'ord_101',
        orderNumber: 101,
        tableNumber: 2,
        sessionToken: 'table_2_secure_token',
        customerName: 'Rahul Sharma',
        customerPhone: '9876543210',
        totalAmount: 540,
        paymentMode: 'UPI',
        paymentStatus: 'PAID',
        orderStatus: 'PREPARING',
        createdAt: now - 8 * 60 * 1000,
        paidAt: now - 8 * 60 * 1000,
        items: [
          {
            id: 'oi_1',
            menuItemId: 'm6',
            name: 'Farmhouse Special Pizza (10 inch)',
            quantity: 1,
            unitPrice: 360,
            cookingInstruction: 'Less spicy, crispy base',
            isVeg: true,
            isKitchenItem: true,
            prepTimeMinutes: 12,
            startedAt: now - 8 * 60 * 1000
          },
          {
            id: 'oi_2',
            menuItemId: 'm1',
            name: 'Hazelnut Cappuccino',
            quantity: 1,
            unitPrice: 180,
            cookingInstruction: 'Sugarless, extra hot',
            isVeg: true,
            isKitchenItem: true,
            prepTimeMinutes: 5,
            startedAt: now - 8 * 60 * 1000
          }
        ]
      },
      {
        id: 'ord_102',
        orderNumber: 102,
        tableNumber: 4,
        sessionToken: 'table_4_secure_token',
        customerName: 'Priya Patel',
        customerPhone: '9812345678',
        totalAmount: 390,
        paymentMode: 'COUNTER',
        paymentStatus: 'PAID',
        orderStatus: 'SERVED',
        createdAt: now - 25 * 60 * 1000,
        paidAt: now - 23 * 60 * 1000,
        servedAt: now - 10 * 60 * 1000,
        items: [
          {
            id: 'oi_3',
            menuItemId: 'm4',
            name: 'Classic Vietnamese Cold Brew',
            quantity: 1,
            unitPrice: 210,
            cookingInstruction: 'Normal ice',
            isVeg: true,
            isKitchenItem: true,
            prepTimeMinutes: 4,
            startedAt: now - 23 * 60 * 1000
          },
          {
            id: 'oi_4',
            menuItemId: 'm11', // Cigarettes - Retail item
            name: 'Classic Regular Cigarettes (Pack of 10)',
            quantity: 1,
            unitPrice: 180,
            isVeg: true,
            isKitchenItem: false, // NON-KITCHEN ITEM
            prepTimeMinutes: 0
          }
        ]
      }
    ];
  }

  private getSeedStockLogs(): StockInwardLog[] {
    return [
      {
        id: 'log_1',
        itemId: 'm13',
        itemName: 'Packaged Organic Mango Juice (300ml)',
        quantityAdded: 24,
        supplierName: 'Fresh Organics Beverages Ltd',
        loggedBy: 'Biller Desk',
        status: 'PENDING_APPROVAL',
        createdAt: Date.now() - 3 * 3600 * 1000
      },
      {
        id: 'log_2',
        itemId: 'm14',
        itemName: 'Belgian Chocolate Ice Cream Tub (120ml)',
        quantityAdded: 30,
        supplierName: 'Artisan Dairy Distributor',
        loggedBy: 'Biller Desk',
        status: 'APPROVED',
        createdAt: Date.now() - 24 * 3600 * 1000,
        reviewedAt: Date.now() - 20 * 3600 * 1000,
        reviewedBy: 'Owner (Ramesh)'
      }
    ];
  }

  private persist(broadcast = true) {
    localStorage.setItem('cafeos_orders', JSON.stringify(this.orders));
    localStorage.setItem('cafeos_menu', JSON.stringify(this.menu));
    localStorage.setItem('cafeos_tables', JSON.stringify(this.tables));
    localStorage.setItem('cafeos_stock_logs', JSON.stringify(this.stockLogs));
    localStorage.setItem('cafeos_coupons', JSON.stringify(this.coupons));
    localStorage.setItem('cafeos_settings', JSON.stringify(this.settings));

    const custObj: Record<string, CustomerProfile> = {};
    this.customers.forEach((v, k) => { custObj[k] = v; });
    localStorage.setItem('cafeos_customers', JSON.stringify(custObj));

    if (broadcast && this.channel) {
      this.channel.postMessage({ type: 'SYNC', timestamp: Date.now() });
    }
    this.notify();
  }

  private reloadFromStorage(notify = true) {
    const savedOrders = localStorage.getItem('cafeos_orders');
    const savedMenu = localStorage.getItem('cafeos_menu');
    const savedTables = localStorage.getItem('cafeos_tables');
    const savedStockLogs = localStorage.getItem('cafeos_stock_logs');
    const savedCustomers = localStorage.getItem('cafeos_customers');
    const savedCoupons = localStorage.getItem('cafeos_coupons');
    const savedSettings = localStorage.getItem('cafeos_settings');

    if (savedOrders) this.orders = JSON.parse(savedOrders);
    if (savedMenu) this.menu = JSON.parse(savedMenu);
    if (savedTables) this.tables = JSON.parse(savedTables);
    if (savedStockLogs) this.stockLogs = JSON.parse(savedStockLogs);
    if (savedCoupons) this.coupons = JSON.parse(savedCoupons);
    if (savedSettings) this.settings = JSON.parse(savedSettings);

    if (savedCustomers) {
      this.customers.clear();
      const parsed = JSON.parse(savedCustomers);
      Object.entries(parsed).forEach(([k, v]) => this.customers.set(k, v as CustomerProfile));
    }

    if (notify) this.notify();
  }

  private rebuildCustomerDatabase() {
    this.customers.clear();
    this.orders.forEach((ord) => {
      if (ord.customerPhone && ord.paymentStatus === 'PAID') {
        const existing = this.customers.get(ord.customerPhone);
        if (existing) {
          existing.totalOrders += 1;
          existing.lifetimeSpend += ord.totalAmount;
          existing.averageSpend = Math.round(existing.lifetimeSpend / existing.totalOrders);
          existing.lastVisit = Math.max(existing.lastVisit, ord.createdAt);
          ord.items.forEach(it => {
            existing.favoriteItems[it.name] = (existing.favoriteItems[it.name] || 0) + it.quantity;
          });
        } else {
          const favs: Record<string, number> = {};
          ord.items.forEach(it => { favs[it.name] = it.quantity; });
          this.customers.set(ord.customerPhone, {
            phone: ord.customerPhone,
            name: ord.customerName,
            totalOrders: 1,
            lifetimeSpend: ord.totalAmount,
            averageSpend: ord.totalAmount,
            firstVisit: ord.createdAt,
            lastVisit: ord.createdAt,
            favoriteItems: favs
          });
        }
      }
    });
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // --- GETTERS ---
  public getMenu(): MenuItem[] {
    return [...this.menu];
  }

  public getOrders(): Order[] {
    return [...this.orders];
  }

  public getTables(): TableSession[] {
    return [...this.tables];
  }

  public getStockLogs(): StockInwardLog[] {
    return [...this.stockLogs];
  }

  public getCustomers(): CustomerProfile[] {
    return Array.from(this.customers.values());
  }

  public getCoupons(): Coupon[] {
    return [...this.coupons];
  }

  public getSettings(): CafeSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<CafeSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.persist();
  }

  public getActiveOrderByTable(tableNumber: number): Order | undefined {
    return this.orders.find(
      (o) => o.tableNumber === tableNumber && o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED'
    );
  }

  public getKitchenOrders(): Order[] {
    // Only PAID orders that are preparing or pending kitchen completion
    // MUST contain at least one kitchen-prepared item
    return this.orders.filter(
      (o) => o.paymentStatus === 'PAID' && 
             (o.orderStatus === 'PENDING' || o.orderStatus === 'PREPARING') &&
             o.items.some((it) => it.isKitchenItem)
    );
  }

  // --- ACTIONS ---

  /**
   * Start customer dwell session when QR code is scanned for the first time
   */
  public startTableScanSession(tableNumber: number) {
    const table = this.tables.find(t => t.tableNumber === tableNumber);
    if (table && table.status === 'FREE') {
      table.status = 'OCCUPIED';
      table.sessionStartedAt = Date.now();
      this.persist();
    }
  }

  /**
   * Place a new order or append extra items to an existing table order
   */
  public placeOrder(params: {
    tableNumber: number;
    customerName: string;
    customerPhone: string;
    items: {
      menuItemId: string;
      quantity: number;
      cookingInstruction?: string;
    }[];
    paymentMode: PaymentMode;
    upiTransactionId?: string;
  }): Order {
    const now = Date.now();
    const orderItems: OrderItem[] = params.items.map((it, idx) => {
      const menuItem = this.menu.find(m => m.id === it.menuItemId)!;
      return {
        id: `oi_${now}_${idx}`,
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: it.quantity,
        unitPrice: menuItem.price,
        cookingInstruction: it.cookingInstruction,
        isVeg: menuItem.isVeg,
        isKitchenItem: menuItem.isKitchenItem,
        prepTimeMinutes: menuItem.prepTimeMinutes,
        startedAt: params.paymentMode === 'UPI' ? now : undefined
      };
    });

    const totalAmount = orderItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
    const orderNumber = 100 + this.orders.length + 1;
    const isPaid = params.paymentMode === 'UPI';

    const newOrder: Order = {
      id: `ord_${now}`,
      orderNumber,
      tableNumber: params.tableNumber,
      sessionToken: `table_${params.tableNumber}_token`,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      items: orderItems,
      totalAmount,
      paymentMode: params.paymentMode,
      paymentStatus: isPaid ? 'PAID' : 'PENDING',
      orderStatus: isPaid ? 'PREPARING' : 'PENDING',
      createdAt: now,
      paidAt: isPaid ? now : undefined,
      upiTransactionId: params.upiTransactionId
    };

    this.orders.unshift(newOrder);

    // Update table status
    const table = this.tables.find(t => t.tableNumber === params.tableNumber);
    if (table) {
      table.status = isPaid ? 'OCCUPIED' : 'BILLING';
      table.customerName = params.customerName;
      table.customerPhone = params.customerPhone;
      table.activeOrderId = newOrder.id;
      if (!table.sessionStartedAt) table.sessionStartedAt = now;
    }

    // Deduct stock for packaged items if any
    orderItems.forEach(it => {
      const menuItem = this.menu.find(m => m.id === it.menuItemId);
      if (menuItem && menuItem.type === 'packaged' && typeof menuItem.stockQuantity === 'number') {
        menuItem.stockQuantity = Math.max(0, menuItem.stockQuantity - it.quantity);
        if (menuItem.stockQuantity === 0) {
          menuItem.inStock = false;
        }
      }
    });

    if (isPaid) {
      this.rebuildCustomerDatabase();
      sound.playKitchenChime();
    }

    this.persist();
    return newOrder;
  }

  /**
   * Cashier marks counter payment as paid
   */
  public confirmCounterPayment(orderId: string, _cashReceived?: number) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    order.paymentStatus = 'PAID';
    order.paidAt = Date.now();
    order.orderStatus = 'PREPARING';

    // Start timer for kitchen items
    order.items.forEach(it => {
      if (it.isKitchenItem) {
        it.startedAt = Date.now();
      }
    });

    const table = this.tables.find(t => t.tableNumber === order.tableNumber);
    if (table) {
      table.status = 'OCCUPIED';
    }

    this.rebuildCustomerDatabase();
    sound.playCashRegister();
    sound.playKitchenChime();
    this.persist();
  }

  /**
   * Chef clicks "Sent to Table"
   */
  public markOrderServed(orderId: string) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const now = Date.now();
    order.orderStatus = 'SERVED';
    order.servedAt = now;

    const table = this.tables.find(t => t.tableNumber === order.tableNumber);
    if (table) {
      table.status = 'SERVED';
      table.servedAt = now;
    }

    this.persist();
  }

  /**
   * Chef clicks "Need Help" emergency buzzer
   */
  public triggerChefHelp(orderId: string, needed = true) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    order.chefHelpRequested = needed;
    if (needed) {
      sound.playEmergencyHelp();
    }
    this.persist();
  }

  /**
   * Biller clears table after customer departs
   */
  public clearTable(tableNumber: number) {
    const table = this.tables.find(t => t.tableNumber === tableNumber);
    if (!table) return;

    // Mark current active orders for this table as COMPLETED
    this.orders.forEach(o => {
      if (o.tableNumber === tableNumber && o.orderStatus !== 'CANCELLED') {
        o.orderStatus = 'COMPLETED';
        if (!o.completedAt) o.completedAt = Date.now();
      }
    });

    table.status = 'FREE';
    table.customerName = undefined;
    table.customerPhone = undefined;
    table.sessionStartedAt = undefined;
    table.servedAt = undefined;
    table.activeOrderId = undefined;

    this.persist();
  }

  /**
   * Biller logs distributor inventory arrival
   */
  public logStockInward(params: {
    itemId: string;
    quantityAdded: number;
    supplierName: string;
  }) {
    const item = this.menu.find(m => m.id === params.itemId);
    if (!item) return;

    const newLog: StockInwardLog = {
      id: `log_${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      quantityAdded: params.quantityAdded,
      supplierName: params.supplierName,
      loggedBy: 'Biller Desk',
      status: 'PENDING_APPROVAL',
      createdAt: Date.now()
    };

    this.stockLogs.unshift(newLog);
    this.persist();
  }

  /**
   * Owner reviews distributor stock intake
   */
  public reviewStockInward(logId: string, approve: boolean, reviewerName = 'Owner') {
    const log = this.stockLogs.find(l => l.id === logId);
    if (!log || log.status !== 'PENDING_APPROVAL') return;

    log.status = approve ? 'APPROVED' : 'REJECTED';
    log.reviewedAt = Date.now();
    log.reviewedBy = reviewerName;

    if (approve) {
      const item = this.menu.find(m => m.id === log.itemId);
      if (item) {
        item.stockQuantity = (item.stockQuantity || 0) + log.quantityAdded;
        item.inStock = item.stockQuantity > 0;
      }
    }

    this.persist();
  }

  /**
   * Toggle out of stock for kitchen or retail item
   */
  public toggleStockAvailability(itemId: string, inStock?: boolean) {
    const item = this.menu.find(m => m.id === itemId);
    if (!item) return;

    item.inStock = inStock !== undefined ? inStock : !item.inStock;
    this.persist();
  }

  /**
   * Owner updates or creates dish
   */
  public saveMenuItem(item: MenuItem) {
    const idx = this.menu.findIndex(m => m.id === item.id);
    if (idx >= 0) {
      this.menu[idx] = item;
    } else {
      this.menu.push(item);
    }
    this.persist();
  }

  /**
   * Owner deletes dish
   */
  public deleteMenuItem(itemId: string) {
    this.menu = this.menu.filter(m => m.id !== itemId);
    this.persist();
  }

  /**
   * Owner creates coupon
   */
  public saveCoupon(coupon: Coupon) {
    const idx = this.coupons.findIndex(c => c.code === coupon.code);
    if (idx >= 0) {
      this.coupons[idx] = coupon;
    } else {
      this.coupons.push(coupon);
    }
    this.persist();
  }

  /**
   * Reset to initial state for demo testing
   */
  public resetToDefaults() {
    this.menu = INITIAL_MENU_ITEMS;
    this.tables = INITIAL_TABLES;
    this.orders = this.getSeedOrders();
    this.stockLogs = this.getSeedStockLogs();
    this.coupons = INITIAL_COUPONS;
    this.rebuildCustomerDatabase();
    this.persist();
  }
}

export const cafeStore = new CafeStore();
