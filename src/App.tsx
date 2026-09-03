import React, { useState, useEffect } from 'react';
import { RoleNavigation, PortalTab } from './components/RoleNavigation';
import { CustomerPortal } from './components/CustomerPortal';
import { ChefPortal } from './components/ChefPortal';
import { BillerPortal } from './components/BillerPortal';
import { OwnerPortal } from './components/OwnerPortal';

export const App: React.FC = () => {
  // Query param parsing for direct QR opening or hardware kiosk displays
  const getInitialTab = (): PortalTab => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get('portal')?.toLowerCase();
      if (portalParam === 'chef') return 'chef';
      if (portalParam === 'biller' || portalParam === 'pos') return 'biller';
      if (portalParam === 'owner' || portalParam === 'admin') return 'owner';
    }
    return 'customer';
  };

  const getInitialTable = (): number => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table');
      if (tableParam) {
        const num = parseInt(tableParam, 10);
        if (!isNaN(num) && num >= 1 && num <= 12) return num;
      }
    }
    return 1;
  };

  const [currentTab, setCurrentTab] = useState<PortalTab>(getInitialTab);
  const [activeTable, setActiveTable] = useState<number>(getInitialTable);

  // Sync URL query params if tab or table changes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentTab === 'customer') {
      url.searchParams.set('table', activeTable.toString());
      url.searchParams.delete('portal');
    } else {
      url.searchParams.set('portal', currentTab);
      url.searchParams.delete('table');
    }
    window.history.replaceState({}, '', url.toString());
  }, [currentTab, activeTable]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Top Role Switcher Header */}
      <RoleNavigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeTable={activeTable}
        onSelectTable={setActiveTable}
      />

      {/* Main Role Portal View */}
      <main className="flex-1">
        {currentTab === 'customer' && <CustomerPortal tableNumber={activeTable} />}
        {currentTab === 'chef' && <ChefPortal />}
        {currentTab === 'biller' && <BillerPortal />}
        {currentTab === 'owner' && <OwnerPortal />}
      </main>
    </div>
  );
};

export default App;
