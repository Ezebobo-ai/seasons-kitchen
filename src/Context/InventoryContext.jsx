// src/Context/InventoryContext.jsx
// Manages inventory stock levels and market/budget lists.
//
// ── FIX: previously this file stored everything in localStorage, which is
// per-browser/per-device. That meant the admin's Stock/Market numbers were
// different on every device and browser, and reset to DEFAULT_INVENTORY on
// any new device, incognito window, or cleared site data.
//
// All data now lives in Firestore: settings/admin → { inventory, marketList }
// — the same document already used by MenuContext and MediaContext, so admin
// changes sync instantly across every open tab/device via onSnapshot.
//
// Every write function reads the CURRENT Firestore state immediately before
// writing (instead of building from the React state closure), the same
// pattern used in MenuContext.persist(). This avoids the stale-closure race
// where a write built from an old in-memory snapshot could silently
// overwrite (and revert) a more recent change.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import { DEFAULT_INVENTORY, DRINK_INGREDIENT_MAP } from "../data/inventoryDefaults.js";
import { seedIfAdmin } from "../utils/seedGuard.js";

const InventoryContext = createContext(null);

const ADMIN_REF = () => doc(db, "settings", "admin");

// Strip undefined values before writing to Firestore.
function clean(obj) {
  if (Array.isArray(obj)) return obj.map(clean);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, clean(v)])
    );
  }
  return obj;
}

// ─── PROVIDER ────────────────────────────────────────────────────────────────
export function InventoryProvider({ children }) {
  const [inventory, setInventory] = useState(DEFAULT_INVENTORY);
  const [marketList, setMarketList] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // ── Single source of truth: onSnapshot ──────────────────────────────────
  useEffect(() => {
    const ref = ADMIN_REF();
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.inventory)) {
            setInventory(data.inventory);
          } else {
            // First run — seed inventory into the shared admin doc, but ONLY
            // from an authenticated admin session. See utils/seedGuard.js.
            seedIfAdmin(ref, { inventory: clean(DEFAULT_INVENTORY) }, "inventory").catch(console.error);
          }
          setMarketList(Array.isArray(data.marketList) ? data.marketList : []);
        } else {
          seedIfAdmin(ref, { inventory: clean(DEFAULT_INVENTORY) }, "inventory").catch(console.error);
        }
        setLoaded(true);
      },
      (err) => {
        console.error("[InventoryContext] onSnapshot error:", err);
        setLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  // ── Fresh-read-before-write helpers ─────────────────────────────────────
  // Both take an updater(currentArray) => nextArray, matching MenuContext's
  // persist() pattern, so concurrent edits never overwrite each other.
  const persistInv = async (updater) => {
    const ref = ADMIN_REF();
    const snap = await getDoc(ref);
    const current = snap.exists() && Array.isArray(snap.data().inventory)
      ? snap.data().inventory
      : DEFAULT_INVENTORY;
    const next = clean(updater(current));
    await setDoc(ref, { inventory: next }, { merge: true });
    // onSnapshot updates state — no local setInventory() here.
  };

  const persistMarket = async (updater) => {
    const ref = ADMIN_REF();
    const snap = await getDoc(ref);
    const current = snap.exists() && Array.isArray(snap.data().marketList)
      ? snap.data().marketList
      : [];
    const next = clean(updater(current));
    await setDoc(ref, { marketList: next }, { merge: true });
    // onSnapshot updates state — no local setMarketList() here.
  };

  // ── INVENTORY CRUD ───────────────────────────────────────────────────────
  const addInventoryItem = (item) => {
    const newItem = {
      ...item,
      id: "inv_" + Date.now(),
      qty: Number(item.qty || 0),
      minThreshold: Number(item.minThreshold || 0),
    };
    persistInv((current) => [...current, newItem]).catch((err) =>
      console.error("[InventoryContext] addInventoryItem failed:", err)
    );
  };

  const updateInventoryItem = (id, updates) => {
    persistInv((current) =>
      current.map((i) =>
        i.id === id
          ? {
              ...i,
              ...updates,
              qty: Number(updates.qty ?? i.qty),
              minThreshold: Number(updates.minThreshold ?? i.minThreshold),
            }
          : i
      )
    ).catch((err) => console.error("[InventoryContext] updateInventoryItem failed:", err));
  };

  const deleteInventoryItem = (id) => {
    persistInv((current) => current.filter((i) => i.id !== id)).catch((err) =>
      console.error("[InventoryContext] deleteInventoryItem failed:", err)
    );
  };

  // ── STOCK DEDUCTION ───────────────────────────────────────────────────────
  // Called when admin CONFIRMS an order — reduces ingredients for each item.
  const deductOrderIngredients = useCallback((orderItems = []) => {
    const deductions = {}; // { inv_id: totalQty }

    orderItems.forEach((item) => {
      const map = DRINK_INGREDIENT_MAP[item.name];
      if (map) {
        map.forEach(({ id, qty }) => {
          deductions[id] = (deductions[id] || 0) + qty * (item.quantity || 1);
        });
      } else {
        deductions["inv_020"] = (deductions["inv_020"] || 0) + (item.quantity || 1);
        deductions["inv_021"] = (deductions["inv_021"] || 0) + 0.1;
      }
    });

    persistInv((current) =>
      current.map((i) =>
        deductions[i.id] !== undefined
          ? { ...i, qty: Math.max(0, i.qty - deductions[i.id]) }
          : i
      )
    ).catch((err) => console.error("[InventoryContext] deductOrderIngredients failed:", err));
  }, []);

  // ── MARKET PURCHASE → INCREASE STOCK ─────────────────────────────────────
  const applyMarketPurchase = useCallback((marketItems) => {
    const additions = {};
    marketItems.forEach((item) => {
      if (item.linkedInventoryId) {
        additions[item.linkedInventoryId] =
          (additions[item.linkedInventoryId] || 0) + Number(item.qty || 0);
      }
    });
    if (Object.keys(additions).length === 0) return;
    persistInv((current) =>
      current.map((i) => (additions[i.id] ? { ...i, qty: i.qty + additions[i.id] } : i))
    ).catch((err) => console.error("[InventoryContext] applyMarketPurchase failed:", err));
  }, []);

  // ── MARKET LIST CRUD ─────────────────────────────────────────────────────
  const addMarketItem = (item) => {
    const newItem = {
      ...item,
      id: "mkt_" + Date.now(),
      qty: Number(item.qty || 0),
      suggestedPrice: Number(item.suggestedPrice || 0),
      actualPrice: Number(item.actualPrice || 0),
    };
    persistMarket((current) => [...current, newItem]).catch((err) =>
      console.error("[InventoryContext] addMarketItem failed:", err)
    );
  };

  const updateMarketItem = (id, updates) => {
    persistMarket((current) =>
      current.map((i) =>
        i.id === id
          ? {
              ...i,
              ...updates,
              qty: Number(updates.qty ?? i.qty),
              suggestedPrice: Number(updates.suggestedPrice ?? i.suggestedPrice),
              actualPrice: Number(updates.actualPrice ?? i.actualPrice),
            }
          : i
      )
    ).catch((err) => console.error("[InventoryContext] updateMarketItem failed:", err));
  };

  const deleteMarketItem = (id) => {
    persistMarket((current) => current.filter((i) => i.id !== id)).catch((err) =>
      console.error("[InventoryContext] deleteMarketItem failed:", err)
    );
  };

  const clearMarketList = () => {
    persistMarket(() => []).catch((err) =>
      console.error("[InventoryContext] clearMarketList failed:", err)
    );
  };

  // ── DERIVED ──────────────────────────────────────────────────────────────
  const lowStockItems = inventory.filter((i) => i.qty <= i.minThreshold);

  const marketTotals = {
    estimated: marketList.reduce((s, i) => s + i.suggestedPrice * i.qty, 0),
    actual: marketList.reduce((s, i) => s + i.actualPrice * i.qty, 0),
    diff: marketList.reduce((s, i) => s + (i.actualPrice - i.suggestedPrice) * i.qty, 0),
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        deductOrderIngredients,
        marketList,
        addMarketItem,
        updateMarketItem,
        deleteMarketItem,
        clearMarketList,
        applyMarketPurchase,
        lowStockItems,
        marketTotals,
        loaded,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used inside <InventoryProvider>");
  return ctx;
}
