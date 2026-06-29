// src/Context/InventoryContext.jsx
// Manages inventory stock levels and market/budget lists.
// Completely isolated — does NOT touch CartContext, MenuContext, or any payment logic.

import React, { createContext, useContext, useState, useCallback } from "react";
import { DEFAULT_INVENTORY, DRINK_INGREDIENT_MAP } from "../data/inventoryDefaults.js";

const InventoryContext = createContext(null);

const LS_INVENTORY_KEY = "sk_inventory";
const LS_MARKET_KEY    = "sk_market_list";

// ─── HELPERS ────────────────────────────────────────────────────────────────
function loadInventory() {
  try {
    const raw = localStorage.getItem(LS_INVENTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // First load — seed defaults and persist
  localStorage.setItem(LS_INVENTORY_KEY, JSON.stringify(DEFAULT_INVENTORY));
  return DEFAULT_INVENTORY;
}

function loadMarket() {
  try {
    const raw = localStorage.getItem(LS_MARKET_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// ─── PROVIDER ────────────────────────────────────────────────────────────────
export function InventoryProvider({ children }) {

  const [inventory, setInventory] = useState(loadInventory);
  const [marketList, setMarketList] = useState(loadMarket);

  // ── Persist helpers ──────────────────────────────────────────────────────
  const persistInv = (items) => {
    setInventory(items);
    localStorage.setItem(LS_INVENTORY_KEY, JSON.stringify(items));
  };
  const persistMarket = (items) => {
    setMarketList(items);
    localStorage.setItem(LS_MARKET_KEY, JSON.stringify(items));
  };

  // ── INVENTORY CRUD ───────────────────────────────────────────────────────
  const addInventoryItem = (item) => {
    const newItem = {
      ...item,
      id: "inv_" + Date.now(),
      qty: Number(item.qty || 0),
      minThreshold: Number(item.minThreshold || 0),
    };
    persistInv([...inventory, newItem]);
  };

  const updateInventoryItem = (id, updates) => {
    persistInv(inventory.map(i =>
      i.id === id ? { ...i, ...updates, qty: Number(updates.qty ?? i.qty), minThreshold: Number(updates.minThreshold ?? i.minThreshold) } : i
    ));
  };

  const deleteInventoryItem = (id) => {
    persistInv(inventory.filter(i => i.id !== id));
  };

  // ── STOCK DEDUCTION ───────────────────────────────────────────────────────
  // Called when admin CONFIRMS an order — reduces ingredients for each item.
  // Non-drink items reduce generic packaging by 1 pack per item.
  const deductOrderIngredients = useCallback((orderItems = []) => {
    const deductions = {}; // { inv_id: totalQty }

    orderItems.forEach(item => {
      const map = DRINK_INGREDIENT_MAP[item.name];
      if (map) {
        // Drink — use specific ingredient map
        map.forEach(({ id, qty }) => {
          deductions[id] = (deductions[id] || 0) + qty * (item.quantity || 1);
        });
      } else {
        // Food — deduct 1 takeaway pack per item
        deductions["inv_020"] = (deductions["inv_020"] || 0) + (item.quantity || 1);
        // And 1 nylon bag per order (handled once, so we just add a small fraction)
        deductions["inv_021"] = (deductions["inv_021"] || 0) + 0.1;
      }
    });

    persistInv(inventory.map(i => {
      if (deductions[i.id] !== undefined) {
        return { ...i, qty: Math.max(0, i.qty - deductions[i.id]) };
      }
      return i;
    }));
  }, [inventory]);

  // ── MARKET PURCHASE → INCREASE STOCK ─────────────────────────────────────
  // When admin marks a market purchase complete, find matching inventory items
  // and increase their qty.
  const applyMarketPurchase = useCallback((marketItems) => {
    const additions = {};
    marketItems.forEach(item => {
      if (item.linkedInventoryId) {
        additions[item.linkedInventoryId] = (additions[item.linkedInventoryId] || 0) + Number(item.qty || 0);
      }
    });
    if (Object.keys(additions).length === 0) return;
    persistInv(inventory.map(i => {
      if (additions[i.id]) return { ...i, qty: i.qty + additions[i.id] };
      return i;
    }));
  }, [inventory]);

  // ── MARKET LIST CRUD ─────────────────────────────────────────────────────
  const addMarketItem = (item) => {
    persistMarket([...marketList, {
      ...item,
      id: "mkt_" + Date.now(),
      qty: Number(item.qty || 0),
      suggestedPrice: Number(item.suggestedPrice || 0),
      actualPrice: Number(item.actualPrice || 0),
    }]);
  };

  const updateMarketItem = (id, updates) => {
    persistMarket(marketList.map(i =>
      i.id === id ? { ...i, ...updates,
        qty:            Number(updates.qty          ?? i.qty),
        suggestedPrice: Number(updates.suggestedPrice ?? i.suggestedPrice),
        actualPrice:    Number(updates.actualPrice    ?? i.actualPrice),
      } : i
    ));
  };

  const deleteMarketItem = (id) => persistMarket(marketList.filter(i => i.id !== id));

  const clearMarketList = () => persistMarket([]);

  // ── DERIVED ──────────────────────────────────────────────────────────────
  const lowStockItems = inventory.filter(i => i.qty <= i.minThreshold);

  const marketTotals = {
    estimated: marketList.reduce((s, i) => s + i.suggestedPrice * i.qty, 0),
    actual:    marketList.reduce((s, i) => s + i.actualPrice    * i.qty, 0),
    diff:      marketList.reduce((s, i) => s + (i.actualPrice - i.suggestedPrice) * i.qty, 0),
  };

  return (
    <InventoryContext.Provider value={{
      inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      deductOrderIngredients,
      marketList, addMarketItem, updateMarketItem, deleteMarketItem, clearMarketList,
      applyMarketPurchase,
      lowStockItems,
      marketTotals,
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used inside <InventoryProvider>");
  return ctx;
}
