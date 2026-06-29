import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

function RiderSelf() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("saving"); // saving | done | error | invalid
  const id = params.get("id");

  useEffect(() => {
    if (!id) { setStatus("invalid"); return; }

    // ── 1. Write into localStorage deliveryChoices map ──────────────────────
    try {
      const stored = JSON.parse(localStorage.getItem("deliveryChoices") || "{}");
      stored[id] = "self";
      stored[String(id)] = "self";
      localStorage.setItem("deliveryChoices", JSON.stringify(stored));
    } catch (e) { console.log("localStorage write failed:", e); }

    // ── 2. Embed deliveryChoice directly on the matching order ───────────────
    try {
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      const updated = orders.map(o =>
        String(o.id) === String(id) ? { ...o, deliveryChoice: "self" } : o
      );
      localStorage.setItem("orders", JSON.stringify(updated));
    } catch (e) { console.log("orders update failed:", e); }

    // ── 3. Best-effort backend POST ──────────────────────────────────────────
    fetch("http://localhost:5000/delivery-choice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, choice: "self" }),
    })
      .then(r => r.json())
      .then(() => setStatus("done"))
      .catch(() => setStatus("done")); // localStorage already saved — still done
  }, [id]);

  if (status === "invalid") {
    return (
      <PageShell>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Link</h2>
          <p className="text-sm text-gray-500">This link is missing an order ID. Please use the link from your confirmation email.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Status icon */}
      <div className="flex justify-center mb-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all duration-500 ${
          status === "done" ? "bg-green-100 scale-100" : "bg-gray-100 scale-95 animate-pulse"
        }`}>
          {status === "done"
            ? <span className="text-4xl">✅</span>
            : <span className="text-4xl">⏳</span>
          }
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {status === "done" ? "Choice Confirmed!" : "Saving your choice…"}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          {status === "done"
            ? "You've chosen to send your own rider. We're preparing your order for pickup."
            : "Please wait a moment while we save your selection."
          }
        </p>
      </div>

      {status === "done" && (
        <>
          {/* Choice badge */}
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <span className="text-2xl">🏍️</span>
            <div>
              <p className="font-bold text-green-800 text-sm">You will send your rider</p>
              <p className="text-green-600 text-xs">Our team has been notified</p>
            </div>
          </div>

          {/* Pickup details */}
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 mb-6">
            <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">📍 Rider Pickup Details</p>
            </div>
            <div className="divide-y divide-gray-100">
              <DetailRow label="Location" value="Seasons Kitchen, Nile University Abuja" />
              <DetailRow label="Order ID" value={`#${String(id).slice(-8)}`} mono />
              <DetailRow label="Customer Line" value="0801 234 5678" />
            </div>
          </div>

          {/* Instruction */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs font-semibold text-amber-800 mb-1">📌 Note for your rider</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Please share the <strong>Order ID</strong> and the <strong>pickup address</strong> with your rider before they head out.
            </p>
          </div>

          {/* Order ID pill */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Your order reference</p>
            <span className="inline-block bg-white border border-gray-200 rounded-full px-4 py-1.5 font-mono text-sm font-semibold text-gray-700 shadow-sm">
              #{id}
            </span>
          </div>
        </>
      )}
    </PageShell>
  );
}

// ── Shared layout shell ──────────────────────────────────────────────────────
function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4 py-16">
      <div
        className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md p-8 animate-fadeIn"
        style={{ animation: "fadeIn 0.4s ease-out" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="Seasons Kitchen"
            className="w-14 h-14 rounded-full shadow-md border-2 border-green-100 mb-3"
          />
          <p className="text-xs font-semibold text-green-700 uppercase tracking-widest">Seasons Kitchen</p>
        </div>
        {children}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex justify-between items-start px-4 py-3 gap-4">
      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{label}</span>
      <span className={`text-xs font-semibold text-gray-700 text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default RiderSelf;
