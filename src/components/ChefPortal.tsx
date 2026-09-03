import React, { useState, useEffect } from 'react';
import { ChefHat, AlertOctagon, CheckCircle2, Clock, Utensils, MessageSquare, Maximize, Minimize, Volume2, Printer } from 'lucide-react';
import { cafeStore } from '../lib/sync';
import { Order, OrderItem } from '../types/cafe';
import { sound } from '../lib/audio';
import { ThermalReceiptModal } from './ThermalReceiptModal';

export const ChefPortal: React.FC = () => {
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isWakeLocked, setIsWakeLocked] = useState<boolean>(false);
  const [printKotOrder, setPrintKotOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Screen Wake Lock API to prevent kitchen TV from turning off / sleeping
    let wl: any = null;
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then((lock) => {
          wl = lock;
          setIsWakeLocked(true);
        })
        .catch(() => {});
    }
    return () => {
      if (wl) wl.release().catch(() => {});
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const update = () => {
      setKitchenOrders(cafeStore.getKitchenOrders());
    };
    update();
    const unsub = cafeStore.subscribe(update);

    // 1-second interval for real-time countdown updates
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // Format elapsed time (MM:SS)
  const formatElapsed = (startedAt: number) => {
    const diff = Math.max(0, Math.floor((currentTime - startedAt) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Item preparation countdown timer calculation
  const getItemCountdown = (item: OrderItem, orderPaidAt: number) => {
    const prepDurationMs = (item.prepTimeMinutes || 5) * 60 * 1000;
    const itemStart = item.startedAt || orderPaidAt;
    const elapsedMs = currentTime - itemStart;
    const remainingMs = prepDurationMs - elapsedMs;

    const remainingSecs = Math.floor(remainingMs / 1000);
    const percentRemaining = Math.max(0, (remainingMs / prepDurationMs) * 100);

    let colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    let textState = 'ON TIME';

    if (remainingSecs <= 0) {
      colorClass = 'bg-red-500 text-white border-red-400 animate-pulse font-black';
      textState = 'OVERDUE!';
    } else if (percentRemaining <= 30) {
      // 30% to 0% -> RED
      colorClass = 'bg-red-500/20 text-red-400 border-red-500/50';
      textState = 'CRITICAL';
    } else if (percentRemaining <= 70) {
      // 70% to 30% -> YELLOW
      colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      textState = 'MIDWAY';
    } else {
      // 100% to 70% -> GREEN
      colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      textState = 'FRESH';
    }

    const absRemaining = Math.abs(remainingSecs);
    const displayMins = Math.floor(absRemaining / 60);
    const displaySecs = absRemaining % 60;
    const timeStr = `${displayMins}:${displaySecs.toString().padStart(2, '0')}`;

    return {
      timeStr: remainingSecs < 0 ? `-${timeStr}` : timeStr,
      colorClass,
      textState,
      percentRemaining
    };
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-6 select-none font-sans">
      {/* Header with high visibility TV-friendly sizing */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-4 sm:p-5 rounded-3xl shadow-xl mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-lg">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              KITCHEN DISPLAY SYSTEM (KDS)
            </h1>
            <p className="text-xs text-stone-400">
              Active Orders: <span className="font-bold text-amber-400">{kitchenOrders.length}</span>
              {' | '}Screen Awake: <span className={isWakeLocked ? 'text-emerald-400 font-bold' : 'text-stone-500'}>
                {isWakeLocked ? '● ON' : '○ OFF'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Test Button */}
          <button
            onClick={() => sound.playKitchenChime()}
            title="Test Kitchen Chime Volume"
            className="p-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl border border-stone-700 transition cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-amber-400" />
          </button>

          {/* Fullscreen Kiosk Mode Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Toggle TV Fullscreen Kiosk Mode"
            className="p-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl border border-stone-700 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-5 h-5 text-emerald-400" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* Chef Emergency Need Help Button */}
          <button
            onClick={() => {
              if (kitchenOrders.length > 0) {
                const target = kitchenOrders[0];
                cafeStore.triggerChefHelp(target.id, !target.chefHelpRequested);
              } else {
                alert('No active kitchen orders to link emergency signal to.');
              }
            }}
            className="px-5 py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl border-2 border-red-400 flex items-center gap-2 transition cursor-pointer"
          >
            <AlertOctagon className="w-5 h-5 animate-pulse" />
            <span>NEED HELP</span>
          </button>
        </div>
      </div>

      {/* Main Order Grid */}
      {kitchenOrders.length === 0 ? (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-stone-900/40 rounded-3xl border border-stone-800/80">
          <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 mb-4">
            <Utensils className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-300">All Kitchen Orders Cleared!</h2>
          <p className="text-sm text-stone-500 max-w-sm mt-1">
            New paid orders from Customer Mobile or Biller Desk will chime and appear here immediately.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kitchenOrders.map((order) => {
            // Filter strictly to kitchen-prepared items (Exclude Cigarettes and retail items)
            const kitchenItems = order.items.filter((it) => it.isKitchenItem);
            const totalElapsedStr = formatElapsed(order.paidAt || order.createdAt);

            return (
              <div
                key={order.id}
                className={`bg-stone-900 rounded-3xl border-2 overflow-hidden flex flex-col justify-between shadow-2xl transition-all ${
                  order.chefHelpRequested
                    ? 'border-red-500 shadow-red-950/80 animate-pulse'
                    : 'border-stone-700/80 hover:border-amber-500/60'
                }`}
              >
                {/* Order Ticket Header */}
                <div className="p-4 bg-stone-800/90 border-b border-stone-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-amber-500 text-stone-950 font-black text-base rounded-xl shadow">
                      TABLE #{order.tableNumber}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-white block truncate max-w-[140px]">
                        {order.customerName}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Order #{order.orderNumber}
                      </span>
                    </div>
                  </div>

                  {/* Total Elapsed Order Timer */}
                  <div className="flex items-center gap-1.5 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-700 text-amber-300 font-mono font-bold text-sm">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{totalElapsedStr}</span>
                  </div>
                </div>

                {/* Items in Ticket */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[420px]">
                  {kitchenItems.map((item) => {
                    const cd = getItemCountdown(item, order.paidAt || order.createdAt);
                    return (
                      <div
                        key={item.id}
                        className="bg-stone-950/70 p-3.5 rounded-2xl border border-stone-800 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-stone-800 text-amber-400 font-black text-sm flex items-center justify-center">
                              {item.quantity}x
                            </span>
                            <span className="font-bold text-sm text-white leading-tight">
                              {item.name}
                            </span>
                          </div>

                          {/* Dynamic Color-Coded Countdown Timer */}
                          <div
                            className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-black flex items-center gap-1 shadow-sm ${cd.colorClass}`}
                          >
                            <span>{cd.timeStr}</span>
                          </div>
                        </div>

                        {/* Customer Cooking Instructions (Highlighted) */}
                        {item.cookingInstruction && (
                          <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl px-2.5 py-1.5 flex items-start gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                            <span className="text-xs font-bold text-amber-300">
                              NOTE: {item.cookingInstruction}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-stone-950 border-t border-stone-800/80 flex items-center gap-2">
                  <button
                    onClick={() => setPrintKotOrder(order)}
                    title="Print Kitchen Order Ticket (KOT)"
                    className="p-4 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl border border-stone-700 transition cursor-pointer"
                  >
                    <Printer className="w-6 h-6 text-amber-400" />
                  </button>

                  <button
                    onClick={() => cafeStore.markOrderServed(order.id)}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition cursor-pointer border-2 border-emerald-400"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span>MARK SENT TO TABLE</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Thermal KOT Modal */}
      {printKotOrder && (
        <ThermalReceiptModal
          order={printKotOrder}
          onClose={() => setPrintKotOrder(null)}
        />
      )}
    </div>
  );
};
