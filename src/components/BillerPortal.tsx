import React, { useState, useEffect, useMemo } from 'react';
import { 
  MonitorDot, 
  PlusCircle, 
  Calculator, 
  PackagePlus, 
  X, 
  Check, 
  Bell,
  QrCode,
  Printer
} from 'lucide-react';
import { cafeStore } from '../lib/sync';
import { Order, MenuItem, TableSession } from '../types/cafe';
import { TableQRPrintModal } from './TableQRPrintModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';

export const BillerPortal: React.FC = () => {
  const [tables, setTables] = useState<TableSession[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);

  // Modals
  const [showWalkinModal, setShowWalkinModal] = useState<boolean>(false);
  const [showCashCalcModal, setShowCashCalcModal] = useState<Order | null>(null);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [showStockInwardModal, setShowStockInwardModal] = useState<boolean>(false);
  const [showQRPrintModal, setShowQRPrintModal] = useState<boolean>(false);
  const [receiptOrder, setReceiptOrder] = useState<{ order: Order; cashTendered?: number } | null>(null);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<number>(1);

  // Walk-in order state
  const [walkinName, setWalkinName] = useState<string>('');
  const [walkinPhone, setWalkinPhone] = useState<string>('');
  const [walkinCart, setWalkinCart] = useState<{ [itemId: string]: number }>({});
  const [walkinSearch, setWalkinSearch] = useState<string>('');

  // Stock Inward state (Distributor arrival)
  const [inwardItemId, setInwardItemId] = useState<string>('');
  const [inwardQuantity, setInwardQuantity] = useState<string>('');
  const [inwardSupplier, setInwardSupplier] = useState<string>('');

  // Live timer for delayed kitchen orders
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const update = () => {
      setTables(cafeStore.getTables());
      setOrders(cafeStore.getOrders());
      setMenu(cafeStore.getMenu());
    };
    update();
    const unsub = cafeStore.subscribe(update);
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // Detect overdue kitchen items
  const overdueAlerts = useMemo(() => {
    const alerts: { orderNumber: number; tableNumber: number; itemName: string; overdueMins: number }[] = [];
    orders.forEach((o) => {
      if (o.paymentStatus === 'PAID' && o.orderStatus === 'PREPARING') {
        o.items.forEach((it) => {
          if (it.isKitchenItem) {
            const prepMs = (it.prepTimeMinutes || 5) * 60 * 1000;
            const start = it.startedAt || o.paidAt || o.createdAt;
            const elapsed = currentTime - start;
            if (elapsed > prepMs) {
              alerts.push({
                orderNumber: o.orderNumber,
                tableNumber: o.tableNumber,
                itemName: it.name,
                overdueMins: Math.floor((elapsed - prepMs) / (1000 * 60))
              });
            }
          }
        });
      }
    });
    return alerts;
  }, [orders, currentTime]);

  // Packaged items for distributor inward
  const packagedItems = useMemo(() => {
    return menu.filter((m) => m.type === 'packaged');
  }, [menu]);

  // Handle Walk-in Order Placement
  const handlePlaceWalkin = () => {
    if (!walkinName.trim()) {
      alert('Please enter Customer Name');
      return;
    }
    const phoneClean = walkinPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      alert('Please enter valid 10-digit Indian Mobile Number');
      return;
    }

    const items = Object.entries(walkinCart).map(([id, qty]) => ({
      menuItemId: id,
      quantity: qty
    }));

    if (items.length === 0) {
      alert('Cart is empty. Please select dishes.');
      return;
    }

    const newOrd = cafeStore.placeOrder({
      tableNumber: selectedTableForOrder,
      customerName: walkinName,
      customerPhone: phoneClean,
      items,
      paymentMode: 'COUNTER'
    });

    // Reset walk-in form
    setWalkinName('');
    setWalkinPhone('');
    setWalkinCart({});
    setShowWalkinModal(false);

    // Prompt for cash calculator
    setShowCashCalcModal(newOrd);
  };

  // Cash Change Calculation
  const changeDue = useMemo(() => {
    if (!showCashCalcModal) return 0;
    const tendered = parseFloat(cashTendered) || 0;
    return tendered - showCashCalcModal.totalAmount;
  }, [showCashCalcModal, cashTendered]);

  // Handle Distributor Stock Inward Submission
  const handleSubmitStockInward = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(inwardQuantity, 10);
    if (!inwardItemId || isNaN(qty) || qty <= 0 || !inwardSupplier.trim()) {
      alert('Please enter valid item, quantity, and distributor/supplier name.');
      return;
    }

    cafeStore.logStockInward({
      itemId: inwardItemId,
      quantityAdded: qty,
      supplierName: inwardSupplier.trim()
    });

    setInwardItemId('');
    setInwardQuantity('');
    setInwardSupplier('');
    setShowStockInwardModal(false);
    alert('Stock addition submitted successfully! It is now pending Owner Approval.');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-6 font-sans">
      {/* Overdue Kitchen Order Banner Alerts */}
      {overdueAlerts.length > 0 && (
        <div className="mb-4 bg-red-950/80 border-2 border-red-500 rounded-2xl p-3.5 shadow-xl animate-pulse flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600 text-white">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-red-300 block">
                KITCHEN OVERDUE ALERT: Chef has exceeded allocated preparation time!
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {overdueAlerts.map((a, i) => (
                  <span key={i} className="text-xs bg-red-900/80 text-white px-2 py-0.5 rounded font-mono">
                    Table #{a.tableNumber} - {a.itemName} (+{a.overdueMins}m overdue)
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-red-300 hidden md:block">
            Please notify the kitchen chef immediately!
          </span>
        </div>
      )}

      {/* POS Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-4 rounded-3xl shadow-xl mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md">
            <MonitorDot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">BILLER & CASHIER POS</h1>
            <p className="text-xs text-stone-400">
              Windows Workstation Mode • Auto Cash Calculator • Distributor Stock Inward
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Table QRs */}
          <button
            onClick={() => setShowQRPrintModal(true)}
            className="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs sm:text-sm rounded-xl border border-stone-700 flex items-center gap-2 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Print Table QRs</span>
          </button>

          {/* Create Walk-in Order Button */}
          <button
            onClick={() => setShowWalkinModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Walk-in Order</span>
          </button>

          {/* Distributor Stock Inward Button */}
          <button
            onClick={() => setShowStockInwardModal(true)}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs sm:text-sm rounded-xl border border-stone-700 flex items-center gap-2 transition cursor-pointer"
          >
            <PackagePlus className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Inward Stock</span>
          </button>
        </div>
      </div>

      {/* Table Occupancy Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-stone-300 uppercase tracking-wider">
            Cafe Tables Live Grid (12 Tables)
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Free
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Occupied/Prep
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Served
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tables.map((tbl) => {
            const activeOrd = orders.find(
              (o) => o.tableNumber === tbl.tableNumber && o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED'
            );

            let bgClass = 'border-stone-800 bg-stone-900/60';
            let badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            let label = 'FREE';

            if (tbl.status === 'OCCUPIED' || activeOrd?.paymentStatus === 'PAID') {
              bgClass = 'border-amber-500/60 bg-amber-950/20 shadow-lg';
              badgeClass = 'bg-amber-500 text-stone-950 font-black';
              label = 'OCCUPIED';
            } else if (tbl.status === 'BILLING' || activeOrd?.paymentStatus === 'PENDING') {
              bgClass = 'border-red-500/60 bg-red-950/20 animate-pulse';
              badgeClass = 'bg-red-500 text-white font-black';
              label = 'PAY PENDING';
            } else if (tbl.status === 'SERVED') {
              bgClass = 'border-indigo-500/60 bg-indigo-950/20';
              badgeClass = 'bg-indigo-500 text-white font-black';
              label = 'SERVED';
            }

            return (
              <div
                key={tbl.tableNumber}
                className={`p-3 rounded-2xl border-2 transition flex flex-col justify-between min-h-[140px] ${bgClass}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-sm text-white">T-{tbl.tableNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border ${badgeClass}`}>
                      {label}
                    </span>
                  </div>

                  {tbl.customerName ? (
                    <div className="mt-1">
                      <span className="text-xs font-bold text-stone-200 block truncate">
                        {tbl.customerName}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {tbl.customerPhone}
                      </span>
                      {activeOrd && (
                        <span className="text-xs font-extrabold text-amber-400 block mt-1">
                          ₹{activeOrd.totalAmount}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-stone-600 block mt-2">Available for guests</span>
                  )}
                </div>

                {/* Table Actions */}
                <div className="mt-2 pt-2 border-t border-stone-800/80 flex items-center justify-between gap-1">
                  {tbl.status !== 'FREE' ? (
                    <button
                      onClick={() => cafeStore.clearTable(tbl.tableNumber)}
                      className="w-full py-1 text-[11px] font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition"
                    >
                      Clear Table
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedTableForOrder(tbl.tableNumber);
                        setShowWalkinModal(true);
                      }}
                      className="w-full py-1 text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500 hover:text-stone-950 text-amber-400 rounded-lg transition border border-amber-500/30"
                    >
                      Seat & Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Counter Pending Payments & Biller Non-Kitchen Delivery Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Cash Collection */}
        <div className="bg-stone-900 p-5 rounded-3xl border border-stone-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              Pending Counter Payments (Cash / POS QR)
            </h3>
            <span className="text-xs text-stone-500">
              Orders sent to kitchen ONLY after payment
            </span>
          </div>

          <div className="space-y-3">
            {orders.filter((o) => o.paymentStatus === 'PENDING').length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-xs">
                No pending counter payments. All orders are settled!
              </div>
            ) : (
              orders
                .filter((o) => o.paymentStatus === 'PENDING')
                .map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 bg-stone-950/80 rounded-2xl border border-amber-500/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-black text-xs">
                          Table #{ord.tableNumber}
                        </span>
                        <span className="font-bold text-xs text-white">{ord.customerName}</span>
                        <span className="text-xs text-stone-400 font-mono">({ord.customerPhone})</span>
                      </div>
                      <div className="mt-1 text-xs text-stone-400">
                        {ord.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                      </div>
                      <span className="text-sm font-extrabold text-amber-400 block mt-1">
                        Bill Total: ₹{ord.totalAmount}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowCashCalcModal(ord);
                          setCashTendered('');
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition"
                      >
                        Collect Cash / Calc Change
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Counter Retail Delivery (Cigarettes, Bottled items) */}
        <div className="bg-stone-900 p-5 rounded-3xl border border-stone-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-amber-400" />
              Counter & Retail Dispatch (Cigarettes & Packaged)
            </h3>
            <span className="text-xs text-stone-500">
              Dispatched from cashier desk (Not sent to Chef)
            </span>
          </div>

          <div className="space-y-3">
            {orders
              .filter((o) => o.paymentStatus === 'PAID' && o.items.some((it) => !it.isKitchenItem))
              .slice(0, 5)
              .map((ord) => {
                const retailItems = ord.items.filter((it) => !it.isKitchenItem);
                return (
                  <div
                    key={ord.id}
                    className="p-3 bg-stone-950 rounded-2xl border border-stone-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-200 font-bold text-xs">
                          Table #{ord.tableNumber}
                        </span>
                        <span className="text-xs font-semibold text-white">{ord.customerName}</span>
                      </div>
                      <div className="mt-1.5 space-y-1">
                        {retailItems.map((ri) => (
                          <div key={ri.id} className="text-xs text-amber-300 font-medium">
                            • {ri.quantity}x {ri.name} (Hand deliver to guest)
                          </div>
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold">
                      Paid & Handed
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Cash Change Calculator Modal (Zero mental math for cashier!) */}
      {showCashCalcModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-bold text-sm text-white">Cash Register & Change Calculator</h3>
              <button
                onClick={() => setShowCashCalcModal(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
              <div className="flex justify-between text-xs text-stone-400">
                <span>Bill Total Amount:</span>
                <span className="font-bold text-amber-400 text-sm">
                  ₹{showCashCalcModal.totalAmount}
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-400">
                <span>Customer:</span>
                <span className="text-white font-semibold">{showCashCalcModal.customerName}</span>
              </div>
              <div className="flex justify-between text-xs text-stone-400">
                <span>Table:</span>
                <span className="text-white font-semibold">Table #{showCashCalcModal.tableNumber}</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-300 block mb-1 font-bold">
                Enter Cash Received from Customer (₹)
              </label>
              <input
                type="number"
                autoFocus
                placeholder="e.g. 500"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="w-full bg-stone-950 border border-amber-500/60 rounded-2xl px-4 py-3 text-lg font-black text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Change Due Display */}
            {parseFloat(cashTendered) > 0 && (
              <div className={`p-4 rounded-2xl border text-center ${
                changeDue >= 0 ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300' : 'bg-red-950/70 border-red-500 text-red-300'
              }`}>
                <span className="text-[11px] font-bold uppercase tracking-wider block">
                  {changeDue >= 0 ? 'Change to Return to Customer:' : 'Shortage / Balance Remaining:'}
                </span>
                <span className="text-2xl font-black">₹{Math.abs(changeDue)}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const ord = showCashCalcModal;
                  const tendered = parseFloat(cashTendered) || ord.totalAmount;
                  cafeStore.confirmCounterPayment(ord.id);
                  setShowCashCalcModal(null);
                  setReceiptOrder({ order: ord, cashTendered: tendered });
                }}
                className="px-4 py-3.5 bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-xs rounded-2xl border border-stone-700 flex items-center justify-center gap-1.5 transition"
                title="Mark paid and open thermal receipt print"
              >
                <Printer className="w-4 h-4" />
                <span>Paid & Print Bill</span>
              </button>

              <button
                onClick={() => {
                  cafeStore.confirmCounterPayment(showCashCalcModal.id);
                  setShowCashCalcModal(null);
                }}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
              >
                <Check className="w-5 h-5" />
                <span>Mark Paid & Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distributor Stock Inward Modal */}
      {showStockInwardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-bold text-sm text-white">Log Distributor Stock Inward</h3>
              <button
                onClick={() => setShowStockInwardModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              When juice or ice cream distributors deliver crates, add quantity here. 
              <span className="text-amber-400 font-bold block mt-1">
                Note: This requires Owner Approval before inventory updates.
              </span>
            </p>

            <form onSubmit={handleSubmitStockInward} className="space-y-3">
              <div>
                <label className="text-xs text-stone-300 block mb-1">Select Packaged Product *</label>
                <select
                  value={inwardItemId}
                  onChange={(e) => setInwardItemId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Choose Item --</option>
                  {packagedItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Current Stock: {item.stockQuantity || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-stone-300 block mb-1">
                  Quantity Delivered by Distributor *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 24"
                  value={inwardQuantity}
                  onChange={(e) => setInwardQuantity(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-stone-300 block mb-1">Distributor / Supplier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Amul Ice Cream Agency / Fresh Organics"
                  value={inwardSupplier}
                  onChange={(e) => setInwardSupplier(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Submit for Owner Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Walk-in Order Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-base text-white">Create Walk-in Offline Order</h3>
              <button onClick={() => setShowWalkinModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 overflow-y-auto flex-1 space-y-4">
              {/* Customer & Table details */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Table #</label>
                  <select
                    value={selectedTableForOrder}
                    onChange={(e) => setSelectedTableForOrder(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    {tables.map((t) => (
                      <option key={t.tableNumber} value={t.tableNumber}>
                        Table #{t.tableNumber} {t.status !== 'FREE' ? '(Occupied)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">10-Digit Mobile *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Menu items selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-300">Select Items to Add</label>
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={walkinSearch}
                    onChange={(e) => setWalkinSearch(e.target.value)}
                    className="bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {menu
                    .filter((m) => m.name.toLowerCase().includes(walkinSearch.toLowerCase()))
                    .map((item) => {
                      const inCart = walkinCart[item.id] || 0;
                      return (
                        <div
                          key={item.id}
                          className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-semibold text-stone-200 block truncate max-w-[130px]">
                              {item.name}
                            </span>
                            <span className="text-xs font-bold text-amber-400">₹{item.price}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {inCart > 0 && (
                              <button
                                onClick={() => {
                                  setWalkinCart((prev) => {
                                    const next = (prev[item.id] || 0) - 1;
                                    if (next <= 0) {
                                      const copy = { ...prev };
                                      delete copy[item.id];
                                      return copy;
                                    }
                                    return { ...prev, [item.id]: next };
                                  });
                                }}
                                className="w-6 h-6 rounded bg-stone-800 text-stone-300 text-xs font-bold flex items-center justify-center"
                              >
                                -
                              </button>
                            )}
                            {inCart > 0 && (
                              <span className="text-xs font-bold text-white px-1">{inCart}</span>
                            )}
                            <button
                              onClick={() => {
                                setWalkinCart((prev) => ({
                                  ...prev,
                                  [item.id]: (prev[item.id] || 0) + 1
                                }));
                              }}
                              className="w-6 h-6 rounded bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
              <button
                onClick={() => setShowWalkinModal(false)}
                className="px-4 py-2 bg-stone-800 text-stone-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceWalkin}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-xl shadow"
              >
                Place Order &amp; Calculate Cash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table QR Standees Print Modal */}
      {showQRPrintModal && <TableQRPrintModal onClose={() => setShowQRPrintModal(false)} />}

      {/* Thermal Receipt Print Modal */}
      {receiptOrder && (
        <ThermalReceiptModal
          order={receiptOrder.order}
          cashTendered={receiptOrder.cashTendered}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
};
