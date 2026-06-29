// src/components/InventoryTab.jsx
// Full inventory management UI — used inside AdminPage as a tab.

import React, { useState } from "react";
import { useInventory } from "../Context/InventoryContext.jsx";
import { INVENTORY_CATEGORIES, SUGGESTED_PRICES } from "../data/inventoryDefaults.js";
import { exportInventoryCsv } from "../utils/reportExport.js";

const UNITS = ["kg", "liters", "pieces", "packs", "bunches", "bottles", "bags"];

const EMPTY_FORM = {
  name: "", category: "Food Ingredients", qty: "", unit: "kg", minThreshold: "",
};

export default function InventoryTab() {
  const {
    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, lowStockItems,
  } = useInventory();

  const [form, setForm]           = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState(null);
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);

  const startEdit = (item) => {
    setForm({ name: item.name, category: item.category, qty: item.qty, unit: item.unit, minThreshold: item.minThreshold });
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return alert("Item name is required");
    const data = {
      name: form.name.trim(),
      category: form.category,
      qty: Number(form.qty) || 0,
      unit: form.unit,
      minThreshold: Number(form.minThreshold) || 0,
    };
    if (editId) { updateInventoryItem(editId, data); setEditId(null); }
    else addInventoryItem(data);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const autoFillSuggested = (name) => {
    const price = SUGGESTED_PRICES[name];
    if (price) return price;
    return null;
  };

  const displayed = inventory.filter(i => {
    if (catFilter !== "All" && i.category !== catFilter) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = ["All", ...INVENTORY_CATEGORIES];

  return (
    <div className="space-y-6">

      {/* ── Low Stock Banner ─────────────────────────────────────────── */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-red-700 text-sm">Low Stock Alert — {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockItems.map(i => (
                <span key={i.id} className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {i.name}: {i.qty} {i.unit} (min: {i.minThreshold})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Items",  value: inventory.length,    color: "text-gray-900", accent: "border-l-blue-400"  },
          { label: "Low Stock",    value: lowStockItems.length, color: "text-red-600",  accent: "border-l-red-400"   },
          { label: "Categories",   value: INVENTORY_CATEGORIES.length, color: "text-green-700", accent: "border-l-green-400" },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 border-l-4 ${s.accent}`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Header + actions ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800 text-base">Kitchen Inventory</h3>
          <p className="text-xs text-gray-400 mt-0.5">Track all ingredients, packaging, and supplies</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportInventoryCsv({ inventory })}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition"
          >
            ⬇️ Export CSV
          </button>
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(v => !v); }}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* ── Add/Edit Form ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-500 px-5 py-4">
            <h4 className="font-bold text-white">{editId ? "✏️ Edit Inventory Item" : "➕ Add Inventory Item"}</h4>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Item Name *</label>
              <input
                type="text"
                placeholder="e.g. Rice"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              >
                {INVENTORY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Quantity *</label>
              <input
                type="number"
                placeholder="0"
                value={form.qty}
                onChange={e => setForm({ ...form, qty: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Unit</label>
              <select
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Min Threshold</label>
              <input
                type="number"
                placeholder="Alert below this qty"
                value={form.minThreshold}
                onChange={e => setForm({ ...form, minThreshold: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
              >
                {editId ? "Save Changes" : "Add Item"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search items…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
        />
        <div className="flex flex-wrap gap-1.5">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                catFilter === c ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{displayed.length} items</span>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-6 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
          <span className="col-span-2">Item</span>
          <span>Category</span>
          <span className="text-center">Qty / Unit</span>
          <span className="text-center">Min</span>
          <span className="text-right">Actions</span>
        </div>
        {displayed.length === 0 ? (
          <div className="py-16 text-center text-gray-300">
            <span className="text-4xl block mb-3">📦</span>
            <p className="text-sm text-gray-400">No items match this filter</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayed.map(item => {
              const isLow = item.qty <= item.minThreshold;
              return (
                <div key={item.id} className={`grid grid-cols-6 px-5 py-3.5 items-center hover:bg-gray-50 transition ${isLow ? "bg-red-50 hover:bg-red-50" : ""}`}>
                  <div className="col-span-2">
                    <p className="font-semibold text-sm text-gray-800">{item.name}</p>
                    {isLow && <span className="text-xs text-red-500 font-semibold">⚠️ Low Stock</span>}
                  </div>
                  <span className="text-xs text-gray-500">{item.category}</span>
                  <div className="text-center">
                    <p className={`font-bold text-sm ${isLow ? "text-red-600" : "text-gray-800"}`}>{item.qty}</p>
                    <p className="text-xs text-gray-400">{item.unit}</p>
                  </div>
                  <p className="text-center text-xs text-gray-400">{item.minThreshold}</p>
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => startEdit(item)}
                      className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-blue-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteInventoryItem(item.id); }}
                      className="bg-red-50 text-red-500 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-red-100 transition"
                    >
                      Del
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
