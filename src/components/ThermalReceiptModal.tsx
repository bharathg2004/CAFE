import React, { useState } from 'react';
import { Printer, X, FileText, UtensilsCrossed } from 'lucide-react';
import { Order } from '../types/cafe';
import { cafeStore } from '../lib/sync';

interface Props {
  order: Order;
  cashTendered?: number;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<Props> = ({ order, cashTendered, onClose }) => {
  const settings = cafeStore.getSettings();
  const [receiptType, setReceiptType] = useState<'CUSTOMER_BILL' | 'KITCHEN_KOT'>('CUSTOMER_BILL');

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.paidAt || order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const changeDue = cashTendered ? Math.max(0, cashTendered - order.totalAmount) : 0;
  const kitchenItems = order.items.filter((it) => it.isKitchenItem);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header (Hidden in Print) */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReceiptType('CUSTOMER_BILL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                receiptType === 'CUSTOMER_BILL'
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-stone-800 text-stone-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Customer Bill
            </button>
            <button
              onClick={() => setReceiptType('KITCHEN_KOT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                receiptType === 'KITCHEN_KOT'
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-stone-800 text-stone-300'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5 inline mr-1" />
              Kitchen KOT
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Thermal</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-white rounded-lg bg-stone-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thermal Print Preview Container */}
        <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-stone-950 print:bg-white print:p-0">
          {/* Thermal Receipt Paper Sheet (Width formatted for 80mm / 58mm) */}
          <div className="w-[300px] bg-white text-black p-5 font-mono text-xs shadow-2xl rounded-sm print:shadow-none print:w-full print:p-0">
            {receiptType === 'CUSTOMER_BILL' ? (
              /* --- CUSTOMER TAX INVOICE RECEIPT --- */
              <div className="space-y-3">
                <div className="text-center">
                  <h2 className="text-base font-black tracking-wider uppercase">{settings.cafeName}</h2>
                  <p className="text-[10px] text-stone-600">{settings.tagline}</p>
                  <p className="text-[10px] text-stone-600">{settings.address}</p>
                  <p className="text-[10px] text-stone-600">Ph: +91 {settings.phone}</p>
                  {settings.gstin && <p className="text-[9px] text-stone-500">GSTIN: {settings.gstin}</p>}
                </div>

                <div className="border-t border-b border-dashed border-stone-400 py-1.5 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Order: #{order.orderNumber}</span>
                    <span className="font-bold">TABLE #{order.tableNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date: {formattedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer: {order.customerName}</span>
                    <span>Ph: {order.customerPhone}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between font-bold border-b border-stone-300 pb-1 text-[10px]">
                    <span className="w-1/2">Item</span>
                    <span className="w-1/6 text-center">Qty</span>
                    <span className="w-1/3 text-right">Price</span>
                  </div>
                  {order.items.map((it) => (
                    <div key={it.id}>
                      <div className="flex justify-between">
                        <span className="w-1/2 truncate">{it.name}</span>
                        <span className="w-1/6 text-center">{it.quantity}</span>
                        <span className="w-1/3 text-right">₹{it.unitPrice * it.quantity}</span>
                      </div>
                      {it.cookingInstruction && (
                        <div className="text-[9px] text-stone-600 italic pl-1">
                          * {it.cookingInstruction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-dashed border-stone-400 pt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between font-extrabold text-sm">
                    <span>NET TOTAL:</span>
                    <span>₹{order.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-700">
                    <span>Payment Mode:</span>
                    <span className="font-bold uppercase">{order.paymentMode}</span>
                  </div>
                  {cashTendered && cashTendered > 0 && (
                    <>
                      <div className="flex justify-between text-[10px] text-stone-700">
                        <span>Cash Tendered:</span>
                        <span>₹{cashTendered}</span>
                      </div>
                      <div className="flex justify-between font-bold text-stone-900">
                        <span>Change Returned:</span>
                        <span>₹{changeDue}</span>
                      </div>
                    </>
                  )}
                  {order.upiTransactionId && (
                    <div className="flex justify-between text-[9px] text-stone-500">
                      <span>UPI Ref / UTR:</span>
                      <span className="font-mono">{order.upiTransactionId}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center pt-3 border-t border-dashed border-stone-300 text-[10px] space-y-1">
                  <p className="font-bold">Thank you for dining with us!</p>
                  <p className="text-[9px] text-stone-500">Please visit again soon.</p>
                </div>
              </div>
            ) : (
              /* --- KITCHEN ORDER TICKET (KOT) --- */
              <div className="space-y-3">
                <div className="text-center border-b-2 border-black pb-2">
                  <h2 className="text-xl font-black uppercase">KITCHEN ORDER (KOT)</h2>
                  <div className="flex justify-between items-center mt-1 text-sm font-black">
                    <span className="bg-black text-white px-2 py-0.5 rounded">TABLE #{order.tableNumber}</span>
                    <span>Order #{order.orderNumber}</span>
                  </div>
                  <p className="text-[10px] text-stone-600 mt-1">{formattedDate}</p>
                </div>

                <div className="space-y-2">
                  {kitchenItems.map((it) => (
                    <div key={it.id} className="border-b border-dashed border-stone-300 pb-1.5">
                      <div className="flex justify-between items-baseline text-sm font-black">
                        <span>{it.name}</span>
                        <span className="text-base font-black ml-2">[{it.quantity}x]</span>
                      </div>
                      {it.cookingInstruction ? (
                        <div className="text-xs font-bold text-red-600 bg-stone-100 p-1 rounded mt-0.5">
                          NOTE: {it.cookingInstruction}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="pt-4 text-center text-[10px] text-stone-500">
                  Chef Preparation Ticket • Mark completed on KDS
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
