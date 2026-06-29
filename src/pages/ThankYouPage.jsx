// src/pages/ThankYouPage.jsx

import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../Context/CartContext.jsx";
import { downloadReceiptFile } from "../utils/receiptPDF";
import { sendNewOrderToKitchen } from "../utils/whatsapp";

export default function ThankYouPage() {
  const navigate = useNavigate();
  const { setCart } = useContext(CartContext) || { setCart: () => {} };
  const [showReceipt, setShowReceipt] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [waOpened, setWaOpened] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Tracks whether the user has actually tapped "Send Order via WhatsApp" —
  // used to know whether a later return-to-tab/app event means anything.
  const waSentRef = useRef(false);

  const orderData = JSON.parse(localStorage.getItem("orderData")) || {};
  const {
    customerName = "Valued Customer",
    items = [],
    orderType = "N/A",
    address,
    roomNumber,
    phone,
    riderOption,
    subtotal = 0,
    vat = 0,
    serviceCharge = 0,
    packaging = 0,
    total = 0,
    orderId,
    orderDate,
  } = orderData;

  const safeOrderId = orderId || `SK-${Date.now().toString().slice(-6)}`;
  const safeOrderDate =
    orderDate ||
    new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

  // Clear cart on mount (preserving existing logic)
  useEffect(() => {
    setCart([]);
  }, []);

  // Detect when the user comes back to the site/app after tapping
  // "Send Order via WhatsApp" — only fires the confirmation screen if that
  // tap actually happened, so it never triggers from an unrelated tab switch.
  useEffect(() => {
    const handleReturn = () => {
      if (waSentRef.current && document.visibilityState === "visible") {
        setOrderConfirmed(true);
      }
    };
    document.addEventListener("visibilitychange", handleReturn);
    window.addEventListener("focus", handleReturn);
    return () => {
      document.removeEventListener("visibilitychange", handleReturn);
      window.removeEventListener("focus", handleReturn);
    };
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReceiptFile(orderData, safeOrderId, safeOrderDate);
      setDownloaded(true);
    } catch (err) {
      console.error("Failed to generate receipt PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendWhatsApp = () => {
    setWaOpened(true);
    waSentRef.current = true;
    sendNewOrderToKitchen(orderData);
    setTimeout(() => setWaOpened(false), 3000);
  };

  const handleOrderMore = () => {
    setCart([]);
    localStorage.removeItem("orderData");
  };

  const riderLabel =
    riderOption === "self"
      ? "Own rider"
      : riderOption === "kitchen"
      ? "Kitchen arranged"
      : null;

  // ── Post-WhatsApp confirmation screen ─────────────────────────────────
  // Shown once the user has tapped "Send Order via WhatsApp" and returned
  // to the site/app. This is purely additive — everything above still runs
  // exactly as before; this screen simply replaces the view at that point.
  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-7 py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">✅</span>
          </div>

          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-snug">
            Thank you! Your order has been received.
          </h1>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            All communication and updates will be handled via our WhatsApp.
          </p>

          <p className="text-xs text-gray-400 mt-4">
            Order <span className="font-semibold text-gray-600">#{safeOrderId}</span>
          </p>

          <div className="space-y-3 mt-8">
            <button
              onClick={() => {
                handleOrderMore();
                navigate("/menu");
              }}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-2xl transition active:scale-[0.98]"
            >
              Order Again
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3.5 bg-white border border-gray-200 text-gray-600 font-semibold text-sm rounded-2xl hover:bg-gray-50 transition active:scale-[0.98]"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4">
      <div className="max-w-md mx-auto space-y-4">

        {/* ── Hero Header ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-7 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Payment Received
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Order <span className="font-semibold text-gray-700">#{safeOrderId}</span> · {safeOrderDate}
          </p>
        </div>

        {/* ── Instructions Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Card header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">
              Next Steps
            </p>
            <h2 className="text-base font-extrabold text-gray-900">
              Complete your order in 2 simple steps
            </h2>
          </div>

          {/* Steps */}
          <div className="px-5 py-5 space-y-5">

            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ring-2 ${
                  downloaded
                    ? "bg-green-600 text-white ring-green-200"
                    : "bg-white text-green-700 ring-green-300"
                }`}>
                  {downloaded ? "✓" : "1"}
                </div>
                <div className="w-px flex-1 bg-gray-200 mt-2 min-h-[24px]" />
              </div>
              <div className="pb-5 flex-1">
                <p className="text-sm font-bold text-gray-900 leading-snug">
                  Download your receipt (PDF)
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Tap the button below to save your receipt. You'll need to attach it to your WhatsApp message.
                </p>
                {downloaded && (
                  <p className="text-xs text-green-600 font-semibold mt-2">
                    ✓ Receipt downloaded to your Downloads folder
                  </p>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-white text-green-700 ring-2 ring-green-300 flex items-center justify-center text-sm font-extrabold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 leading-snug">
                  Send your order via WhatsApp
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Tap the button below to open WhatsApp with your pre-filled order. Then attach the downloaded receipt and tap <strong>Send</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Warning banner */}
          <div className="mx-4 mb-5 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <span className="text-amber-500 text-base flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              <span className="font-bold">Your order will only be processed</span> after we receive
              your WhatsApp message with the attached receipt.
            </p>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="space-y-3">

          {/* Step 1 Button — Download */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 font-bold text-sm transition active:scale-[0.98] ${
              downloaded
                ? "bg-green-50 border-green-200 text-green-700"
                : downloading
                ? "bg-gray-50 border-gray-200 text-gray-500 cursor-wait"
                : "bg-white border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{downloading ? "⏳" : downloaded ? "✅" : "⬇️"}</span>
              <div className="text-left">
                <p className="font-bold">
                  {downloading ? "Downloading…" : downloaded ? "Receipt Downloaded" : "Download Receipt (PDF)"}
                </p>
                <p className="text-xs font-normal opacity-70 mt-0.5">
                  {downloaded ? "Tap to download again" : "Save to your device"}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500">
              Step 1
            </span>
          </button>

          {/* Step 2 Button — WhatsApp */}
          <button
            onClick={handleSendWhatsApp}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-sm transition active:scale-[0.98] shadow-md ${
              waOpened
                ? "bg-green-700 text-white shadow-green-200"
                : "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💬</span>
              <div className="text-left">
                <p className="font-bold">
                  {waOpened ? "WhatsApp Opened ✓" : "Send Order via WhatsApp"}
                </p>
                <p className="text-xs font-normal opacity-80 mt-0.5">
                  Attach your receipt before sending
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/20 text-white">
              Step 2
            </span>
          </button>
        </div>

        {/* ── Receipt Preview Toggle ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowReceipt(!showReceipt)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🧾</span>
              <span className="font-bold text-gray-800 text-sm">View Order Summary</span>
            </div>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
              {showReceipt ? "Hide ▲" : "Show ▼"}
            </span>
          </button>

          {showReceipt && (
            <div className="border-t border-gray-100">
              {/* Receipt Header */}
              <div className="bg-gradient-to-br from-green-600 to-green-700 px-6 py-6 text-white text-center">
                <img
                  src="/logo.png"
                  alt="Seasons Kitchen"
                  className="w-12 h-12 rounded-full mx-auto mb-2.5 border-2 border-white/30 object-cover"
                />
                <h2 className="font-extrabold text-base tracking-tight">Seasons Kitchen</h2>
                <p className="text-xs opacity-70 mt-0.5">Fresh · Healthy · Delicious</p>
                <div className="mt-3 bg-white/15 rounded-xl px-4 py-2 inline-block">
                  <p className="text-xs font-bold">Receipt #{safeOrderId}</p>
                  <p className="text-xs opacity-70 mt-0.5">{safeOrderDate}</p>
                </div>
              </div>

              {/* Customer */}
              <div className="px-5 py-4 border-b border-gray-100 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Customer Details
                </p>
                <InfoRow label="Name" value={customerName} />
                {phone && <InfoRow label="Phone" value={phone} />}
                <InfoRow label="Order Type" value={orderType} />
                {address && <InfoRow label="Address" value={address} />}
                {roomNumber && <InfoRow label="Room" value={roomNumber} />}
                {riderLabel && <InfoRow label="Rider" value={riderLabel} />}
              </div>

              {/* Items */}
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Order Items
                </p>
                <div className="space-y-3.5">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">
                          {item.name}
                          {item.size && <span className="text-gray-400 font-normal"> ({item.size})</span>}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.quantity || 1} × ₦{Number(item.price || 0).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-green-700 whitespace-nowrap">
                        ₦{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill */}
              <div className="px-5 py-4 space-y-2 border-b border-gray-100">
                <BillRow label="Subtotal" value={subtotal} />
                {Number(vat) > 0 && <BillRow label="VAT (7.5%)" value={vat} />}
                {Number(serviceCharge) > 0 && (
                  <BillRow label="Service Charge" value={serviceCharge} />
                )}
                {Number(packaging) > 0 && <BillRow label="Packaging" value={packaging} />}
                <div className="flex justify-between items-center pt-2.5 border-t border-gray-200 mt-1">
                  <span className="font-extrabold text-gray-900 text-sm">Total</span>
                  <span className="font-extrabold text-green-600 text-lg">
                    ₦{Math.round(total).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment method */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-xs text-gray-500 font-medium">Payment Method</span>
                  <span className="text-xs font-bold text-gray-700">💳 Bank Transfer</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <div className="space-y-3 pt-1">
          <Link
            to="/menu"
            onClick={handleOrderMore}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-2xl text-center transition"
          >
            <span>🍽️</span> Order More Food
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center w-full py-3.5 bg-white border border-gray-200 text-gray-600 font-semibold text-sm rounded-2xl text-center hover:bg-gray-50 transition"
          >
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start text-sm gap-4">
      <span className="text-gray-400 font-medium flex-shrink-0">{label}</span>
      <span className="font-semibold text-gray-800 text-right">{value}</span>
    </div>
  );
}

function BillRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-700 font-medium">₦{Number(value).toLocaleString()}</span>
    </div>
  );
}
