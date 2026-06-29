import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

function RiderUs() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("saving"); // saving | done | error | invalid
  const id = params.get("id");

  useEffect(() => {
    if (!id) { setStatus("invalid"); return; }

    // ── 1. Write into localStorage deliveryChoices map ──────────────────────
    try {
      const stored = JSON.parse(localStorage.getItem("deliveryChoices") || "{}");
      stored[id] = "rider";
      stored[String(id)] = "rider";
      localStorage.setItem("deliveryChoices", JSON.stringify(stored));
    } catch (e) { console.log("localStorage write failed:", e); }

    // ── 2. Embed deliveryChoice directly on the matching order ───────────────
    try {
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      const updated = orders.map(o =>
        String(o.id) === String(id) ? { ...o, deliveryChoice: "rider" } : o
      );
      localStorage.setItem("orders", JSON.stringify(updated));
    } catch (e) { console.log("orders update failed:", e); }

    // ── 3. Best-effort backend POST ──────────────────────────────────────────
    fetch("http://localhost:5000/delivery-choice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, choice: "rider" }),
    })
      .then(r => r.json())
      .then(() => setStatus("done"))
      .catch(() => setStatus("done")); // localStorage already saved — still done
  }, [id]);

  if (status === "invalid") {
    return (
      <PageShell accent="blue">
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
    <PageShell accent="blue">
      {/* Status icon */}
      <div className="flex justify-center mb-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all duration-500 ${
          status === "done" ? "bg-blue-100 scale-100" : "bg-gray-100 scale-95 animate-pulse"
        }`}>
          {status === "done"
            ? <span className="text-4xl">🚚</span>
            : <span className="text-4xl">⏳</span>
          }
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {status === "done" ? "Rider Being Arranged!" : "Saving your choice…"}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          {status === "done"
            ? "We're arranging a rider for your delivery. You'll receive tracking details shortly."
            : "Please wait a moment while we save your selection."
          }
        </p>
      </div>

      {status === "done" && (
        <>
          {/* Choice badge */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <p className="font-bold text-blue-800 text-sm">We'll arrange your rider</p>
              <p className="text-blue-600 text-xs">Our delivery team is on it</p>
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 mb-6">
            <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">📋 What Happens Next</p>
            </div>
            <div className="divide-y divide-gray-100">
              <StepRow step="1" label="Rider assigned" detail="Our team will book a rider for your order" />
              <StepRow step="2" label="Email update" detail="You'll receive a tracking ID and delivery cost" />
              <StepRow step="3" label="Delivery" detail="Your rider heads to your address" />
            </div>
          </div>

          {/* Tracking placeholder */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 mb-6">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3">🔍 Delivery Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg px-3 py-2.5 border border-blue-100">
                <p className="text-xs text-gray-400 mb-0.5">Tracking ID</p>
                <p className="text-sm font-bold text-gray-400 italic">Pending…</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2.5 border border-blue-100">
                <p className="text-xs text-gray-400 mb-0.5">Delivery Cost</p>
                <p className="text-sm font-bold text-gray-400 italic">Pending…</p>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3 text-center">
              Check your email — tracking details will be sent there once your rider is dispatched.
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
function PageShell({ children, accent = "green" }) {
  const gradients = {
    green: "from-green-50 via-white to-emerald-50",
    blue:  "from-blue-50 via-white to-sky-50",
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradients[accent]} flex items-center justify-center px-4 py-16`}>
      <div
        className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md p-8"
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

function StepRow({ step, label, detail }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {step}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

export default RiderUs;
