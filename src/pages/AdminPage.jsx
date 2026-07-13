import React, { useContext, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  isAdminLoggedIn,
  setAdminLoggedIn,
  logoutAdmin,
  verifyAdminPassword,
} from "../utils/adminAuth.js";
import { CartContext } from "../Context/CartContext.jsx";
import { MenuContext, CATEGORIES } from "../Context/MenuContext.jsx";
import { FeedbackContext } from "../Context/FeedbackContext.jsx";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import AdminMediaPanel from "../components/AdminMediaPanel.jsx";
import InventoryTab from "../components/InventoryTab.jsx";
import MarketTab from "../components/MarketTab.jsx";
import RevenueBreakdownModal from "../components/RevenueBreakdownModal.jsx";
import { useInventory } from "../Context/InventoryContext.jsx";
import { uploadFileToStorage } from "../utils/storageUpload.js";
import { exportAnalyticsCsv } from "../utils/reportExport.js";
import {
  sendOrderReceiptWhatsApp,
  sendDeliveryUpdateWhatsApp,
  sendOrderConfirmedWhatsApp,
  sendOrderRejectedWhatsApp,
  sendOrderReadyWhatsApp,
  sendRiderPickedWhatsApp,
} from "../utils/whatsapp.js";

// ─── HELPERS ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = "text-gray-900", accent }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-1 ${accent ? "border-l-4 " + accent : ""}`}>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
    <p className={`text-3xl font-bold leading-none mt-1 ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// MOBILE: min-h-[44px] so every tab meets the minimum touch target size.
// flex-shrink-0 + whitespace-nowrap so tabs never squash when the strip scrolls.
const TabBtn = ({ id, label, active, onClick, badge }) => (
  <button
    onClick={() => onClick(id)}
    className={`relative px-4 min-h-[44px] flex-shrink-0 whitespace-nowrap flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
      active ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
  >
    {label}
    {badge > 0 && (
      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
        {badge}
      </span>
    )}
  </button>
);

const StatusBadge = ({ status }) => {
  const map = {
    delivered: { label: "Delivered", cls: "bg-green-100 text-green-700" },
    rejected:  { label: "Rejected",  cls: "bg-red-100 text-red-600"    },
    pending:   { label: "Pending",   cls: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "Confirmed", cls: "bg-blue-100 text-blue-700"  },
  };
  const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="font-bold text-gray-900">₦{Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAdminLoggedIn());
  const [adminPassword, setAdminPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginChecking, setLoginChecking] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [openOrder, setOpenOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState({});
  const [costInput, setCostInput] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");
  const { stock, updateStock, orders, setOrders } = useContext(CartContext);
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, increaseMenuStock, decreaseMenuStock, increaseSizeStock, decreaseSizeStock, categories, addCategory, deleteCategory, renameCategory, firestoreError } = useContext(MenuContext);
  const { feedbackList, deleteFeedback } = useContext(FeedbackContext);
  const { lowStockItems, deductOrderIngredients } = useInventory();
  // ── Seed from localStorage immediately so Admin sees choices even before backend responds ──
  const [deliveryChoices, setDeliveryChoices] = useState(
    () => JSON.parse(localStorage.getItem("deliveryChoices") || "{}")
  );
  const [analyticsRange, setAnalyticsRange] = useState("weekly"); // daily | weekly | monthly | yearly
  const [chartType, setChartType] = useState("bar"); // bar | line

  const EMPTY_FORM = { name: "", price: "", description: "", image: "", category: "Rice & Pasta" };
  // drinkSizes: array of { ml: string, price: string } used when category === "Drinks"
  const EMPTY_SIZE = () => ({ ml: "", price: "" });
  const [menuForm, setMenuForm] = useState(EMPTY_FORM);
  const [drinkSizes, setDrinkSizes] = useState([EMPTY_SIZE()]);
  const [menuImagePreview, setMenuImagePreview] = useState(null);
  const [uploadingMenuImage, setUploadingMenuImage] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [savingMenuItem, setSavingMenuItem] = useState(false);
  const [rejectOrderData, setRejectOrderData] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("analytics");
  // ── Stock adjustment input values (itemId -> numeric string) ──────────────
  const [stockAdjust, setStockAdjust] = useState({});
  const [selectedTime, setSelectedTime] = useState({});
  // Category manager state — local input only; list itself comes from context
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  // Inline rename state: which pill is being edited, and its current draft value
  const [editingCategory, setEditingCategory] = useState(null); // original name
  const [editingCategoryValue, setEditingCategoryValue] = useState("");
  const deliveryData = JSON.parse(localStorage.getItem("deliveryChoice")) || {};
  const prevCount = useRef(orders.length);
  const totalPayments = orders.filter(o => o.status === "confirmed").length;
  const payments = JSON.parse(localStorage.getItem("payments")) || [];

  // ─── ANALYTICS: filter payments by range ──────────────────────────────────
  const getFilteredRevenueData = () => {
    const now = new Date();
    return (payments || []).reduce((acc, p) => {
      if (!p.date || !p.amount) return acc;
      const d = new Date(p.date);
      let key = "";
      if (analyticsRange === "daily") {
        // last 7 days by day
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diff > 6) return acc;
        key = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
      } else if (analyticsRange === "weekly") {
        // last 8 weeks
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24 * 7));
        if (diff > 7) return acc;
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = `Wk ${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
      } else if (analyticsRange === "monthly") {
        // monthly last 12
        const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (monthDiff > 11) return acc;
        key = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      } else {
        // yearly — all years
        key = String(d.getFullYear());
      }
      const found = acc.find(i => i.date === key);
      if (found) found.amount += p.amount;
      else acc.push({ date: key, amount: p.amount });
      return acc;
    }, []);
  };

  const revenueData = getFilteredRevenueData();

  const filterPayments = (payments) => {
    return payments.filter(p => {
      const date = new Date(p.date);
      if (startDate && new Date(date) < new Date(startDate)) return false;
      if (endDate && new Date(date) > new Date(endDate)) return false;
      return true;
    });
  };

  // ─── AUTH ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setLoginError("");
    setLoginChecking(true);
    let ok = false;
    try {
      ok = await verifyAdminPassword(adminPassword);
    } catch (err) {
      console.error("[AdminPage] Login check failed:", err);
      setLoginChecking(false);
      setLoginError("❌ Could not reach the server — check your connection and try again.");
      return;
    }
    setLoginChecking(false);
    if (ok) {
      setIsAuthenticated(true);
      setAdminLoggedIn(true);
      setAdminPasswordInput("");
      setActiveTab("analytics");
    } else {
      setLoginError("❌ Incorrect password");
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
  };

  // ─── ORDER ACTIONS (UNCHANGED) ────────────────────────────────────────────
  const handleReject = (order) => setRejectOrderData(order);

  const rejectOrderComplete = () => {
    if (!rejectReason) return alert("Please select or type a reason");
    const order = rejectOrderData;
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === order.id ? { ...o, status: "rejected", reason: rejectReason, rejectedAt: new Date().toISOString() } : o
      );
      localStorage.setItem("orders", JSON.stringify(updated));
      return updated;
    });
    setRejectOrderData(null);
    setRejectReason("");
    // ✅ WhatsApp rejection notice — only for customers who chose WhatsApp at checkout.
    if (order.notifyMethod === "whatsapp" && order.phone) {
      sendOrderRejectedWhatsApp(order, rejectReason);
    }
    fetch("http://127.0.0.1:5000/reject-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: order.email, reason: rejectReason }),
    });
  };

  const sendRiderPicked = (order) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === order.id ? { ...o, deliveryStatus: "picked" } : o);
      localStorage.setItem("orders", JSON.stringify(updated));
      return updated;
    });
    // ✅ WhatsApp rider-picked update — only for customers who chose WhatsApp at checkout.
    if (order.notifyMethod === "whatsapp" && order.phone) {
      sendRiderPickedWhatsApp(order);
    }
  };

  const sendRiderDelivery = async (order) => {
    const tracking = trackingInput[order.id];
    const cost = costInput[order.id];
    if (!tracking || !cost) return alert("Fill all fields");
    setOrders(prev => {
      const updated = prev.map(o => o.id === order.id ? { ...o, deliveryStatus: "on_the_way" } : o);
      localStorage.setItem("orders", JSON.stringify(updated));
      return updated;
    });
    // ✅ WhatsApp delivery update — only for customers who chose WhatsApp at checkout.
    // Fired before the awaited fetch below so the click's user-gesture is still
    // active when WhatsApp opens (avoids popup-blocker issues).
    if (order.notifyMethod === "whatsapp" && order.phone) {
      sendDeliveryUpdateWhatsApp(order, tracking, cost);
    }
    // ✅ FIXED: Call /rider-delivery (tracking + cost email), NOT /deliver-order (choice email)
    await fetch("http://127.0.0.1:5000/rider-delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: order.email, tracking, cost }),
    });
  };

  // ─── HOOKS ────────────────────────────────────────────────────────────────

  // ── Read orders from localStorage and update state ──────────────────────────
  const syncOrders = () => {
    const stored = JSON.parse(localStorage.getItem("orders") || "[]");
    setOrders(stored);
    if (stored.length > prevCount.current) {
      if (prevCount.current > 0) alert("\u{1F4E2} New order received!");
      prevCount.current = stored.length;
    }
  };

  // ── Merge deliveryChoices from localStorage + backend ───────────────────────
  const syncChoices = async () => {
    const lsMap = JSON.parse(localStorage.getItem("deliveryChoices") || "{}");

    const storedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    const ordersMap = {};
    storedOrders.forEach(o => {
      if (o.deliveryChoice) ordersMap[String(o.id)] = o.deliveryChoice;
    });

    let backendData = {};
    try {
      const res = await fetch("http://127.0.0.1:5000/get-delivery-choices");
      backendData = await res.json();
    } catch (_) {}

    const merged = { ...backendData, ...ordersMap, ...lsMap };
    // ✅ Update display state only — do NOT write back to localStorage here.
    // Writing backend data back would re-seed localStorage after a clear,
    // because the backend's deliveryChoices.json survives localStorage.clear().
    setDeliveryChoices(merged);
  };

  useEffect(() => {
    // Initial load
    syncOrders();
    syncChoices();

    // "storage" event fires instantly when a different tab/page writes to localStorage.
    // This is how RiderSelf / RiderUs changes reach the Admin tab with zero delay.
    const onStorage = (e) => {
      if (e.key === "orders" || e.key === null)          syncOrders();
      if (e.key === "deliveryChoices" || e.key === null) syncChoices();
    };
    window.addEventListener("storage", onStorage);

    // Polling fallback (3 s) — catches same-tab writes and backend pushes.
    // Same-tab localStorage writes do NOT trigger the "storage" event in most browsers,
    // so polling is still needed for actions done within the admin tab itself.
    const poll = setInterval(() => {
      syncOrders();
      syncChoices();
    }, 3000);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(poll);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── EARLY RETURNS ────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-[350px] border border-gray-100">
          <div className="flex flex-col items-center mb-6">
            <img src="/logo.png" alt="logo" className="w-16 h-16 rounded-full shadow-md" />
            <h2 className="mt-3 text-xl font-bold text-green-700">Seasons Kitchen</h2>
            <p className="text-sm text-gray-400">Admin Dashboard</p>
          </div>
          <input
            type="password"
            placeholder="Enter admin password"
            value={adminPassword}
            onChange={(e) => setAdminPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loginChecking && handleLogin()}
            disabled={loginChecking}
            className="border border-gray-200 p-3 w-full rounded-xl mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition disabled:opacity-60"
          />
          {loginError && (
            <p className="text-xs text-red-600 font-medium mb-3 text-center">{loginError}</p>
          )}
          <button
            onClick={handleLogin}
            disabled={loginChecking}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white w-full py-3 rounded-xl font-semibold text-sm transition shadow-sm"
          >
            {loginChecking ? "Checking…" : "Login →"}
          </button>
        </div>
      </div>
    );
  }

  // ─── ORDER FUNCTIONS (UNCHANGED) ──────────────────────────────────────────
  const confirmOrder = async (order) => {
    const time = selectedTime[order.id];
    if (!time) return alert("Select preparation time");
    const payments = JSON.parse(localStorage.getItem("payments")) || [];
    if (!payments.find((p) => p.id === order.id)) {
      payments.push({ id: order.id, amount: order.total, date: new Date().toISOString() });
      localStorage.setItem("payments", JSON.stringify(payments));
    }
    // ✅ Deduct ingredients from inventory when order is confirmed
    deductOrderIngredients(order.items || []);
    setOrders((prev) => {
      const updated = prev.map((o) => o.id === order.id ? { ...o, status: "confirmed", readyTime: time } : o);
      localStorage.setItem("orders", JSON.stringify(updated));
      return updated;
    });
    // ✅ WhatsApp confirmation — only for customers who chose WhatsApp at checkout.
    // Fired before the awaited fetch below so the click's user-gesture is still
    // active when WhatsApp opens (avoids popup-blocker issues).
    if (order.notifyMethod === "whatsapp" && order.phone) {
      sendOrderConfirmedWhatsApp(order, time);
    }
    await fetch("http://127.0.0.1:5000/confirm-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: order.email, time, order }),
    });
  };

  const rejectOrder = (orderId) => {
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId ? { ...o, status: "rejected", reason: rejectReason, rejectedAt: new Date().toISOString() } : o
      );
      localStorage.setItem("orders", JSON.stringify(updated));
      return updated;
    });
  };

  const markDelivered = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    setOrders(prev => {
      const updated = prev.map(o =>
        o.id === orderId ? { ...o, status: "delivered", deliveredAt: new Date().toISOString() } : o
      );
      localStorage.setItem("orders", JSON.stringify(updated));
      return updated;
    });
    // ✅ WhatsApp "order ready" notification — only for customers who chose WhatsApp.
    // Fired before the awaited fetch below so the click's user-gesture is still
    // active when WhatsApp opens (avoids popup-blocker issues).
    if (order?.notifyMethod === "whatsapp" && order?.phone) {
      sendOrderReadyWhatsApp(order);
    }
    try {
      const res = await fetch("http://127.0.0.1:5000/deliver-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: order.email, order }),
      });
      const data = await res.json();
      console.log("✅ DELIVERY MAIL SENT:", data);
    } catch (err) { console.log("❌ DELIVERY MAIL FAILED:", err); }
  };

  const totalRevenue = orders
    .filter(o => o.status === "confirmed" || o.status === "delivered")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingCount = orders.filter(o => o.status === "pending").length;

  // ─── ANALYTICS COMPUTED ────────────────────────────────────────────────────
  const avgOrderValue = payments.length
    ? payments.reduce((s, p) => s + p.amount, 0) / payments.length
    : 0;

  const deliveryRate = orders.length
    ? Math.round((orders.filter(o => o.status === "delivered").length / orders.length) * 100)
    : 0;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo.png" className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold text-green-700 text-sm leading-tight">Seasons Kitchen</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Admin Dashboard</p>
            </div>
          </div>
          {/* MOBILE: horizontal scroll strip instead of a wrapping row — on
              narrow screens the 7 tabs no longer stack into cramped multiple
              lines; they swipe left/right in one row with 44px touch targets. */}
          <div className="flex gap-1.5 items-center overflow-x-auto no-scrollbar -mx-1 px-1 max-w-full">
            {[
              { id: "analytics", label: "Analytics" },
              { id: "stock",     label: "Stock" },
              // ── TEMPORARILY HIDDEN (WhatsApp order mode) ──
              // Orders, History, Payments, Delivery are managed via WhatsApp.
              // To reactivate: set ADMIN_WHATSAPP_MODE = false (search this file).
              // { id: "orders",    label: "Orders",   badge: pendingCount },
              // { id: "history",   label: "History" },
              // { id: "delivery",  label: "Delivery" },
              // { id: "payments",  label: "Payments" },
              { id: "menu",      label: "Menu" },
              { id: "feedback",  label: "Feedback", badge: feedbackList.length },
              { id: "media",      label: "🎬 Media" },
              { id: "inventory",  label: "📦 Inventory", badge: lowStockItems.length },
              { id: "market",     label: "🛒 Market" },
            ].map(t => (
              <TabBtn key={t.id} id={t.id} label={t.label} active={activeTab === t.id} onClick={setActiveTab} badge={t.badge || 0} />
            ))}
            <Link
              to="/admin/settings"
              className="px-3 min-h-[44px] flex-shrink-0 whitespace-nowrap flex items-center justify-center rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
            >
              ⚙️ Settings
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── FIRESTORE CONNECTION WARNING ─────────────────────────────────
          FIX: previously a Firestore read failure was invisible — the admin
          panel would silently keep showing default/seed data with no
          indication anything was wrong, which looked exactly like "my data
          disappeared." This banner makes a real connection problem obvious
          and distinguishes it from an actual data-loss scenario. */}
      {firestoreError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            <strong>Can't reach the database.</strong> What you're seeing below may be outdated or default data —
            your real menu/data is likely safe, but changes won't save until this is fixed. Check your internet
            connection and Firestore security rules.
          </span>
        </div>
      )}

      {/* ── CONTENT ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ══════════ ANALYTICS TAB ══════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <div className="space-y-6">

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Orders"
                value={orders.length}
                sub="All time"
                accent="border-l-blue-400"
              />
              <StatCard
                label="Delivered"
                value={orders.filter(o => o.status === "delivered").length}
                sub={`${deliveryRate}% success rate`}
                color="text-green-600"
                accent="border-l-green-400"
              />
              <StatCard
                label="Rejected"
                value={orders.filter(o => o.status === "rejected").length}
                sub="Review reasons in History"
                color="text-red-500"
                accent="border-l-red-400"
              />
              <RevenueBreakdownModal
                payments={payments}
                orders={orders}
                filterLabel={analyticsRange === "daily" ? "Last 7 days" : analyticsRange === "weekly" ? "Last 8 weeks" : analyticsRange === "monthly" ? "Last 12 months" : "All years"}
              />
            </div>

            {/* Revenue chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-bold text-gray-800">Revenue Overview</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {analyticsRange === "daily" ? "Last 7 days" : analyticsRange === "weekly" ? "Last 8 weeks" : analyticsRange === "monthly" ? "Last 12 months" : "All years"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* Range selector */}
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                    {["daily", "weekly", "monthly", "yearly"].map(r => (
                      <button
                        key={r}
                        onClick={() => setAnalyticsRange(r)}
                        className={`px-3 py-1.5 font-semibold capitalize transition ${
                          analyticsRange === r ? "bg-green-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {/* Chart type */}
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                    {[
                      { id: "bar", label: "▬" },
                      { id: "line", label: "╱" },
                    ].map(c => (
                      <button
                        key={c.id}
                        onClick={() => setChartType(c.id)}
                        className={`px-3 py-1.5 font-bold transition ${
                          chartType === c.id ? "bg-green-600 text-white" : "bg-white text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {revenueData.length === 0 ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-gray-300">
                  <span className="text-5xl mb-3">📊</span>
                  <p className="font-medium text-sm text-gray-400">No revenue data for this period</p>
                  <p className="text-xs text-gray-300 mt-1">Confirmed orders will appear here</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  {chartType === "bar" ? (
                    <BarChart data={revenueData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0fdf4" }} />
                      <Bar dataKey="amount" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  ) : (
                    <LineChart data={revenueData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4, fill: "#16a34a" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>

            {/* Order breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h4 className="font-bold text-gray-700 text-sm mb-4">Order Status Breakdown</h4>
                <div className="space-y-3">
                  {[
                    { label: "Delivered", count: orders.filter(o => o.status === "delivered").length, color: "bg-green-500" },
                    { label: "Pending",   count: orders.filter(o => o.status === "pending").length,   color: "bg-yellow-400" },
                    { label: "Confirmed", count: orders.filter(o => o.status === "confirmed").length, color: "bg-blue-500"  },
                    { label: "Rejected",  count: orders.filter(o => o.status === "rejected").length,  color: "bg-red-400"   },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.color}`} />
                      <p className="text-sm text-gray-600 flex-1">{row.label}</p>
                      <p className="font-bold text-gray-900 text-sm">{row.count}</p>
                      <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.color}`}
                          style={{ width: orders.length ? `${(row.count / orders.length) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h4 className="font-bold text-gray-700 text-sm mb-4">Quick Stats</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Payments received</span>
                    <span className="font-bold text-gray-900">{payments.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Avg. order value</span>
                    <span className="font-bold text-gray-900">₦{Math.round(avgOrderValue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Delivery success rate</span>
                    <span className="font-bold text-green-600">{deliveryRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Pending right now</span>
                    <span className={`font-bold ${pendingCount > 0 ? "text-yellow-600" : "text-gray-400"}`}>
                      {pendingCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ STOCK TAB ══════════════════════════════════════════ */}
        {activeTab === "stock" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <strong>📦 Quantity-Based Stock</strong> — Set how many portions/plates are available for each item. Customers see this in real time.
            </div>

            {menuItems.map(item => {
              const isDrinkItem = item.category === "Drinks" && Array.isArray(item.sizes) && item.sizes.length > 0;

              // ── DRINKS: stock managed per size, never as one shared number ──
              if (isDrinkItem) {
                const totalStock = item.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.category} · {item.sizes.length} sizes</p>
                      </div>
                      {/* Optional: total stock across all sizes */}
                      <div className={`px-4 py-1.5 rounded-xl text-sm font-bold border-2 ${
                        totalStock === 0
                          ? "bg-red-50 border-red-300 text-red-600"
                          : totalStock <= 5
                            ? "bg-orange-50 border-orange-300 text-orange-600"
                            : "bg-green-50 border-green-300 text-green-700"
                      }`}>
                        {totalStock === 0 ? "Out of Stock" : `${totalStock} total`}
                      </div>
                    </div>

                    {/* One row per size — each manages its own stock independently */}
                    <div className="space-y-2">
                      {item.sizes.map((sizeOption, sizeIndex) => {
                        const sizeStock = Number(sizeOption.stock) || 0;
                        return (
                          <div
                            key={sizeOption.label}
                            className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 flex-wrap"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold text-gray-700 whitespace-nowrap">{sizeOption.label}</span>
                              <span className={`text-xs font-semibold whitespace-nowrap ${
                                sizeStock === 0 ? "text-red-500" : sizeStock <= 5 ? "text-orange-500" : "text-green-600"
                              }`}>
                                {sizeStock === 0 ? "Out of stock" : `${sizeStock} available`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {/* MOBILE: 44×44px minimum touch target */}
                              <button
                                onClick={() => decreaseSizeStock(item.id, sizeIndex, 1)}
                                disabled={sizeStock <= 0}
                                className={`w-11 h-11 flex items-center justify-center rounded-lg text-sm font-bold transition active:scale-90 ${
                                  sizeStock <= 0
                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    : "bg-red-100 text-red-600 hover:bg-red-200"
                                }`}
                                title={`Reduce ${sizeOption.label} stock`}
                              >
                                −
                              </button>
                              <button
                                onClick={() => increaseSizeStock(item.id, sizeIndex, 1)}
                                className="w-11 h-11 flex items-center justify-center bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 active:scale-90 transition"
                                title={`Add ${sizeOption.label} stock`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // ── EVERYTHING ELSE: original single-stock UI, unchanged ──
              const qty = item.quantityAvailable ?? 0;
              const adjustVal = stockAdjust[item.id] ?? "";
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Product info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                    </div>

                    {/* Current quantity badge */}
                    <div className={`px-4 py-1.5 rounded-xl text-sm font-bold border-2 ${
                      qty === 0
                        ? "bg-red-50 border-red-300 text-red-600"
                        : qty <= 5
                          ? "bg-orange-50 border-orange-300 text-orange-600"
                          : "bg-green-50 border-green-300 text-green-700"
                    }`}>
                      {qty === 0 ? "Out of Stock" : `${qty} available`}
                    </div>
                  </div>

                  {/* Adjustment controls */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      value={adjustVal}
                      onChange={(e) => setStockAdjust({ ...stockAdjust, [item.id]: e.target.value })}
                      className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <button
                      onClick={() => {
                        const amount = Number(adjustVal);
                        if (!amount || amount <= 0) return alert("Enter a valid amount");
                        increaseMenuStock(item.id, amount);
                        setStockAdjust({ ...stockAdjust, [item.id]: "" });
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition"
                    >
                      + Add Stock
                    </button>
                    <button
                      onClick={() => {
                        const amount = Number(adjustVal);
                        if (!amount || amount <= 0) return alert("Enter a valid amount");
                        decreaseMenuStock(item.id, amount);
                        setStockAdjust({ ...stockAdjust, [item.id]: "" });
                      }}
                      className="px-4 py-2 bg-red-100 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-200 transition"
                    >
                      − Reduce Stock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════ ORDERS TAB ═════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders
              .filter(o => o.status === "pending" || o.status === "confirmed")
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(order => (
                <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-bold">🍽 SEASONS KITCHEN ORDER</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Received: {order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString()}
                    </p>
                    <div className="mt-2">
                      <p className="font-semibold text-sm">Items</p>
                      {order.items?.length ? (
                        order.items.map((item, i) => (
                          <div key={i} className="mt-2">
                            <p>{item.name}{item.size ? ` (${item.size})` : ""} x{item.quantity}</p>
                            {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                            <p>₦{Number(item.price || 0).toLocaleString()}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-yellow-600">⚠️ No items found</p>
                      )}
                    </div>
                    <div className="mt-4 text-sm">
                      <p>Order Type: {order.orderType || "N/A"}</p>
                      {order.orderType === "Home Delivery" ? (
                        <p>Address: {order.address || "N/A"}</p>
                      ) : (
                        <p>Room Number: {order.roomNumber || "N/A"}</p>
                      )}
                      <p>Phone: {order.phone || "N/A"}</p>
                      {order.notifyMethod === "whatsapp" && (
                        <p className="text-green-600 font-semibold">💬 Notify via: WhatsApp</p>
                      )}
                      {deliveryChoices[order.id] && (
                        <p className="text-blue-600">
                          Delivery: {deliveryChoices[order.id] === "self" ? "Customer will send rider" : "We should arrange rider"}
                        </p>
                      )}
                    </div>
                    <hr className="my-3" />
                    <p className="font-bold text-sm">BILL BREAKDOWN</p>
                    <div className="text-sm mt-2 space-y-1">
                      <p>Subtotal: ₦{Number(order.subtotal || 0).toLocaleString()}</p>
                      {Number(order.vat || 0) > 0 && <p>VAT: ₦{Number(order.vat).toLocaleString()}</p>}
                      {order.orderType === "Room Service" && Number(order.serviceCharge || 0) > 0 && (
                        <p>Service Charge: ₦{Number(order.serviceCharge || 0).toLocaleString()}</p>
                      )}
                      {order.orderType === "Home Delivery" && Number(order.packaging || 0) > 0 && (
                        <p>Packaging: ₦{Number(order.packaging).toLocaleString()}</p>
                      )}
                    </div>
                    <p className="font-bold text-lg">TOTAL: ₦{Number(order.total || 0).toLocaleString()}</p>
                  </div>

                  {deliveryData.orderId === order.id && (
                    <p className="text-blue-600 mt-2">
                      Delivery Choice: {deliveryData.choice === "self" ? "Customer will send a rider" : "We should book rider"}
                    </p>
                  )}
                  {deliveryData.orderId === order.id && deliveryData.choice === "self" && (
                    <button onClick={() => sendRiderPicked(order)} className="mt-3 bg-green-600 text-white px-3 py-1 rounded-lg text-sm">
                      ✅ Mark Rider Picked
                    </button>
                  )}
                  {deliveryData.orderId === order.id && deliveryData.choice === "rider" && (
                    <div className="mt-3">
                      <input placeholder="Enter Tracking ID" onChange={(e) => setTrackingInput({ ...trackingInput, [order.id]: e.target.value })} className="border p-1 mb-2 w-full rounded" />
                      <input placeholder="Enter Delivery Cost" onChange={(e) => setCostInput({ ...costInput, [order.id]: e.target.value })} className="border p-1 mb-2 w-full rounded" />
                      <button onClick={() => sendRiderDelivery(order)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">🚚 Send Delivery Info</button>
                    </div>
                  )}

                  {order.status === "pending" && (
                    <select onChange={(e) => setSelectedTime({ ...selectedTime, [order.id]: e.target.value })} className="border p-2 mt-2 rounded-lg w-full text-sm">
                      <option value="">Choose preparation time</option>
                      <option value="15 mins">15 mins</option>
                      <option value="30 mins">30 mins</option>
                      <option value="45 mins">45 mins</option>
                      <option value="1 hour">1 hour</option>
                    </select>
                  )}

                  <div className="flex gap-2 mt-3 flex-wrap">
                    {order.status === "pending" && (
                      <>
                        <button onClick={() => confirmOrder(order)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Confirm Order</button>
                        <button onClick={() => handleReject(order)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition">Reject</button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <>
                        <button disabled className="bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-semibold">Pending...</button>
                        <button onClick={() => markDelivered(order.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition">Delivered</button>
                      </>
                    )}
                    {order.notifyMethod === "whatsapp" && order.phone && order.phone !== "N/A" && (
                      <button
                        onClick={() => sendOrderReceiptWhatsApp(order)}
                        className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition"
                      >
                        📨 Send Receipt (WhatsApp)
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ══════════ PAYMENTS TAB ═══════════════════════════════════════ */}
        {activeTab === "payments" && (
          <div className="space-y-5">

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Total Revenue"
                value={`₦${payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}`}
                sub="All confirmed orders"
                color="text-green-700"
                accent="border-l-green-400"
              />
              <StatCard
                label="Payments Received"
                value={payments.length}
                sub="Transactions"
                accent="border-l-blue-400"
              />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Filter by Date</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">From</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-200 p-2 rounded-lg w-full text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">To</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-200 p-2 rounded-lg w-full text-sm" />
                </div>
                {(startDate || endDate) && (
                  <button onClick={() => { setStartDate(""); setEndDate(""); }} className="self-end px-3 py-2 text-xs text-gray-400 hover:text-red-500 transition">Clear</button>
                )}
              </div>
            </div>

            {/* Transactions table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-800 text-sm">Transactions</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {filterPayments(payments).length} of {payments.length} shown
                </p>
              </div>

              {filterPayments(payments).length === 0 ? (
                <div className="py-16 text-center text-gray-300">
                  <span className="text-4xl block mb-3">💳</span>
                  <p className="text-sm text-gray-400">No transactions in this range</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {/* Table header */}
                  <div className="grid grid-cols-3 px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                    <span>Date & Time</span>
                    <span>Order ID</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {filterPayments(payments)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(p => (
                      <div key={p.id} className="grid grid-cols-3 px-5 py-3.5 hover:bg-gray-50 transition items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(p.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">#{String(p.id).slice(-6)}</span>
                        <span className="text-right font-bold text-green-600 text-sm">
                          ₦{Number(p.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ DELIVERY TAB ═══════════════════════════════════════ */}
        {activeTab === "delivery" && (
          <div className="space-y-4">
            {orders
              .filter(o => o.status === "delivered" && o.orderType === "Home Delivery")
              .map(order => {
                const choice = deliveryChoices[order.id] || deliveryChoices[String(order.id)];
                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div onClick={() => setOpenOrder(openOrder === order.id ? null : order.id)} className="flex justify-between items-center p-4 cursor-pointer">
                      <div>
                        <p className="font-bold text-sm">📦 Order #{order.id}</p>
                        <p className="text-blue-600 text-xs mt-0.5">
                          {deliveryChoices[order.id] === "self" ? "✅ Customer will send rider" : "🚚 We should arrange rider"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                          !deliveryChoices[order.id] ? "bg-gray-400" :
                          order.deliveryStatus === "picked" ? "bg-yellow-500" :
                          order.deliveryStatus === "on_the_way" ? "bg-blue-600" :
                          order.deliveryStatus === "completed" ? "bg-green-600" : "bg-gray-400"
                        }`}>
                          {!deliveryChoices[order.id] ? "Pending" :
                           order.deliveryStatus === "picked" ? "Rider Picked" :
                           order.deliveryStatus === "on_the_way" ? "On the way" :
                           order.deliveryStatus === "completed" ? "Delivered" : "Pending"}
                        </span>
                        <span className="text-gray-400">{openOrder === order.id ? "▲" : "▼"}</span>
                      </div>
                    </div>
                    {openOrder === order.id && (
                      <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-4">
                        <p className="font-bold">🍽 SEASONS KITCHEN ORDER</p>
                        {order.items?.map((item, i) => (
                          <div key={i}>
                            <p>{item.name}{item.size ? ` (${item.size})` : ""} x{item.quantity}</p>
                            {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                            <p>₦{Number(item.price).toLocaleString()}</p>
                          </div>
                        ))}
                        <hr />
                        <div className="text-sm space-y-1">
                          <p><b>Order Type:</b> {order.orderType}</p>
                          {order.orderType === "Home Delivery" ? <p><b>Address:</b> {order.address}</p> : <p><b>Room Number:</b> {order.roomNumber}</p>}
                          <p><b>Phone:</b> {order.phone}</p>
                          {order.notifyMethod === "whatsapp" && (
                            <p className="text-green-600 font-semibold">💬 Notify via: WhatsApp</p>
                          )}
                        </div>
                        <hr />
                        <div className="text-sm space-y-1">
                          <p>Subtotal: ₦{Number(order.subtotal).toLocaleString()}</p>
                          {order.vat > 0 && <p>VAT: ₦{Number(order.vat).toLocaleString()}</p>}
                          {order.orderType === "Room Service" && <p>Service Charge: ₦{Number(order.serviceCharge || 0).toLocaleString()}</p>}
                          {order.orderType === "Home Delivery" && <p>Packaging: ₦{Number(order.packaging || 0).toLocaleString()}</p>}
                          <p className="font-bold text-lg">TOTAL: ₦{Number(order.total).toLocaleString()}</p>
                        </div>
                        <hr />
                        <p className="text-blue-600 font-semibold text-sm">
                          {deliveryChoices[order.id] === "self" ? "✅ Customer will send rider" :
                           deliveryChoices[order.id] === "rider" ? "🚚 We should arrange rider" : "❌ No choice yet"}
                        </p>
                        {deliveryChoices[order.id] === "self" && (
                          <button onClick={() => { if (!order.deliveryStatus) sendRiderPicked(order); else markDelivered(order.id); }} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold">
                            {!order.deliveryStatus ? "✅ Rider Picked" : "✅ Delivered"}
                          </button>
                        )}
                        {deliveryChoices[order.id] === "rider" && (
                          <>
                            {!order.deliveryStatus && (
                              <>
                                <input placeholder="Tracking ID" onChange={(e) => setTrackingInput({ ...trackingInput, [order.id]: e.target.value })} className="border p-2 w-full rounded-lg text-sm" />
                                <input placeholder="Delivery Cost" onChange={(e) => setCostInput({ ...costInput, [order.id]: e.target.value })} className="border p-2 w-full rounded-lg text-sm" />
                                <button onClick={() => sendRiderDelivery(order)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">🚚 Send Delivery Info</button>
                              </>
                            )}
                            {order.deliveryStatus === "on_the_way" && (
                              <button onClick={() => markDelivered(order.id)} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold">✅ Delivered</button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* ══════════ HISTORY TAB ════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div className="space-y-5">

            {/* Controls row */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-gray-400 block mb-1">From</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-200 p-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">To</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-200 p-2 rounded-lg text-sm" />
              </div>
              <div className="flex gap-2 ml-auto">
                {["all", "delivered", "rejected"].map(f => (
                  <button
                    key={f}
                    onClick={() => setHistoryFilter(f)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition ${
                      historyFilter === f ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                <span>Status</span>
                <span>Date</span>
                <span>Order Type</span>
                <span className="text-right">Amount</span>
              </div>

              {(() => {
                const filtered = orders
                  .filter(o => {
                    if (historyFilter === "delivered" && o.status !== "delivered") return false;
                    if (historyFilter === "rejected" && o.status !== "rejected") return false;
                    if (o.status !== "delivered" && o.status !== "rejected") return false;
                    const date = o.status === "delivered" ? new Date(o.deliveredAt) : new Date(o.rejectedAt);
                    if (startDate && date < new Date(startDate)) return false;
                    if (endDate && date > new Date(endDate)) return false;
                    return true;
                  })
                  .sort((a, b) => {
                    const da = a.status === "delivered" ? new Date(a.deliveredAt) : new Date(a.rejectedAt);
                    const db = b.status === "delivered" ? new Date(b.deliveredAt) : new Date(b.rejectedAt);
                    return db - da;
                  });

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 text-center text-gray-300">
                      <span className="text-4xl block mb-3">📋</span>
                      <p className="text-sm text-gray-400">No orders match this filter</p>
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-gray-50">
                    {filtered.map(order => {
                      const date = order.status === "delivered" ? order.deliveredAt : order.rejectedAt;
                      return (
                        <div key={order.id} className="grid grid-cols-4 px-5 py-3.5 hover:bg-gray-50 transition items-center">
                          <StatusBadge status={order.status} />
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {date ? new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {date ? new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </p>
                          </div>
                          <span className="text-sm text-gray-500">{order.orderType || "N/A"}</span>
                          <div className="text-right">
                            <p className="font-bold text-gray-800 text-sm">₦{Number(order.total || 0).toLocaleString()}</p>
                            <button onClick={() => setSelectedOrder(order)} className="text-xs text-green-600 hover:underline mt-0.5">View</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ══════════ MENU TAB ═══════════════════════════════════════════ */}
        {activeTab === "menu" && (
          <div className="space-y-6">

            {/* ── CATEGORY MANAGER ────────────────────────────────────── */}
            {/* Add/remove categories. Changes save to Firestore instantly  */}
            {/* and are reflected in the order form and customer menu page. */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">🗂️</span>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">Manage Categories</h3>
                  <p className="text-indigo-100 text-xs mt-0.5">Add or remove menu categories. </p>
                </div>
              </div>

              <div className="p-5">
                {/* Current category pills — click the name to rename inline */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className={`inline-flex items-center gap-1.5 border text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                        editingCategory === cat
                          ? "bg-white border-indigo-400 ring-2 ring-indigo-200"
                          : "bg-indigo-50 border-indigo-200 text-indigo-700"
                      }`}
                    >
                      {editingCategory === cat ? (
                        /* ── Inline rename input ── */
                        <>
                          <input
                            autoFocus
                            value={editingCategoryValue}
                            onChange={(e) => setEditingCategoryValue(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === "Escape") {
                                setEditingCategory(null);
                                setEditingCategoryValue("");
                              }
                              if (e.key === "Enter") {
                                const newName = editingCategoryValue.trim();
                                if (!newName || newName === cat) {
                                  setEditingCategory(null);
                                  setEditingCategoryValue("");
                                  return;
                                }
                                if (categories.some((c) => c !== cat && c.toLowerCase() === newName.toLowerCase())) {
                                  alert("A category with that name already exists.");
                                  return;
                                }
                                setCategorySaving(true);
                                try {
                                  // Rename the category AND migrate every item that used the
                                  // old name in one atomic operation (no data loss, no flicker).
                                  await renameCategory(cat, newName);
                                  setEditingCategory(null);
                                  setEditingCategoryValue("");
                                } catch (err) {
                                  console.error("Category rename failed:", err);
                                  alert(`❌ Couldn't rename category: ${err.message || "please try again."}`);
                                } finally {
                                  setCategorySaving(false);
                                }
                              }
                            }}
                            className="w-28 bg-transparent text-indigo-700 font-semibold text-xs outline-none border-none"
                          />
                          {/* Confirm (✓) */}
                          <button
                            title="Save rename"
                            onClick={async () => {
                              const newName = editingCategoryValue.trim();
                              if (!newName || newName === cat) {
                                setEditingCategory(null);
                                setEditingCategoryValue("");
                                return;
                              }
                              if (categories.some((c) => c !== cat && c.toLowerCase() === newName.toLowerCase())) {
                                alert("A category with that name already exists.");
                                return;
                              }
                              setCategorySaving(true);
                              try {
                                // Rename the category AND migrate every item that used the
                                // old name in one atomic operation (no data loss, no flicker).
                                await renameCategory(cat, newName);
                                setEditingCategory(null);
                                setEditingCategoryValue("");
                              } catch (err) {
                                console.error("Category rename failed:", err);
                                alert(`❌ Couldn't rename category: ${err.message || "please try again."}`);
                              } finally {
                                setCategorySaving(false);
                              }
                            }}
                            className="text-green-600 hover:text-green-700 font-bold leading-none transition"
                          >
                            ✓
                          </button>
                          {/* Cancel (✕) */}
                          <button
                            title="Cancel"
                            onClick={() => { setEditingCategory(null); setEditingCategoryValue(""); }}
                            className="text-gray-400 hover:text-gray-600 font-bold leading-none transition"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        /* ── Normal view: click name to start editing ── */
                        <>
                          <button
                            title={`Rename "${cat}"`}
                            onClick={() => { setEditingCategory(cat); setEditingCategoryValue(cat); }}
                            className="text-indigo-700 hover:text-indigo-900 transition"
                          >
                            {cat}
                          </button>
                          {/* Delete */}
                          <button
                            onClick={async () => {
                              const hasItems = menuItems.some((item) => item.category === cat);
                              if (hasItems) {
                                if (!window.confirm(`"${cat}" has menu items. Remove the category anyway? Items will keep their category label but won't appear in the filter.`)) return;
                              }
                              const willBeEmpty = categories.filter((c) => c !== cat).length === 0;
                              if (willBeEmpty) { alert("You must keep at least one category."); return; }
                              setCategorySaving(true);
                              try {
                                await deleteCategory(cat);
                              } catch (err) {
                                console.error("Delete category failed:", err);
                                alert(`❌ Couldn't remove category: ${err.message || "please try again."}`);
                              } finally {
                                setCategorySaving(false);
                              }
                            }}
                            className="ml-0.5 text-indigo-400 hover:text-red-500 transition font-bold leading-none"
                            title={`Remove "${cat}"`}
                          >
                            ×
                          </button>
                        </>
                      )}
                    </span>
                  ))}
                </div>

                {/* Add new category */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New category name (e.g. Salads)"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key !== "Enter") return;
                      const val = newCategoryInput.trim();
                      if (!val) return;
                      if (categories.map((c) => c.toLowerCase()).includes(val.toLowerCase())) {
                        alert("That category already exists."); return;
                      }
                      setCategorySaving(true);
                      try {
                        await addCategory(val);
                        setNewCategoryInput("");
                      } catch (err) {
                        console.error("Add category failed:", err);
                        alert(`❌ Couldn't add category: ${err.message || "please try again."}`);
                      } finally {
                        setCategorySaving(false);
                      }
                    }}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  />
                  <button
                    disabled={categorySaving || !newCategoryInput.trim()}
                    onClick={async () => {
                      const val = newCategoryInput.trim();
                      if (!val) return;
                      if (categories.map((c) => c.toLowerCase()).includes(val.toLowerCase())) {
                        alert("That category already exists."); return;
                      }
                      setCategorySaving(true);
                      try {
                        await addCategory(val);
                        setNewCategoryInput("");
                      } catch (err) {
                        console.error("Add category failed:", err);
                        alert(`❌ Couldn't add category: ${err.message || "please try again."}`);
                      } finally {
                        setCategorySaving(false);
                      }
                    }}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition ${
                      categorySaving || !newCategoryInput.trim()
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {categorySaving ? "Saving…" : "+ Add"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Press Enter or click "+ Add". git add .</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">{editingMenuId ? "✏️" : "🍽️"}</span>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">{editingMenuId ? "Edit Menu Item" : "Add New Menu Item"}</h3>
                  <p className="text-green-100 text-xs mt-0.5">{editingMenuId ? "Update the details below and save" : "Fill in the details to add a new dish"}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* ── LEFT COLUMN ── */}
                  <div className="space-y-4">

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Item Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Zobo Drink"
                        value={menuForm.name}
                        onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Category <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={menuForm.category}
                        onChange={(e) => {
                          const cat = e.target.value;
                          setMenuForm({ ...menuForm, category: cat, price: "" });
                          if (cat !== "Drinks") setDrinkSizes([EMPTY_SIZE()]);
                        }}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                      >
                        {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>

                    {/* ── DRINKS: size+price rows ── */}
                    {menuForm.category === "Drinks" ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Sizes &amp; Prices <span className="text-red-400">*</span>
                          </label>
                          <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full font-medium">Drinks only</span>
                        </div>

                        <div className="space-y-2">
                          {drinkSizes.map((row, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {/* ml input */}
                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="e.g. 250"
                                  value={row.ml}
                                  onChange={(e) => {
                                    const next = drinkSizes.map((r, i) =>
                                      i === idx ? { ...r, ml: e.target.value } : r
                                    );
                                    setDrinkSizes(next);
                                  }}
                                  className="w-full border border-gray-200 rounded-xl px-3 pr-9 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold pointer-events-none">ml</span>
                              </div>

                              <span className="text-gray-300 font-bold flex-shrink-0">→</span>

                              {/* Price input */}
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm pointer-events-none">₦</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Price"
                                  value={row.price}
                                  onChange={(e) => {
                                    const next = drinkSizes.map((r, i) =>
                                      i === idx ? { ...r, price: e.target.value } : r
                                    );
                                    setDrinkSizes(next);
                                  }}
                                  className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                                />
                              </div>

                              {/* Remove row */}
                              {drinkSizes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setDrinkSizes(drinkSizes.filter((_, i) => i !== idx))}
                                  className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0 text-xl leading-none"
                                  title="Remove size"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setDrinkSizes([...drinkSizes, EMPTY_SIZE()])}
                          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-xl transition"
                        >
                          <span className="text-base leading-none">+</span> Add Size
                        </button>
                      </div>
                    ) : (
                      /* ── NON-DRINKS: single price field ── */
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          Price (₦) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₦</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={menuForm.price}
                            onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                          />
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                      <textarea
                        placeholder="Describe the item — ingredients, taste, volume…"
                        value={menuForm.description}
                        onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition resize-none"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* ── RIGHT COLUMN: image upload ── */}
                  <div className="flex flex-col gap-3">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Item Image</label>
                    <label
                      htmlFor="menu-image-upload"
                      className="relative flex-1 min-h-[200px] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden cursor-pointer hover:border-green-400 hover:bg-green-50 transition group"
                    >
                      {(menuImagePreview || menuForm.image) ? (
                        <>
                          <img src={menuImagePreview || menuForm.image} alt="preview" className="w-full h-full object-cover absolute inset-0" />
                          {uploadingMenuImage ? (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">Uploading…</span>
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">Click to change</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                          <span className="text-4xl">📷</span>
                          <p className="text-sm font-medium">Click to upload image</p>
                          <p className="text-xs">JPG, PNG, WEBP</p>
                        </div>
                      )}
                    </label>
                    <input
                      id="menu-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        e.target.value = ""; // allow re-selecting the same file later
                        if (!file) return;

                        // FIX: previously this read the raw file into a base64
                        // string and stored it directly on the menu item, which
                        // then got written into the SAME Firestore document as
                        // the entire menu array (1MB hard limit). A desktop
                        // admin picking a small pre-sized image could sneak
                        // under that limit; a phone camera photo (often 3–12MB)
                        // could not — so saving "always failed" on mobile.
                        // Now the file goes to Firebase Storage and only its
                        // URL (a short string) is stored on the item.
                        if (file.size > 15 * 1024 * 1024) {
                          alert("❌ Image is too large (max 15MB). Please choose a smaller photo.");
                          return;
                        }

                        // Instant local preview while the upload is in flight.
                        const localPreviewUrl = URL.createObjectURL(file);
                        setMenuImagePreview(localPreviewUrl);
                        setUploadingMenuImage(true);
                        try {
                          const { url } = await uploadFileToStorage(file, "media/menu-items");
                          setMenuForm((prev) => ({ ...prev, image: url }));
                        } catch (err) {
                          console.error("Failed to upload menu item image:", err);
                          alert("❌ Failed to upload image — please check your connection and try again.");
                          setMenuImagePreview(null);
                        } finally {
                          URL.revokeObjectURL(localPreviewUrl);
                          setUploadingMenuImage(false);
                        }
                      }}
                    />
                    {(menuImagePreview || menuForm.image) && (
                      <button
                        onClick={() => { setMenuImagePreview(null); setMenuForm({ ...menuForm, image: "" }); }}
                        className="text-xs text-red-500 hover:text-red-700 self-start"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>

                {/* ── SAVE / CANCEL ── */}
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                  <button
                    disabled={savingMenuItem || uploadingMenuImage}
                    onClick={async () => {
                      const isDrink = menuForm.category === "Drinks";
                      if (!menuForm.name.trim()) { alert("Item name is required"); return; }
                      if (!menuForm.category)    { alert("Category is required");  return; }

                      let item;

                      if (isDrink) {
                        const validSizes = drinkSizes.filter(s => s.ml !== "" || s.price !== "");
                        if (validSizes.length === 0) { alert("Add at least one size and price for this drink"); return; }
                        for (const s of validSizes) {
                          if (!s.ml || Number(s.ml) <= 0)      { alert("Each size must have a valid ml value (number > 0)"); return; }
                          if (s.price === "" || Number(s.price) < 0) { alert("Each size must have a valid price"); return; }
                        }
                        const mlValues = validSizes.map(s => Number(s.ml));
                        if (mlValues.some((v, i) => mlValues.indexOf(v) !== i)) {
                          alert("Duplicate ml sizes found — each size must be unique");
                          return;
                        }
                        item = {
                          name:        menuForm.name.trim(),
                          category:    menuForm.category,
                          description: menuForm.description.trim(),
                          image:       menuForm.image || "",
                          sizes:       validSizes,
                          price:       0,
                        };
                      } else {
                        if (!menuForm.price || Number(menuForm.price) <= 0) { alert("Price is required"); return; }
                        item = {
                          name:        menuForm.name.trim(),
                          price:       Number(menuForm.price),
                          description: menuForm.description.trim(),
                          image:       menuForm.image || "",
                          category:    menuForm.category,
                        };
                      }

                      setSavingMenuItem(true);
                      try {
                        if (editingMenuId) {
                          await updateMenuItem(editingMenuId, item);
                          setEditingMenuId(null);
                        } else {
                          await addMenuItem(item);
                        }
                        // Only clear the form once Firestore has confirmed the write —
                        // this is what stops the "disappears after refresh" bug.
                        setMenuForm(EMPTY_FORM);
                        setDrinkSizes([EMPTY_SIZE()]);
                        setMenuImagePreview(null);
                      } catch (err) {
                        console.error("Failed to save menu item:", err);
                        alert("❌ Failed to save item — please check your connection and try again.");
                      } finally {
                        setSavingMenuItem(false);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
                  >
                    {uploadingMenuImage ? "Uploading image…" : savingMenuItem ? "Saving…" : editingMenuId ? "Save Changes" : "Add to Menu"}
                  </button>
                  {editingMenuId && (
                    <button
                      onClick={() => {
                        setEditingMenuId(null);
                        setMenuForm(EMPTY_FORM);
                        setDrinkSizes([EMPTY_SIZE()]);
                        setMenuImagePreview(null);
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── MENU CARDS (by category) ── */}
            {categories.map((cat) => {
              const items = menuItems.filter((item) => item.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="font-bold text-gray-700 text-sm">{cat}</h4>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {items.map((item) => {
                      const isDrinkItem = item.category === "Drinks" && Array.isArray(item.sizes) && item.sizes.length > 0;
                      const editItem = () => {
                        setEditingMenuId(item.id);
                        setMenuForm({
                          name:        item.name,
                          price:       isDrinkItem ? "" : item.price,
                          description: item.description || "",
                          image:       item.image || "",
                          category:    item.category,
                        });
                        setDrinkSizes(isDrinkItem
                          ? item.sizes.map(s => ({ ml: String(s.volume || ""), price: String(s.price || "") }))
                          : [EMPTY_SIZE()]
                        );
                        setMenuImagePreview(item.image || null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      };
                      return (
                        <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition group">
                          <div className="relative h-32 bg-gray-100">
                            {item.image
                              ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl">🍽️</div>
                            }
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button onClick={editItem} className="bg-white text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-blue-50 transition">✏️ Edit</button>
                              <button onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteMenuItem(item.id); }} className="bg-white text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-red-50 transition">🗑 Delete</button>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <p className="font-bold text-gray-800 text-xs leading-snug truncate">{item.name}</p>
                              {isDrinkItem
                                ? <span className="text-blue-500 font-bold text-[10px] whitespace-nowrap bg-blue-50 px-1.5 py-0.5 rounded-md">{item.sizes.length} size{item.sizes.length !== 1 ? "s" : ""}</span>
                                : <span className="text-green-600 font-bold text-xs whitespace-nowrap">₦{Number(item.price).toLocaleString()}</span>
                              }
                            </div>
                            {isDrinkItem && (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {item.sizes.map((s) => (
                                  <span key={s.label} className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded-md">
                                    {s.label} — ₦{Number(s.price).toLocaleString()}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>}
                            <div className="flex gap-1.5 mt-2 sm:hidden">
                              <button onClick={editItem} className="flex-1 bg-blue-50 text-blue-600 text-xs font-semibold py-1.5 rounded-lg">Edit</button>
                              <button onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteMenuItem(item.id); }} className="flex-1 bg-red-50 text-red-500 text-xs font-semibold py-1.5 rounded-lg">Delete</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}


        {activeTab === "media" && (
          <AdminMediaPanel />
        )}

        {/* ══════════ FEEDBACK TAB ═══════════════════════════════════════ */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Customer Feedback</h3>
                <p className="text-xs text-gray-500 mt-0.5">All feedback submitted through the website</p>
              </div>
              {feedbackList.length > 0 && <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">{feedbackList.length} {feedbackList.length === 1 ? "entry" : "entries"}</span>}
            </div>
            {feedbackList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 flex flex-col items-center gap-2 text-gray-400">
                <span className="text-4xl">💬</span>
                <p className="font-medium text-sm">No feedback yet</p>
                <p className="text-xs">Customer submissions will appear here instantly</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackList.map((entry) => (
                  <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start hover:shadow-md transition">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0 uppercase">{entry.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-bold text-gray-800 text-sm">{entry.name}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {new Date(entry.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{entry.message}</p>
                    </div>
                    <button onClick={() => { if (confirm(`Delete feedback from "${entry.name}"?`)) deleteFeedback(entry.id); }} className="text-gray-300 hover:text-red-500 transition flex-shrink-0 text-lg leading-none mt-0.5" title="Delete">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

        {/* ══════════ INVENTORY TAB ══════════════════════════════════════ */}
        {activeTab === "inventory" && (
          <InventoryTab />
        )}

        {/* ══════════ MARKET TAB ════════════════════════════════════════ */}
        {activeTab === "market" && (
          <MarketTab />
        )}

      {/* ── ORDER DETAIL MODAL ──────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-bold text-gray-900">🧾 Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition text-lg">×</button>
            </div>
            <div className="p-5 space-y-3">
              {selectedOrder.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}{item.size ? ` (${item.size})` : ""} ×{item.quantity}</p>
                    {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">₦{Number(item.price || 0).toLocaleString()}</span>
                </div>
              ))}
              <hr className="border-gray-100" />
              <div className="text-sm space-y-1.5 text-gray-600">
                <p><b className="text-gray-800">Order Type:</b> {selectedOrder.orderType}</p>
                {selectedOrder.orderType === "Home Delivery" ? <p><b className="text-gray-800">Address:</b> {selectedOrder.address || "N/A"}</p> : <p><b className="text-gray-800">Room Number:</b> {selectedOrder.roomNumber || "N/A"}</p>}
                <p><b className="text-gray-800">Phone:</b> {selectedOrder.phone || "N/A"}</p>
                {selectedOrder.notifyMethod === "whatsapp" && (
                  <p className="text-green-600 font-semibold">💬 Notify via: WhatsApp</p>
                )}
              </div>
              {selectedOrder.notifyMethod === "whatsapp" && selectedOrder.phone && selectedOrder.phone !== "N/A" && (
                <button
                  onClick={() => sendOrderReceiptWhatsApp(selectedOrder)}
                  className="w-full bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition"
                >
                  📨 Send Receipt (WhatsApp)
                </button>
              )}
              <hr className="border-gray-100" />
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₦{Number(selectedOrder.subtotal || 0).toLocaleString()}</span></div>
                {selectedOrder.vat > 0 && <div className="flex justify-between text-gray-500"><span>VAT</span><span>₦{Number(selectedOrder.vat).toLocaleString()}</span></div>}
                {selectedOrder.orderType === "Room Service" && <div className="flex justify-between text-gray-500"><span>Service Charge</span><span>₦{Number(selectedOrder.serviceCharge || 0).toLocaleString()}</span></div>}
                {selectedOrder.orderType === "Home Delivery" && <div className="flex justify-between text-gray-500"><span>Packaging</span><span>₦{Number(selectedOrder.packaging || 0).toLocaleString()}</span></div>}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-green-600 text-lg">₦{Number(selectedOrder.total || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="pt-2">
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ────────────────────────────────────────────── */}
      {rejectOrderData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4 text-base">Reject Order</h2>
            <select onChange={(e) => setRejectReason(e.target.value)} className="border border-gray-200 w-full p-2.5 mb-3 rounded-xl text-sm">
              <option value="">Select reason</option>
              <option value="Payment not received">Payment not received</option>
              <option value="Order not available">Order not available</option>
            </select>
            <input type="text" placeholder="Or type custom reason" onChange={(e) => setRejectReason(e.target.value)} className="border border-gray-200 w-full p-2.5 mb-4 rounded-xl text-sm" />
            <div className="flex gap-2">
              <button onClick={() => setRejectOrderData(null)} className="flex-1 bg-gray-100 px-4 py-2.5 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">Cancel</button>
              <button onClick={() => rejectOrderComplete()} className="flex-1 bg-red-600 px-4 py-2.5 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
