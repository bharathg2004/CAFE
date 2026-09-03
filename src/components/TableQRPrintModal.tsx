import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Globe, Wifi } from 'lucide-react';
import { cafeStore } from '../lib/sync';

interface Props {
  onClose: () => void;
}

export const TableQRPrintModal: React.FC<Props> = ({ onClose }) => {
  const settings = cafeStore.getSettings();
  const [selectedTable, setSelectedTable] = useState<number | 'all'>('all');
  const [useCustomUrl, setUseCustomUrl] = useState<boolean>(false);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(settings.qrBaseUrl);

  const tablesToPrint = selectedTable === 'all'
    ? Array.from({ length: settings.tableCount || 12 }, (_, i) => i + 1)
    : [selectedTable];

  const handlePrint = () => {
    window.print();
  };

  const getTableUrl = (tblNum: number) => {
    const base = useCustomUrl ? customBaseUrl.replace(/\/$/, '') : settings.qrBaseUrl.replace(/\/$/, '');
    return `${base}/?table=${tblNum}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-500" />
              Print Table QR Standees & Stickers
            </h2>
            <p className="text-xs text-stone-400">
              Printable table-top cards for customer smartphone self-ordering
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-xs font-bold rounded-xl px-3 py-2"
            >
              <option value="all">All {settings.tableCount} Tables</option>
              {Array.from({ length: settings.tableCount || 12 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>Table #{num} Only</option>
              ))}
            </select>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Cards</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-xl bg-stone-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* URL Mode Switcher (Print: Hidden) */}
        <div className="px-5 py-2.5 bg-stone-900 border-b border-stone-800/80 text-xs flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-4">
            <span className="text-stone-400 font-medium">Target URL:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-stone-300 font-semibold">
              <input
                type="radio"
                name="urlMode"
                checked={!useCustomUrl}
                onChange={() => setUseCustomUrl(false)}
              />
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>GitHub Pages Cloud URL</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-stone-300 font-semibold">
              <input
                type="radio"
                name="urlMode"
                checked={useCustomUrl}
                onChange={() => setUseCustomUrl(true)}
              />
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Local Cafe LAN / Custom Domain</span>
            </label>
          </div>

          {useCustomUrl && (
            <input
              type="text"
              placeholder="e.g. http://192.168.1.100:5173"
              value={customBaseUrl}
              onChange={(e) => setCustomBaseUrl(e.target.value)}
              className="bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono"
            />
          )}
        </div>

        {/* Printable Standee Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-950 print:bg-white print:p-0 print:m-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
            {tablesToPrint.map((num) => {
              const url = getTableUrl(num);
              return (
                <div
                  key={num}
                  className="bg-white text-stone-950 rounded-3xl p-6 border-2 border-stone-300 shadow-xl flex flex-col items-center text-center justify-between min-h-[360px] print:shadow-none print:border-stone-800 print:rounded-2xl print:break-inside-avoid"
                >
                  {/* Card Header */}
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xl mx-auto mb-2 shadow">
                      ☕
                    </div>
                    <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
                      {settings.cafeName}
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      {settings.tagline}
                    </p>
                  </div>

                  {/* High-Resolution QR Code */}
                  <div className="my-4 p-3 bg-stone-50 border border-stone-200 rounded-2xl shadow-inner flex items-center justify-center">
                    <QRCodeSVG
                      value={url}
                      size={160}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Table Badge & Call to Action */}
                  <div className="w-full">
                    <div className="bg-stone-900 text-white py-1.5 px-4 rounded-xl font-black text-lg tracking-wider mb-1.5 shadow">
                      TABLE #{num}
                    </div>
                    <p className="text-[11px] font-bold text-stone-700">
                      Scan with Phone Camera to Order & Pay
                    </p>
                    <p className="text-[9px] text-stone-400 font-mono mt-0.5 truncate max-w-[200px] mx-auto">
                      {url}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
