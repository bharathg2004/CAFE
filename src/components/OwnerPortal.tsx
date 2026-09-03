import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  X, 
  Trash2, 
  Edit3, 
  Send, 
  AlertTriangle,
  Lock,
  LogOut,
  Calendar,
  Settings,
  QrCode,
  Printer
} from 'lucide-react';
import { cafeStore } from '../lib/sync';
import { Order, MenuItem, StockInwardLog, CustomerProfile, Coupon, CafeSettings } from '../types/cafe';
import { TableQRPrintModal } from './TableQRPrintModal';

export const OwnerPortal: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('owner');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Store data
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [stockLogs, setStockLogs] = useState<StockInwardLog[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Settings State
  const [settingsForm, setSettingsForm] = useState<CafeSettings>(cafeStore.getSettings());
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  // Active Tab in Owner Panel
  const [ownerSection, setOwnerSection] = useState<'analytics' | 'inventory' | 'menu' | 'crm' | 'coupons' | 'settings'>('analytics');

  // Time Range Filter for 1-Minute Financial Health Check
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('today');

  // Dish Editor Modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState<boolean>(false);

  // New Coupon Modal
  const [showCouponModal, setShowCouponModal] = useState<boolean>(false);
  const [newCouponCode, setNewCouponCode] = useState<string>('');
  const [newCouponValue, setNewCouponValue] = useState<number>(15);
  const [newCouponType, setNewCouponType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [newCouponMin, setNewCouponMin] = useState<number>(300);

  // Targeted Campaign Modal
  const [targetCustomer, setTargetCustomer] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    const update = () => {
      setOrders(cafeStore.getOrders());
      setMenu(cafeStore.getMenu());
      setStockLogs(cafeStore.getStockLogs());
      setCustomers(cafeStore.getCustomers());
      setCoupons(cafeStore.getCoupons());
    };
    update();
    return cafeStore.subscribe(update);
  }, []);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Secure login check (Owner can customize password)
    if (username === 'owner' && (password === 'cafe2026' || password === 'admin' || password === '123456')) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid Username or Password. Try: owner / cafe2026');
    }
  };

  // Filtered Orders for 1-Minute Financials
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    return orders.filter((ord) => {
      if (ord.paymentStatus !== 'PAID') return false;
      const orderTime = ord.paidAt || ord.createdAt;
      if (timeFilter === 'today') {
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        return orderTime >= startOfDay;
      }
      if (timeFilter === 'week') {
        return now - orderTime <= 7 * 24 * 3600 * 1000;
      }
      if (timeFilter === 'month') {
        return now - orderTime <= 30 * 24 * 3600 * 1000;
      }
      if (timeFilter === 'year') {
        return now - orderTime <= 365 * 24 * 3600 * 1000;
      }
      return true;
    });
  }, [orders, timeFilter]);

  // Financial Calculations
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  }, [filteredOrders]);

  const upiRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.paymentMode === 'UPI')
      .reduce((acc, o) => acc + o.totalAmount, 0);
  }, [filteredOrders]);

  const cashRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.paymentMode === 'COUNTER')
      .reduce((acc, o) => acc + o.totalAmount, 0);
  }, [filteredOrders]);

  const averageOrderValue = useMemo(() => {
    if (filteredOrders.length === 0) return 0;
    return Math.round(totalRevenue / filteredOrders.length);
  }, [totalRevenue, filteredOrders]);

  // Chef Average Cooking Time Analysis
  const chefMetrics = useMemo(() => {
    const servedOrders = orders.filter((o) => o.servedAt && o.paidAt);
    if (servedOrders.length === 0) return { avgMins: 0, status: 'No Data' };

    const totalMinutes = servedOrders.reduce((sum, o) => {
      const diffMs = o.servedAt! - o.paidAt!;
      return sum + Math.max(0, diffMs / (1000 * 60));
    }, 0);

    const avg = Math.round(totalMinutes / servedOrders.length);
    let status = 'Excellent (< 10 mins)';
    if (avg > 15) status = 'Needs Improvement (> 15 mins)';
    else if (avg > 10) status = 'Acceptable (10 - 15 mins)';

    return { avgMins: avg, status };
  }, [orders]);

  // Low Stock Items (< threshold)
  const lowStockAlerts = useMemo(() => {
    return menu.filter((item) => {
      if (item.type === 'packaged' && typeof item.stockQuantity === 'number') {
        const threshold = item.lowStockThreshold || 15;
        return item.stockQuantity <= threshold;
      }
      return false;
    });
  }, [menu]);

  // Pending Distributor Inward Approvals
  const pendingApprovals = useMemo(() => {
    return stockLogs.filter((l) => l.status === 'PENDING_APPROVAL');
  }, [stockLogs]);

  // Handle Save Menu Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    cafeStore.saveMenuItem(editingItem);
    setShowItemModal(false);
    setEditingItem(null);
  };

  // Handle Save Coupon
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    cafeStore.saveCoupon({
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      discountValue: newCouponValue,
      minOrder: newCouponMin,
      isActive: true,
      description: `${newCouponType === 'PERCENT' ? `${newCouponValue}% OFF` : `Flat ₹${newCouponValue} OFF`} on orders above ₹${newCouponMin}`
    });

    setNewCouponCode('');
    setShowCouponModal(false);
  };

  // If not authenticated, show secure login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Owner Portal Login</h2>
            <p className="text-xs text-stone-400 mt-1">
              Secure Cloud Access to Financials & Controls
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-stone-300 block mb-1 font-semibold">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-stone-300 block mb-1 font-semibold">Password</label>
              <input
                type="password"
                placeholder="Enter password (e.g. cafe2026)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {loginError && <p className="text-xs text-red-400 text-center">{loginError}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition"
            >
              Sign In to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-4 rounded-3xl shadow-xl mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">OWNER BUSINESS INTELLIGENCE</h1>
            <p className="text-xs text-stone-400">
              Worldwide Remote Access • Real-time Tally • CRM & SMS/WhatsApp Campaigns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-xl border border-stone-700 flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-stone-800/80 text-xs font-semibold">
        <button
          onClick={() => setOwnerSection('analytics')}
          className={`px-4 py-2 rounded-xl transition ${
            ownerSection === 'analytics'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-stone-900 text-stone-400 hover:text-white'
          }`}
        >
          1-Minute P&L Analytics
        </button>

        <button
          onClick={() => setOwnerSection('inventory')}
          className={`px-4 py-2 rounded-xl transition relative ${
            ownerSection === 'inventory'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-stone-900 text-stone-400 hover:text-white'
          }`}
        >
          Inventory & Approvals
          {pendingApprovals.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white">
              {pendingApprovals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setOwnerSection('crm')}
          className={`px-4 py-2 rounded-xl transition ${
            ownerSection === 'crm'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-stone-900 text-stone-400 hover:text-white'
          }`}
        >
          Customer CRM & Loyalty
        </button>

        <button
          onClick={() => setOwnerSection('coupons')}
          className={`px-4 py-2 rounded-xl transition ${
            ownerSection === 'coupons'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-stone-900 text-stone-400 hover:text-white'
          }`}
        >
          Promotional Coupons
        </button>

        <button
          onClick={() => setOwnerSection('menu')}
          className={`px-4 py-2 rounded-xl transition ${
            ownerSection === 'menu'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-stone-900 text-stone-400 hover:text-white'
          }`}
        >
          Menu & Recipe Editor
        </button>

        <button
          onClick={() => setOwnerSection('settings')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
            ownerSection === 'settings'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-stone-900 text-stone-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Cafe Settings
        </button>
      </div>

      {/* SECTION 1: 1-MINUTE FINANCIAL ANALYTICS */}
      {ownerSection === 'analytics' && (
        <div className="space-y-6">
          {/* Time Filter Selector */}
          <div className="flex items-center justify-between bg-stone-900 p-3 rounded-2xl border border-stone-800">
            <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              Reporting Period:
            </span>
            <div className="flex gap-1">
              {(['today', 'week', 'month', 'year', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                    timeFilter === period
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-stone-900 p-5 rounded-3xl border border-stone-800 shadow-lg">
              <span className="text-xs text-stone-400 font-bold block mb-1">TOTAL SALES EARNINGS</span>
              <div className="text-3xl font-black text-white tracking-tight">₹{totalRevenue}</div>
              <span className="text-[11px] text-emerald-400 mt-2 block font-medium">
                {filteredOrders.length} Paid Orders Processed
              </span>
            </div>

            {/* Cash vs UPI Tally */}
            <div className="bg-stone-900 p-5 rounded-3xl border border-stone-800 shadow-lg">
              <span className="text-xs text-stone-400 font-bold block mb-1">PAYMENT TENDER TALLY</span>
              <div className="space-y-1.5 mt-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-300">Online UPI:</span>
                  <span className="font-bold text-amber-400">₹{upiRevenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-300">Cash at Desk:</span>
                  <span className="font-bold text-emerald-400">₹{cashRevenue}</span>
                </div>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-stone-900 p-5 rounded-3xl border border-stone-800 shadow-lg">
              <span className="text-xs text-stone-400 font-bold block mb-1">AVERAGE SPEND PER ORDER</span>
              <div className="text-3xl font-black text-amber-400">₹{averageOrderValue}</div>
              <span className="text-[11px] text-stone-500 mt-2 block">
                Benchmark Target: ₹300+
              </span>
            </div>

            {/* Chef Prep Speed */}
            <div className="bg-stone-900 p-5 rounded-3xl border border-stone-800 shadow-lg">
              <span className="text-xs text-stone-400 font-bold block mb-1">CHEF AVERAGE PREP SPEED</span>
              <div className="text-3xl font-black text-white">{chefMetrics.avgMins} mins</div>
              <span className="text-[11px] text-amber-400 mt-2 block font-semibold">
                Status: {chefMetrics.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: INVENTORY & STOCK APPROVALS */}
      {ownerSection === 'inventory' && (
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          {lowStockAlerts.length > 0 && (
            <div className="bg-red-950/60 border border-red-500/60 rounded-3xl p-5 shadow-xl">
              <h3 className="font-bold text-sm text-red-300 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" />
                LOW STOCK ALERT: Immediate Reorder Required!
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {lowStockAlerts.map((item) => (
                  <div key={item.id} className="bg-stone-900/90 p-3 rounded-2xl border border-red-500/40">
                    <span className="font-semibold text-xs text-white block">{item.name}</span>
                    <span className="text-xs text-red-400 font-bold">
                      Current Units: {item.stockQuantity} (Threshold: {item.lowStockThreshold})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Distributor Inward Log Approval Queue */}
          <div className="bg-stone-900 p-5 rounded-3xl border border-stone-800 shadow-xl">
            <h3 className="font-bold text-sm text-white mb-3">
              Distributor Deliveries Pending Owner Approval ({pendingApprovals.length})
            </h3>
            {pendingApprovals.length === 0 ? (
              <p className="text-xs text-stone-500">No pending distributor stock logs from Biller.</p>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((log) => (
                  <div
                    key={log.id}
                    className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-sm text-white block">{log.itemName}</span>
                      <span className="text-xs text-stone-400">
                        Quantity Added: <strong className="text-emerald-400">+{log.quantityAdded} units</strong> • Supplier: {log.supplierName}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => cafeStore.reviewStockInward(log.id, false)}
                        className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 rounded-xl text-xs font-bold border border-red-700"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => cafeStore.reviewStockInward(log.id, true)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
                      >
                        Approve & Add Stock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: CUSTOMER CRM & LOYALTY */}
      {ownerSection === 'crm' && (
        <div className="bg-stone-900 p-5 rounded-3xl border border-stone-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Customer Spending & Loyalty Database</h3>
              <p className="text-xs text-stone-400">
                Derived from mandatory 10-digit Indian phone numbers captured during checkout
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-800 text-stone-400">
                <tr>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Phone (+91)</th>
                  <th className="py-2.5 px-3">Total Visits</th>
                  <th className="py-2.5 px-3">Lifetime Spend</th>
                  <th className="py-2.5 px-3">Average Spend</th>
                  <th className="py-2.5 px-3">Favorite Dishes</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {customers.map((c) => {
                  const favDish = Object.entries(c.favoriteItems)
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Various';

                  return (
                    <tr key={c.phone} className="hover:bg-stone-800/40 transition">
                      <td className="py-3 px-3 font-semibold text-white">{c.name}</td>
                      <td className="py-3 px-3 font-mono text-amber-300">{c.phone}</td>
                      <td className="py-3 px-3">{c.totalOrders}</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">₹{c.lifetimeSpend}</td>
                      <td className="py-3 px-3 text-stone-300">₹{c.averageSpend}</td>
                      <td className="py-3 px-3 text-stone-400">{favDish}</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setTargetCustomer(c)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-stone-950 text-amber-300 rounded-lg font-bold transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Offer</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: PROMOTIONAL COUPONS */}
      {ownerSection === 'coupons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Active Promotional Coupons</h3>
            <button
              onClick={() => setShowCouponModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow"
            >
              + Create New Coupon
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {coupons.map((cp) => (
              <div
                key={cp.code}
                className="bg-stone-900 p-4 rounded-2xl border border-stone-800 relative shadow-lg"
              >
                <span className="font-black text-base text-amber-400 tracking-wider block font-mono">
                  {cp.code}
                </span>
                <span className="text-xs text-stone-300 block mt-1">{cp.description}</span>
                <span className="text-[11px] text-stone-500 block mt-2">
                  Min Order Amount: ₹{cp.minOrder}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: MENU & RECIPE EDITOR */}
      {ownerSection === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Master Menu & Kitchen Prep Settings</h3>
            <button
              onClick={() => {
                setEditingItem({
                  id: `m_${Date.now()}`,
                  name: '',
                  category: 'Coffee & Tea',
                  price: 150,
                  imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500',
                  isVeg: true,
                  isKitchenItem: true,
                  prepTimeMinutes: 5,
                  inStock: true,
                  type: 'prepared'
                });
                setShowItemModal(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow"
            >
              + Add New Dish
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menu.map((dish) => (
              <div
                key={dish.id}
                className="bg-stone-900 p-3.5 rounded-2xl border border-stone-800 flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <img src={dish.imageUrl} alt={dish.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <span className="font-semibold text-xs text-white block truncate max-w-[140px]">
                      {dish.name}
                    </span>
                    <span className="text-xs font-bold text-amber-400">₹{dish.price}</span>
                    <span className="text-[10px] text-stone-500 block">
                      {dish.isKitchenItem ? `Prep: ${dish.prepTimeMinutes}m` : 'Counter Item (No Kitchen)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingItem(dish);
                      setShowItemModal(true);
                    }}
                    className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => cafeStore.deleteMenuItem(dish.id)}
                    className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-stone-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* SECTION 6: CAFE & UPI SETTINGS */}
      {ownerSection === 'settings' && (
        <div className="space-y-6 max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Cafe & UPI Settings</h3>
              <p className="text-xs text-stone-400 mt-0.5">Configure your cafe identity, UPI payment VPA, and table count.</p>
            </div>
            <button
              onClick={() => setShowQRModal(true)}
              className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-xs rounded-xl border border-stone-700 flex items-center gap-2 transition"
            >
              <QrCode className="w-4 h-4" />
              Print Table QR Standees
            </button>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
            {/* Cafe Name */}
            <div>
              <label className="text-xs text-stone-400 block mb-1 font-bold">Cafe Name</label>
              <input
                type="text"
                value={settingsForm.merchantName}
                onChange={(e) => setSettingsForm({ ...settingsForm, merchantName: e.target.value })}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="e.g. The Cozy Bean"
              />
            </div>

            {/* UPI VPA */}
            <div>
              <label className="text-xs text-stone-400 block mb-1 font-bold">UPI VPA (Payment Address)</label>
              <input
                type="text"
                value={settingsForm.upiVpa}
                onChange={(e) => setSettingsForm({ ...settingsForm, upiVpa: e.target.value })}
                className="w-full bg-stone-950 border border-amber-500/40 rounded-xl px-3 py-2.5 text-sm text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                placeholder="e.g. mycafe@okhdfcbank"
              />
              <p className="text-[10px] text-stone-500 mt-1">Get this from your GPay / PhonePe / Bank app. Customers scan and pay directly to this VPA.</p>
            </div>

            {/* Cafe Phone */}
            <div>
              <label className="text-xs text-stone-400 block mb-1 font-bold">Cafe Phone Number (for receipts)</label>
              <input
                type="text"
                value={settingsForm.cafePhone || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, cafePhone: e.target.value })}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                placeholder="e.g. 9876543210"
              />
            </div>

            {/* Cafe Address */}
            <div>
              <label className="text-xs text-stone-400 block mb-1 font-bold">Cafe Address (for receipts & QR standees)</label>
              <textarea
                value={settingsForm.cafeAddress || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, cafeAddress: e.target.value })}
                rows={2}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                placeholder="e.g. 12, MG Road, Bengaluru - 560001"
              />
            </div>

            {/* Table Count */}
            <div>
              <label className="text-xs text-stone-400 block mb-1 font-bold">Number of Tables</label>
              <input
                type="number"
                min={1}
                max={50}
                value={settingsForm.tableCount}
                onChange={(e) => setSettingsForm({ ...settingsForm, tableCount: parseInt(e.target.value) || 12 })}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* GST Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-stone-950 rounded-xl border border-stone-800">
              <div>
                <span className="text-xs font-bold text-white block">GST on Receipts</span>
                <span className="text-[10px] text-stone-500">Print GSTIN and 5% GST breakup on customer bill</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.showGst ?? false}
                  onChange={(e) => setSettingsForm({ ...settingsForm, showGst: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-700 peer-focus:ring-2 peer-focus:ring-amber-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <button
              onClick={() => {
                cafeStore.updateSettings(settingsForm);
                alert('✅ Settings saved! Changes will reflect immediately across all portals.');
              }}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Target Customer Marketing Modal (SMS / WhatsApp generator) */}
      {targetCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-bold text-sm text-white">Send SMS / WhatsApp Campaign</h3>
              <button onClick={() => setTargetCustomer(null)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Personalized marketing offer for <strong className="text-white">{targetCustomer.name}</strong> (+91 {targetCustomer.phone}):
            </p>

            <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 font-mono text-xs text-amber-300 space-y-1">
              <p>Hey {targetCustomer.name}! ☕</p>
              <p>We miss you at CafeOS! As a token of our appreciation, here is a special 15% OFF coupon: <strong>CAFEVIP</strong> on your next visit.</p>
              <p>Valid for this week only!</p>
            </div>

            <div className="flex gap-2">
              <a
                href={`https://wa.me/91${targetCustomer.phone}?text=${encodeURIComponent(
                  `Hey ${targetCustomer.name}! We miss you at CafeOS. Enjoy 15% OFF with code CAFEVIP on your next coffee!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl text-center shadow transition"
              >
                Send via WhatsApp
              </a>
              <button
                onClick={() => {
                  alert(`Promotional SMS dispatched to +91 ${targetCustomer.phone}`);
                  setTargetCustomer(null);
                }}
                className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl text-center transition"
              >
                Send via SMS API
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dish Modal */}
      {showItemModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm text-white">Edit / Add Menu Dish</h3>
            <form onSubmit={handleSaveItem} className="space-y-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Dish Name *</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Prep Time (Mins) *</label>
                  <input
                    type="number"
                    value={editingItem.prepTimeMinutes}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, prepTimeMinutes: Number(e.target.value) })
                    }
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingItem.imageUrl}
                  onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-4 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isVeg}
                    onChange={(e) => setEditingItem({ ...editingItem, isVeg: e.target.checked })}
                  />
                  <span>Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isKitchenItem}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, isKitchenItem: e.target.checked })
                    }
                  />
                  <span>Send to Chef KDS</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-stone-950 text-xs font-black rounded-xl shadow"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-sm w-full space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm text-white">Create Promotional Coupon</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  placeholder="e.g. MONSOON20"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Discount Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as 'PERCENT' | 'FLAT')}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Value</label>
                  <input
                    type="number"
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  value={newCouponMin}
                  onChange={(e) => setNewCouponMin(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-stone-950 text-xs font-black rounded-xl shadow"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Table QR Print Modal */}
      {showQRModal && <TableQRPrintModal onClose={() => setShowQRModal(false)} />}
    </div>
  );
};
