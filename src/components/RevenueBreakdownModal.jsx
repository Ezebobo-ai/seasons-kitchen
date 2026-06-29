// src/components/RevenueBreakdownModal.jsx
// Clickable revenue card that opens a detailed breakdown modal.

import React, { useState } from "react";
import { exportAnalyticsCsv } from "../utils/reportExport.js";

export default function RevenueBreakdownModal({ payments, orders, filterLabel }) {
  const [open, setOpen] = useState(false);

  const revenue      = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const paidOrders   = orders.filter(o => o.status === "confirmed" || o.status === "delivered");
  const subtotalSum  = paidOrders.reduce((s, o) => s + (o.subtotal      || 0), 0);
  const vatSum       = paidOrders.reduce((s, o) => s + (o.vat           || 0), 0);
  const serviceSum   = paidOrders.reduce((s, o) => s + (o.serviceCharge || 0), 0);
  const packagingSum = paidOrders.reduce((s, o) => s + (o.packaging     || 0), 0);
  const calculatedTotal = subtotalSum + vatSum + serviceSum + packagingSum;
  const roundingDiff = revenue - calculatedTotal;

  const rows = [
    { label: "Subtotal",         value: subtotalSum,  color: "text-gray-800",  bar: subtotalSum / Math.max(revenue, 1) },
    { label: "VAT (7.5%)",       value: vatSum,       color: "text-yellow-600", bar: vatSum      / Math.max(revenue, 1) },
    { label: "Service Charges",  value: serviceSum,   color: "text-blue-600",   bar: serviceSum  / Math.max(revenue, 1) },
    { label: "Packaging Fees",   value: packagingSum, color: "text-violet-600", bar: packagingSum/ Math.max(revenue, 1) },
  ];

  return (
    <>
      {/* Clickable StatCard */}
      <div
        onClick={() => setOpen(true)}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-1 border-l-4 border-l-yellow-400 cursor-pointer hover:shadow-md hover:border-yellow-500 transition group"
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Revenue</p>
        <p className="text-3xl font-bold leading-none mt-1 text-green-700">₦{revenue.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-1">
          Avg ₦{payments.length ? Math.round(revenue / payments.length).toLocaleString() : 0} / order
        </p>
        <span className="text-xs text-green-600 font-semibold mt-1 group-hover:underline">
          👆 Click for breakdown →
        </span>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-700 to-green-500 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white text-base">Revenue Breakdown</h2>
                <p className="text-green-100 text-xs mt-0.5">{filterLabel}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="font-bold text-gray-800">Total Revenue</span>
                <span className="font-bold text-green-700 text-xl">₦{revenue.toLocaleString()}</span>
              </div>

              {/* Breakdown rows */}
              <div className="space-y-3">
                {rows.map(row => (
                  <div key={row.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-gray-600">{row.label}</span>
                      <span className={`font-bold text-sm ${row.color}`}>
                        ₦{row.value.toLocaleString()}
                        <span className="text-xs text-gray-400 font-normal ml-1.5">
                          ({revenue > 0 ? Math.round(row.bar * 100) : 0}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${row.bar * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Rounding note if needed */}
              {Math.abs(roundingDiff) > 1 && (
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-50">
                  ⚠️ Rounding difference: ₦{Math.round(roundingDiff).toLocaleString()} (due to legacy orders without full breakdown)
                </p>
              )}

              {/* Order count */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between text-sm text-gray-500">
                <span>Paid orders contributing</span>
                <span className="font-bold text-gray-800">{paidOrders.length}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => exportAnalyticsCsv({ payments, orders, filterLabel })}
                  className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold py-2.5 rounded-xl transition"
                >
                  ⬇️ Export CSV
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
