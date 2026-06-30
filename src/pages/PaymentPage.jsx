import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BANK_DETAILS = {
  bankName: "Moniepoint",
  accountName: "De Healthy Lounge Food and Beverage",
  accountNumber: "5455388803",
};

// Step IDs for the animated confirmation sequence
const STEPS = {
  IDLE: "idle",
  PROCESSING: "processing",
  DONE: "done",
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const orderData = JSON.parse(localStorage.getItem("orderData"));

  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(STEPS.IDLE);
  const [orderId] = useState(`SK-${Date.now().toString().slice(-6)}`);
  const [orderDate] = useState(
    new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })
  );

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
          <span className="text-4xl">🛒</span>
          <p className="mt-4 text-gray-600 font-medium">No order found</p>
          <button
            onClick={() => navigate("/menu")}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  const {
    items = [],
    subtotal = 0,
    vat = 0,
    serviceCharge = 0,
    packaging = 0,
    total = 0,
    orderType,
    customerName,
  } = orderData;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  
  const handlePaymentConfirmed = async () => {
    if (step !== STEPS.IDLE) return; // prevent double-tap

    const enrichedOrder = {
      ...orderData,
      paymentConfirmed: true, // internal flag only — drives WhatsApp message wording, never shown as UI text
      paymentMethod: "bank_transfer",
      orderId,
      orderDate,
    };

    // Save enriched data for ThankYouPage
    localStorage.setItem("orderData", JSON.stringify(enrichedOrder));
    localStorage.removeItem("cart");

    // Brief processing feedback only — no receipt download, no WhatsApp here
    setStep(STEPS.PROCESSING);
    await delay(700);

    setStep(STEPS.DONE);
    await delay(300);
    navigate("/thank-you");
  };

  const isProcessing = step !== STEPS.IDLE && step !== STEPS.DONE;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="text-center pb-1">
          <img src="/logo.png" className="w-14 h-14 rounded-full mx-auto mb-3 shadow-md object-cover" alt="Seasons Kitchen" />
          <h1 className="text-2xl font-extrabold text-gray-900">Make Your Payment</h1>
          <p className="text-sm text-gray-500 mt-1">Transfer the exact amount below to confirm your order</p>
        </div>

        {/* ── Progress steps ── */}
        <div className="flex items-center justify-center gap-2">
          {[
            { label: "Order", done: true },
            { label: "Payment", active: true },
            { label: "Confirm", active: false },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div className={`w-8 h-px ${s.done || i === 1 ? "bg-green-400" : "bg-gray-200"}`} />}
              <div className="flex items-center gap-1.5">
                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${
                  s.done || i <= 1 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {i === 0 ? "✓" : i + 1}
                </span>
                <span className={`text-xs font-medium ${i <= 1 ? "text-green-700" : "text-gray-400"}`}>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* ── Amount Card ── */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white text-center shadow-lg shadow-green-200">
          <p className="text-sm font-medium opacity-80 mb-1">Total Amount to Transfer</p>
          <p className="text-5xl font-extrabold tracking-tight">₦{Math.round(total).toLocaleString()}</p>
          <p className="text-xs opacity-70 mt-2">{orderType} · {customerName}</p>
        </div>

        {/* ── Bank Details ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-lg">🏦</span>
            <h2 className="font-bold text-gray-800 text-sm">Transfer Details</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <BankRow label="Bank Name" value={BANK_DETAILS.bankName} />
            <BankRow label="Account Name" value={BANK_DETAILS.accountName} />
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm text-gray-500 font-medium">Account Number</span>
              <button
                onClick={handleCopyAccount}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-base tracking-widest transition ${
                  copied
                    ? "bg-green-50 text-green-600 border border-green-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 active:scale-95"
                }`}
              >
                {BANK_DETAILS.accountNumber}
                <span className="text-xs font-semibold tracking-normal">{copied ? "✓" : "Copy"}</span>
              </button>
            </div>
            {copied && (
              <p className="text-xs text-center text-green-600 font-medium animate-pulse">
                Copied to clipboard!
              </p>
            )}
          </div>

          <div className="mx-5 mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-bold text-amber-800 mb-2">📋 How to Pay</p>
            <ol className="text-xs text-amber-700 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Open your bank app or dial USSD</li>
              <li>Transfer exactly <strong>₦{Math.round(total).toLocaleString()}</strong> to the account above</li>
              <li>Return here and tap <strong>"I Have Made Payment"</strong></li>
              <li>On the next page, tap <strong>"Download Receipt (PDF)"</strong> to save it</li>
              <li>Then tap <strong>"Send Order via WhatsApp"</strong>, attach your receipt, and tap <strong>Send</strong></li>
            </ol>
          </div>
        </div>

        {/* ── Order Summary ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-800 text-sm">Order Summary</h2>
            <p className="text-xs text-gray-400 mt-0.5">{orderType}</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {item.name}
                    {item.size && <span className="text-gray-400 font-normal"> ({item.size})</span>}
                  </p>
                  {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                  <p className="text-xs text-gray-400">× {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  ₦{Number(item.price * (item.quantity || 1)).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 space-y-1.5 text-sm border-t border-gray-100">
            <TotalRow label="Subtotal" value={subtotal} />
            {Number(vat) > 0 && <TotalRow label="VAT (7.5%)" value={vat} />}
            {Number(serviceCharge) > 0 && <TotalRow label="Service Charge" value={serviceCharge} />}
            {Number(packaging) > 0 && <TotalRow label="Packaging" value={packaging} />}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-green-600 text-lg">₦{Math.round(total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── CONFIRM BUTTON + SEQUENCE DISPLAY ── */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handlePaymentConfirmed}
            disabled={isProcessing}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-3 ${
              isProcessing
                ? "bg-green-700 text-white cursor-wait"
                : "bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white shadow-lg shadow-green-200"
            }`}
          >
            {isProcessing ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <StepLabel step={step} />
              </>
            ) : (
              <>
                <span className="text-xl">✅</span>
                I Have Made Payment
              </>
            )}
          </button>

          {/* Animated progress under the button */}
          {isProcessing && (
            <div className="space-y-2 pt-1">
              <SequenceStep
                icon="✅"
                label="Recording your payment confirmation…"
                active={step === STEPS.PROCESSING}
                done={step === STEPS.DONE}
              />
            </div>
          )}

          {step === STEPS.IDLE && (
            <p className="text-center text-xs text-gray-400">
              You'll download your receipt and send it via WhatsApp on the next page
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 pb-2">
          🔒 Your order is processed only after payment is confirmed
        </p>
      </div>
    </div>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function StepLabel({ step }) {
  if (step === STEPS.PROCESSING) return "Confirming payment…";
  return "Almost done…";
}

function BankRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}

function TotalRow({ label, value }) {
  return (
    <div className="flex justify-between text-gray-500">
      <span>{label}</span>
      <span>₦{Number(value).toLocaleString()}</span>
    </div>
  );
}

function SequenceStep({ icon, label, active, done }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${
      done
        ? "bg-green-50 border-green-200"
        : active
        ? "bg-blue-50 border-blue-200 shadow-sm"
        : "bg-gray-50 border-gray-100 opacity-40"
    }`}>
      <span className="text-lg leading-none">{done ? "✅" : icon}</span>
      <span className={`text-sm font-semibold ${
        done ? "text-green-700" : active ? "text-blue-700" : "text-gray-400"
      }`}>
        {label}
      </span>
      {active && (
        <span className="ml-auto inline-block w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      )}
      {done && <span className="ml-auto text-green-500 text-sm font-bold">Done</span>}
    </div>
  );
}
