import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Leaf, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  ChevronRight,
  Clock,
  ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cafeStore } from '../lib/sync';
import { MenuItem, Order } from '../types/cafe';
import { sound } from '../lib/audio';

interface Props {
  tableNumber: number;
}

export const CustomerPortal: React.FC<Props> = ({ tableNumber }) => {
  const settings = cafeStore.getSettings();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ [menuItemId: string]: number }>({});
  const [instructions, setInstructions] = useState<{ [menuItemId: string]: string }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Customer Checkout Details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [upiUtr, setUpiUtr] = useState<string>('');
  const [paymentChoice, setPaymentChoice] = useState<'UPI' | 'COUNTER'>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [orderConfirmed, setOrderConfirmed] = useState<Order | null>(null);

  // Active Table Order (Friend Sharing & Re-ordering)
  const [activeTableOrder, setActiveTableOrder] = useState<Order | undefined>(undefined);

  // 30-Minute Post-Serve Departure Alert
  const [showDeparturePrompt, setShowDeparturePrompt] = useState<boolean>(false);

  // Initialize table scan session timer
  useEffect(() => {
    cafeStore.startTableScanSession(tableNumber);
  }, [tableNumber]);

  // Sync with cafe store
  useEffect(() => {
    const update = () => {
      setMenu(cafeStore.getMenu());
      const activeOrd = cafeStore.getActiveOrderByTable(tableNumber);
      setActiveTableOrder(activeOrd);

      // Auto-fill friend's details if active order already placed on this table
      if (activeOrd && !customerName && activeOrd.customerName) {
        setCustomerName(activeOrd.customerName);
        setCustomerPhone(activeOrd.customerPhone);
      }

      // Check 30-minute departure alert condition
      if (activeOrd?.servedAt && activeOrd.orderStatus === 'SERVED') {
        const elapsedMinutes = (Date.now() - activeOrd.servedAt) / (1000 * 60);
        // Show prompt if > 30 minutes elapsed and table not yet cleared
        if (elapsedMinutes >= 30) {
          setShowDeparturePrompt(true);
          sound.playDepartureAlert();
        }
      } else {
        setShowDeparturePrompt(false);
      }
    };

    update();
    return cafeStore.subscribe(update);
  }, [tableNumber, customerName]);

  // Categories list
  const categories = useMemo(() => {
    const list: string[] = ['All'];
    menu.forEach(item => {
      if (!list.includes(item.category)) {
        list.push(item.category);
      }
    });
    return list;
  }, [menu]);

  // Filtered menu
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      if (vegOnly && !item.isVeg) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      return true;
    });
  }, [menu, selectedCategory, vegOnly]);

  // Cart Totals
  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const item = menu.find(m => m.id === id);
        return item ? { item, quantity: qty } : null;
      })
      .filter((x): x is { item: MenuItem; quantity: number } => x !== null);
  }, [cart, menu]);

  const totalCartAmount = useMemo(() => {
    return cartItems.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  }, [cartItems]);

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, q) => sum + q, 0);
  }, [cart]);

  // Cart operations
  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  // Indian 10-Digit Phone Validation
  const validatePhone = (phone: string): boolean => {
    const regex = /^[6-9]\d{9}$/;
    if (!regex.test(phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleCheckoutClick = () => {
    if (!customerName.trim()) {
      alert('Please enter your Name before placing order');
      return;
    }
    if (!validatePhone(customerPhone)) {
      return;
    }
    setShowPaymentModal(true);
  };

  const handleExecutePayment = (mode: 'UPI' | 'COUNTER') => {
    setIsProcessingPayment(true);

    setTimeout(() => {
      const itemsToOrder = cartItems.map(ci => ({
        menuItemId: ci.item.id,
        quantity: ci.quantity,
        cookingInstruction: instructions[ci.item.id] || undefined
      }));

      const newOrder = cafeStore.placeOrder({
        tableNumber,
        customerName,
        customerPhone,
        items: itemsToOrder,
        paymentMode: mode,
        upiTransactionId: mode === 'UPI' ? upiUtr.trim() || undefined : undefined
      });

      setOrderConfirmed(newOrder);
      setCart({});
      setInstructions({});
      setUpiUtr('');
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      setShowUpiModal(false);
      setIsCartOpen(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-28 max-w-lg mx-auto border-x border-stone-800 relative shadow-2xl">
      
      {/* 30-Minute Departure Notification Modal */}
      {showDeparturePrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hope you enjoyed your meal!</h3>
            <p className="text-xs text-stone-400 mb-6">
              It has been over 30 minutes since your dishes were served. Did you leave or do you still need the table?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeparturePrompt(false)}
                className="flex-1 py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold"
              >
                Still Here
              </button>
              <button
                onClick={() => {
                  setShowDeparturePrompt(false);
                  cafeStore.clearTable(tableNumber);
                }}
                className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold"
              >
                We&apos;ve Left
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-amber-950/50 to-stone-950 p-4 border-b border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-black text-xs">
              TABLE #{tableNumber}
            </div>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Connected
            </span>
          </div>

          {/* Veg-only toggle button */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              vegOnly 
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
                : 'bg-stone-900 border-stone-700 text-stone-400'
            }`}
          >
            <Leaf className={`w-3.5 h-3.5 ${vegOnly ? 'text-emerald-400' : 'text-stone-500'}`} />
            <span>Veg Only</span>
          </button>
        </div>

        {/* Friend Collaboration Banner (if order is active on same table) */}
        {activeTableOrder && (
          <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs flex items-center justify-between">
            <div>
              <span className="text-amber-400 font-bold block">
                Active Order running for {activeTableOrder.customerName}
              </span>
              <span className="text-stone-400 text-[11px]">
                {activeTableOrder.items.length} items ordered • Order #{activeTableOrder.orderNumber}
              </span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-medium">
              Shared Table
            </span>
          </div>
        )}
      </div>

      {/* Category Pills Carousel */}
      <div className="sticky top-[53px] z-20 bg-stone-950/90 backdrop-blur border-b border-stone-800/80 py-2.5 px-3 overflow-x-auto no-scrollbar flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Dish List */}
      <div className="p-3 grid grid-cols-2 gap-3">
        {filteredMenu.map((dish) => {
          const inCartQty = cart[dish.id] || 0;
          return (
            <div
              key={dish.id}
              className="bg-stone-900/90 rounded-2xl border border-stone-800/80 overflow-hidden flex flex-col justify-between shadow-sm hover:border-stone-700 transition"
            >
              {/* Dish Image */}
              <div className="relative aspect-video w-full bg-stone-800 overflow-hidden">
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {dish.isVeg && (
                  <span className="absolute top-2 left-2 p-1 rounded-md bg-stone-950/70 backdrop-blur">
                    <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                )}
                {!dish.inStock && (
                  <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center text-[11px] font-bold text-red-400">
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Dish Details */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-stone-100 line-clamp-2 leading-tight mb-1">
                    {dish.name}
                  </h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-amber-400 font-extrabold text-sm">₹{dish.price}</span>
                  </div>
                </div>

                {/* Add to Cart Actions */}
                <div className="mt-3">
                  {dish.inStock ? (
                    inCartQty === 0 ? (
                      <button
                        onClick={() => updateQuantity(dish.id, 1)}
                        className="w-full py-1.5 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-amber-400 font-bold text-xs transition flex items-center justify-center gap-1 border border-amber-500/30"
                      >
                        <Plus className="w-3 h-3" />
                        ADD
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/40 rounded-xl p-0.5">
                        <button
                          onClick={() => updateQuantity(dish.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-amber-400 rounded-lg active:bg-amber-500/20"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-xs text-amber-300">{inCartQty}</span>
                        <button
                          onClick={() => updateQuantity(dish.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-amber-400 rounded-lg active:bg-amber-500/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  ) : (
                    <button
                      disabled
                      className="w-full py-1.5 rounded-xl bg-stone-900 text-stone-600 font-medium text-xs cursor-not-allowed"
                    >
                      Sold Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating View Cart Sticky Bar */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-3 left-3 right-3 max-w-md mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 py-3.5 px-4 rounded-2xl font-bold flex items-center justify-between shadow-2xl transition transform active:scale-95"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-stone-950 text-amber-400 flex items-center justify-center text-xs font-black">
                {totalCartCount}
              </div>
              <span className="text-sm">View Cart</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-extrabold">
              <span>₹{totalCartAmount}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Order Confirmed Banner (if newly placed) */}
      {orderConfirmed && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-emerald-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">
              {orderConfirmed.paymentMode === 'UPI' ? 'Order Placed & Sent to Kitchen!' : 'Order Saved! Pay at Counter'}
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              {orderConfirmed.paymentMode === 'UPI'
                ? `Order #${orderConfirmed.orderNumber} is confirmed for Table #${tableNumber}. The chef has received your request.`
                : `Please visit the cashier counter to pay ₹${orderConfirmed.totalAmount} by cash or QR. Once paid, the kitchen starts cooking.`}
            </p>
            <div className="bg-stone-800/80 p-3 rounded-xl mb-4 text-left text-xs">
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Customer:</span>
                <span className="font-bold text-white">{orderConfirmed.customerName}</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Payment Mode:</span>
                <span className="font-bold text-amber-400">{orderConfirmed.paymentMode}</span>
              </div>
            </div>
            <button
              onClick={() => setOrderConfirmed(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold"
            >
              Continue Browsing Menu
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Sheet */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-stone-900 border-t border-stone-800 rounded-t-3xl max-w-lg mx-auto w-full max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Your Cart (Table #{tableNumber})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-stone-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Item List */}
              <div className="space-y-3">
                {cartItems.map(({ item, quantity }) => (
                  <div key={item.id} className="bg-stone-800/60 p-3 rounded-xl border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-2">
                        <span className="font-semibold text-xs text-stone-100 block">
                          {item.name}
                        </span>
                        <span className="text-amber-400 font-bold text-xs">
                          ₹{item.price * quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-stone-900 border border-stone-700 rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-amber-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-1">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-amber-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Per-dish Cooking Instruction input */}
                    <div className="pt-1 border-t border-stone-800/80 flex items-center gap-2">
                      <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                        Note:
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Less sugar, spicy, no onion..."
                        value={instructions[item.id] || ''}
                        onChange={(e) =>
                          setInstructions({ ...instructions, [item.id]: e.target.value })
                        }
                        className="flex-1 bg-stone-950 border border-stone-700/60 rounded-md px-2 py-1 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Details Form (Mandatory Name & 10-Digit Mobile Number) */}
              <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Customer Details (Compulsory)
                </span>

                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">
                    10-Digit Mobile Number * (For rewards & receipts)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-400 font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCustomerPhone(val);
                        if (val.length === 10) validatePhone(val);
                      }}
                      className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  {phoneError && (
                    <span className="text-[10px] text-red-400 block mt-1">{phoneError}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sheet Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-950/80 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-stone-400">Total Payable Amount:</span>
                <span className="text-xl font-extrabold text-amber-400">₹{totalCartAmount}</span>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition"
              >
                Proceed to Payment (₹{totalCartAmount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Choice Modal (Razorpay / Cashfree UPI vs Pay at Counter) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-bold text-sm text-white">Select Payment Mode</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: UPI Gateway */}
              <div
                onClick={() => setPaymentChoice('UPI')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  paymentChoice === 'UPI'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                    : 'bg-stone-800/60 border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-white">Pay via Instant UPI</span>
                    <span className="text-[10px] text-stone-400">Google Pay, PhonePe, Paytm, CRED</span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentChoice === 'UPI' ? 'border-amber-500 bg-amber-500' : 'border-stone-600'
                }`}>
                  {paymentChoice === 'UPI' && <div className="w-1.5 h-1.5 bg-stone-950 rounded-full" />}
                </div>
              </div>

              {/* Option 2: Pay at Counter */}
              <div
                onClick={() => setPaymentChoice('COUNTER')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  paymentChoice === 'COUNTER'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                    : 'bg-stone-800/60 border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-700 text-stone-300 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-white">Pay at Counter Desk</span>
                    <span className="text-[10px] text-stone-400">Pay Cash or QR to Biller</span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentChoice === 'COUNTER' ? 'border-amber-500 bg-amber-500' : 'border-stone-600'
                }`}>
                  {paymentChoice === 'COUNTER' && <div className="w-1.5 h-1.5 bg-stone-950 rounded-full" />}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (paymentChoice === 'UPI') {
                  setShowPaymentModal(false);
                  setShowUpiModal(true);
                } else {
                  handleExecutePayment('COUNTER');
                }
              }}
              disabled={isProcessingPayment}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
            >
              {isProcessingPayment ? (
                <span>Confirming Transaction...</span>
              ) : paymentChoice === 'UPI' ? (
                <span>Proceed to UPI Payment (₹{totalCartAmount})</span>
              ) : (
                <span>Submit Order & Pay at Desk</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Dynamic UPI Payment Modal (Real-world NPCI standard with GPay / PhonePe / Paytm) */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-white">Scan & Pay via UPI</h3>
              </div>
              <button
                onClick={() => setShowUpiModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic QR Box */}
            <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-inner">
              <QRCodeSVG
                value={`upi://pay?pa=${settings.upiVpa}&pn=${encodeURIComponent(
                  settings.merchantName
                )}&am=${totalCartAmount}&cu=INR&tn=${encodeURIComponent(
                  `Table_${tableNumber}_CafeOS`
                )}`}
                size={180}
                level="H"
                includeMargin={false}
              />
              <span className="text-stone-900 font-black text-xs mt-2 font-mono">
                {settings.upiVpa}
              </span>
              <span className="text-[10px] text-stone-500 font-medium">
                Merchant: {settings.merchantName}
              </span>
            </div>

            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
              <span className="text-xs text-stone-400 block">Total Amount to Pay:</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                ₹{totalCartAmount}
              </span>
            </div>

            {/* Native UPI Intent Button (Opens Google Pay / PhonePe directly on phone) */}
            <a
              href={`upi://pay?pa=${settings.upiVpa}&pn=${encodeURIComponent(
                settings.merchantName
              )}&am=${totalCartAmount}&cu=INR&tn=${encodeURIComponent(
                `Table_${tableNumber}_CafeOS`
              )}`}
              className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Tap to Open UPI App (GPay / PhonePe)</span>
            </a>

            {/* Reference / UTR input */}
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">
                UPI Reference / UTR (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 423456789012"
                value={upiUtr}
                onChange={(e) => setUpiUtr(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={() => handleExecutePayment('UPI')}
              disabled={isProcessingPayment}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Have Completed Payment (₹{totalCartAmount})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
