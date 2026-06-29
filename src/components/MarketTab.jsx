// src/components/MarketTab.jsx
// Market list / budgeting system UI.

import React, { useState } from "react";
import { useInventory } from "../Context/InventoryContext.jsx";
import { MARKET_CATEGORIES, SUGGESTED_PRICES } from "../data/inventoryDefaults.js";
import { exportMarketCsv } from "../utils/reportExport.js";

const UNITS = ["kg", "liters", "pieces", "packs", "bottles", "bags", "crates"];

const EMPTY = {
  name: "", category: "Food", qty: "", unit: "kg",
  suggestedPrice: "", actualPrice: "",
};

export default function MarketTab() {
  const {
    marketList, addMarketItem, updateMarketItem, deleteMarketItem,
    clearMarketList, marketTotals, applyMarketPurchase, inventory,
  } = useInventory();

  const [form, setForm]     = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // When name changes, auto-fill suggested price if we have it
  const handleNameChange = (name) => {
    const suggested = SUGGESTED_PRICES[name] || "";
    setForm(f => ({
      ...f,
      name,
      suggestedPrice: f.suggestedPrice || suggested,
      // Link to inventory item if it exists
      linkedInventoryId: inventory.find(i => i.name.toLowerCase() === name.toLowerCase())?.id || null,
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return alert("Item name is required");
    const data = {
      name:             form.name.trim(),
      category:         form.category,
      qty:              Number(form.qty) || 0,
      unit:             form.unit,
      suggestedPrice:   Number(form.suggestedPrice) || 0,
      actualPrice:      Number(form.actualPrice)    || Number(form.suggestedPrice) || 0,
      linkedInventoryId: form.linkedInventoryId || null,
    };
    if (editId) { updateMarketItem(editId, data); setEditId(null); }
    else addMarketItem(data);
    setForm(EMPTY);
    setShowForm(false);
  };

  const startEdit = (item) => {
    setForm({
      name:             item.name,
      category:         item.category,
      qty:              item.qty,
      unit:             item.unit,
      suggestedPrice:   item.suggestedPrice,
      actualPrice:      item.actualPrice,
      linkedInventoryId: item.linkedInventoryId || null,
    });
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyToStock = () => {
    const linked = marketList.filter(i => i.linkedInventoryId);
    if (linked.length === 0) return alert("No items are linked to inventory. Edit items and ensure names match an inventory item.");
    if (!confirm(`Apply ${linked.length} purchase(s) to inventory stock levels?`)) return;
    applyMarketPurchase(marketList);
    alert("✅ Stock levels updated!");
  };

  return (
    <div className="space-y-6">

      {/* ── Totals ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Estimated Total",  value: `₦${marketTotals.estimated.toLocaleString()}`, color: "text-gray-900",  accent: "border-l-blue-400"  },
          { label: "Actual Total",     value: `₦${marketTotals.actual.toLocaleString()}`,    color: "text-green-700", accent: "border-l-green-400" },
          {
            label: "Difference",
            value: `${marketTotals.diff >= 0 ? "+" : ""}₦${marketTotals.diff.toLocaleString()}`,
            color: marketTotals.diff > 0 ? "text-red-600" : "text-green-700",
            accent: marketTotals.diff > 0 ? "border-l-red-400" : "border-l-green-400",
          },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 border-l-4 ${s.accent}`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Header row ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800 text-base">Market List / Budget</h3>
          <p className="text-xs text-gray-400 mt-0.5">Plan purchases and track actual spend vs estimate</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {marketList.length > 0 && (
            <>
              <button
                onClick={handleApplyToStock}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
              >
                📦 Apply to Inventory
              </button>
              <button
                onClick={() => exportMarketCsv({ marketList, totals: marketTotals })}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition"
              >
                ⬇️ Export CSV
              </button>
              <button
                onClick={() => { if (confirm("Clear entire market list?")) clearMarketList(); }}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold px-3 py-2 rounded-xl transition"
              >
                🗑 Clear All
              </button>
            </>
          )}
          <button
            onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(v => !v); }}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* ── Add / Edit Form ──────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-4">
            <h4 className="font-bold text-white">{editId ? "✏️ Edit Market Item" : "🛒 Add to Market List"}</h4>
            <p className="text-purple-100 text-xs mt-0.5">Suggested prices are auto-filled for common items. You can override them.</p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Item Name *</label>
              <input
                type="text"
                list="market-name-suggestions"
                placeholder="e.g. Rice, Palm Oil…"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              />
              <datalist id="market-name-suggestions">
                {Object.keys(SUGGESTED_PRICES).map(n => <option key={n} value={n} />)}
              </datalist>
              {form.linkedInventoryId && (
                <p className="text-xs text-green-600 mt-1">✅ Linked to inventory</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              >
                {MARKET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Quantity</label>
              <input
                type="number"
                placeholder="0"
                value={form.qty}
                onChange={e => setForm({ ...form, qty: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Unit</label>
              <select
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Suggested Price (₦)
                <span className="ml-1 font-normal text-gray-400 normal-case">(auto-filled)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                <input
                  type="number"
                  placeholder="0"
                  value={form.suggestedPrice}
                  onChange={e => setForm({ ...form, suggestedPrice: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Actual Price (₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                <input
                  type="number"
                  placeholder="0"
                  value={form.actualPrice}
                  onChange={e => setForm({ ...form, actualPrice: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
                />
              </div>
            </div>
            {/* Total cost preview */}
            {form.qty && form.actualPrice && (
              <div className="col-span-full bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 flex justify-between items-center text-sm">
                <span className="text-gray-500">Total cost for this item</span>
                <span className="font-bold text-violet-700">₦{(Number(form.qty) * Number(form.actualPrice)).toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
            >
              {editId ? "Save Changes" : "Add to List"}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── List Table ──────────────────────────────────────────────── */}
      {marketList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-300">
          <span className="text-5xl block mb-3">🛒</span>
          <p className="text-sm text-gray-400 font-medium">Your market list is empty</p>
          <p className="text-xs text-gray-300 mt-1">Add items above to start planning your budget</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
            <span className="col-span-2">Item</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Suggested</span>
            <span className="text-right">Actual</span>
            <span className="text-right">Total</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-gray-50">
            {marketList.map(item => {
              const totalCost = item.actualPrice * item.qty;
              const diff = (item.actualPrice - item.suggestedPrice) * item.qty;
              return (
                <div key={item.id} className="grid grid-cols-7 px-5 py-3.5 items-center hover:bg-gray-50 transition">
                  <div className="col-span-2">
                    <p className="font-semibold text-sm text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category}</p>
                    {item.linkedInventoryId && (
                      <span className="text-xs text-green-600 font-medium">🔗 Linked</span>
                    )}
                  </div>
                  <p className="text-center text-sm text-gray-600">{item.qty} {item.unit}</p>
                  <p className="text-right text-sm text-gray-500">₦{item.suggestedPrice.toLocaleString()}</p>
                  <p className="text-right text-sm font-semibold text-gray-800">₦{item.actualPrice.toLocaleString()}</p>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">₦{totalCost.toLocaleString()}</p>
                    {diff !== 0 && (
                      <p className={`text-xs font-semibold ${diff > 0 ? "text-red-500" : "text-green-600"}`}>
                        {diff > 0 ? "+" : ""}₦{diff.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => startEdit(item)} className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-blue-100 transition">Edit</button>
                    <button onClick={() => deleteMarketItem(item.id)} className="bg-red-50 text-red-500 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-red-100 transition">Del</button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Totals footer */}
          <div className="grid grid-cols-7 px-5 py-4 bg-gray-50 border-t border-gray-100 text-sm font-bold">
            <span className="col-span-3 text-gray-500">TOTALS</span>
            <span className="text-right text-gray-500">₦{(marketList.reduce((s, i) => s + i.suggestedPrice, 0)).toLocaleString()}</span>
            <span className="text-right text-gray-700">₦{(marketList.reduce((s, i) => s + i.actualPrice, 0)).toLocaleString()}</span>
            <span className="text-right text-green-700">₦{marketTotals.actual.toLocaleString()}</span>
            <span></span>
          </div>
        </div>
      )}

      {/* ── Budget tip ────────────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-3 items-start text-xs text-blue-700">
        <span className="text-lg mt-0.5">💡</span>
        <p>
          <b>Tip:</b> When item names match your inventory exactly (e.g. "Rice"), they are automatically linked.
          Click "Apply to Inventory" after shopping to increase those stock levels.
          Export CSV to share the list with your procurement team.
        </p>
      </div>
    </div>
  );
}
