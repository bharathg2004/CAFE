import React from 'react';
import { Smartphone, ChefHat, MonitorDot, ShieldCheck, Bell, Volume2, RefreshCw } from 'lucide-react';
import { cafeStore } from '../lib/sync';

export type PortalTab = 'customer' | 'chef' | 'biller' | 'owner';

interface Props {
  currentTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  activeTable: number;
  onSelectTable: (table: number) => void;
}

export const RoleNavigation: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  activeTable,
  onSelectTable,
}) => {
  const [kitchenCount, setKitchenCount] = React.useState(0);
  const [pendingCashCount, setPendingCashCount] = React.useState(0);
  const [stockApprovalCount, setStockApprovalCount] = React.useState(0);
  const [helpAlertCount, setHelpAlertCount] = React.useState(0);

  React.useEffect(() => {
    const update = () => {
      const orders = cafeStore.getOrders();
      const kitchenOrders = cafeStore.getKitchenOrders();
      const stockLogs = cafeStore.getStockLogs();

      setKitchenCount(kitchenOrders.length);
      setPendingCashCount(orders.filter(o => o.paymentStatus === 'PENDING' && o.paymentMode === 'COUNTER').length);
      setStockApprovalCount(stockLogs.filter(s => s.status === 'PENDING_APPROVAL').length);
      setHelpAlertCount(orders.filter(o => o.chefHelpRequested).length);
    };

    update();
    return cafeStore.subscribe(update);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-stone-900/95 backdrop-blur border-b border-stone-800 shadow-md">
      {helpAlertCount > 0 && (
        <div className="bg-red-600 text-white px-4 py-1.5 text-center text-xs font-bold animate-pulse flex items-center justify-center gap-2">
          <Bell className="w-4 h-4 animate-bounce" />
          KITCHEN EMERGENCY ALERT: Chef has requested immediate assistance at counter!
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
        {/* Brand & Table selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-black text-lg shadow">
              ☕
            </div>
            <div>
              <span className="font-extrabold text-stone-100 tracking-tight text-base sm:text-lg">
                Cafe<span className="text-amber-500">OS</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                Live Cloud Sync
              </span>
            </div>
          </div>

          {currentTab === 'customer' && (
            <div className="flex items-center gap-1.5 bg-stone-800/80 px-2.5 py-1 rounded-full border border-stone-700 text-xs">
              <span className="text-stone-400">Table:</span>
              <select
                value={activeTable}
                onChange={(e) => onSelectTable(Number(e.target.value))}
                aria-label="Select Cafe Table"
                className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => (
                  <option key={t} value={t} className="bg-stone-800 text-stone-100">
                    Table #{t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Portal Switcher Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-stone-950/60 p-1 rounded-xl border border-stone-800 text-xs font-medium">
          <button
            onClick={() => onSelectTab('customer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentTab === 'customer'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customer</span>
          </button>

          <button
            onClick={() => onSelectTab('chef')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all relative ${
              currentTab === 'chef'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chef KDS</span>
            {kitchenCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white">
                {kitchenCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('biller')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all relative ${
              currentTab === 'biller'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
            }`}
          >
            <MonitorDot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Biller POS</span>
            {pendingCashCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-stone-950 animate-pulse">
                ₹{pendingCashCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('owner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all relative ${
              currentTab === 'owner'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Owner BI</span>
            {stockApprovalCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                {stockApprovalCount}
              </span>
            )}
          </button>
        </nav>

        {/* Utilities: Reset demo / sound test */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Reset system data to initial state?')) {
                cafeStore.resetToDefaults();
              }
            }}
            title="Reset to initial demo data"
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 text-[11px] text-stone-400 bg-stone-800/40 px-2 py-1 rounded-md border border-stone-800">
            <Volume2 className="w-3 h-3 text-amber-500" />
            <span>Audio Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
