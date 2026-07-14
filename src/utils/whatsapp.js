// src/utils/whatsapp.js

import { getWhatsappNumber, FALLBACK_WHATSAPP_NUMBER } from "./settingsService.js";

// Kept for any legacy code/imports that still reference this constant directly.
// Prefer `getWhatsappNumber()` (async, Firestore-backed) for anything new.
export const BUSINESS_WHATSAPP_NUMBER = FALLBACK_WHATSAPP_NUMBER;

export function normalizePhone(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/[^\d+]/g, "");
  digits = digits.replace(/^\+/, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1);
  if (!digits) return null;
  return digits;
}

export function buildWaLink(phone, message) {
  const number = normalizePhone(phone);
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}

// ─── Message builders ──────────────────────────────────────────────────────

export function buildOrderReceiptMessage(order) {
  const lines = [];
  lines.push("🍽 *Seasons Kitchen — Order Receipt*");
  lines.push("");
  (order.items || []).forEach((item) => {
    const lineTotal = Number(item.price || 0) * (item.quantity || 1);
    const sizeLabel = item.size ? ` (${item.size})` : "";
    lines.push(`• ${item.name}${sizeLabel} x${item.quantity || 1} — ₦${lineTotal.toLocaleString()}`);
  });
  lines.push("");
  lines.push(`Order Type: ${order.orderType || "N/A"}`);
  if (order.orderType === "Home Delivery") {
    lines.push(`Address: ${order.address || "N/A"}`);
  } else {
    lines.push(`Room Number: ${order.roomNumber || "N/A"}`);
  }
  lines.push(`Total: ₦${Number(order.total || 0).toLocaleString()}`);
  lines.push("");
  lines.push("Thank you for ordering with Seasons Kitchen 💚");
  return lines.join("\n");
}

export function buildDeliveryUpdateMessage(order, tracking, cost) {
  return [
    "🚚 *Seasons Kitchen — Delivery Update*",
    "",
    "Your order is on the way!",
    `Tracking ID: ${tracking}`,
    `Delivery Cost: ₦${Number(cost || 0).toLocaleString()}`,
    "",
    "Please have someone available to receive it. Thank you for choosing Seasons Kitchen 💚",
  ].join("\n");
}

export function buildOrderConfirmedMessage(order, time) {
  return [
    "✅ *Seasons Kitchen — Order Confirmed*",
    "",
    "Your payment and order have been confirmed.",
    `Your order will be ready in ${time}.`,
    "",
    "Thank you for choosing Seasons Kitchen 💚",
  ].join("\n");
}

export function buildOrderRejectedMessage(order, reason) {
  return [
    "❌ *Seasons Kitchen — Order Rejected*",
    "",
    "Your order has been carefully reviewed.",
    "Unfortunately, we were unable to process your request.",
    `Reason: ${reason}`,
    "",
    "If you need assistance, please contact our support team.",
  ].join("\n");
}

export function buildOrderReadyMessage(order) {
  const isHomeDelivery = order?.orderType === "Home Delivery";
  const lines = [
    "🎉 *Seasons Kitchen — Order Ready*",
    "",
    isHomeDelivery ? "Your order is ready for delivery!" : "Your order is ready for pickup!",
  ];
  if (isHomeDelivery) {
    lines.push("");
    lines.push("How would you like your delivery? Please reply with one:");
    lines.push(`1) I'll send my own rider: http://localhost:5174/rider-self?id=${order?.id}`);
    lines.push(`2) Book a rider for me: http://localhost:5174/rider-us?id=${order?.id}`);
  }
  lines.push("");
  lines.push("Thank you for choosing Seasons Kitchen 💚");
  return lines.join("\n");
}

export function buildRiderPickedMessage(order) {
  return [
    "✅ *Seasons Kitchen — Rider Update*",
    "",
    "Your rider has picked up your order successfully. It is on the way.",
  ].join("\n");
}

// ─── Senders (open a pre-filled WhatsApp chat) ─────────────────────────────

export function sendOrderReceiptWhatsApp(order) {
  const message = buildOrderReceiptMessage(order);
  const link = buildWaLink(order.phone, message);
  window.open(link, "_blank", "noopener,noreferrer");
  return link;
}

export function sendDeliveryUpdateWhatsApp(order, tracking, cost) {
  const message = buildDeliveryUpdateMessage(order, tracking, cost);
  const link = buildWaLink(order.phone, message);
  window.open(link, "_blank", "noopener,noreferrer");
  return link;
}

export function sendOrderConfirmedWhatsApp(order, time) {
  const message = buildOrderConfirmedMessage(order, time);
  const link = buildWaLink(order.phone, message);
  window.open(link, "_blank", "noopener,noreferrer");
  return link;
}

export function sendOrderRejectedWhatsApp(order, reason) {
  const message = buildOrderRejectedMessage(order, reason);
  const link = buildWaLink(order.phone, message);
  window.open(link, "_blank", "noopener,noreferrer");
  return link;
}

export function sendOrderReadyWhatsApp(order) {
  const message = buildOrderReadyMessage(order);
  const link = buildWaLink(order.phone, message);
  window.open(link, "_blank", "noopener,noreferrer");
  return link;
}

export function sendRiderPickedWhatsApp(order) {
  const message = buildRiderPickedMessage(order);
  const link = buildWaLink(order.phone, message);
  window.open(link, "_blank", "noopener,noreferrer");
  return link;
}

// ─── PRIMARY ORDER SUBMISSION (WhatsApp-first flow) ───────────────────────
// Builds a detailed WhatsApp message with full item descriptions,
// delivery info, and payment confirmation.

export function buildNewOrderMessage(orderData) {
  const {
    customerName,
    cart = [],
    orderType,
    riderOption,
    address,
    phone,
    roomNumber,
    subtotal = 0,
    vat = 0,
    serviceCharge = 0,
    packaging = 0,
    total = 0,
    paymentConfirmed = false,
  } = orderData;

  const lines = [];
  lines.push("🍽 *NEW ORDER — Seasons Kitchen*");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`👤 *Name:* ${customerName || "N/A"}`);
  lines.push(`📞 *Phone:* ${phone || "N/A"}`);
  lines.push("");
  lines.push("🛒 *Items Ordered:*");

  cart.forEach((item) => {
    const lineTotal = Number(item.price || 0) * (item.quantity || 1);
    const desc = item.description ? ` _(${item.description})_` : "";
    const sizeLabel = item.size ? ` (${item.size})` : "";
    lines.push(`  • *${item.name}${sizeLabel}*${desc}`);
    lines.push(`    Qty: ${item.quantity || 1}  ×  ₦${Number(item.price || 0).toLocaleString()} = ₦${lineTotal.toLocaleString()}`);
  });

  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`🚚 *Delivery:* ${orderType || "N/A"}`);

  if (orderType === "Home Delivery") {
    const riderLabel =
      riderOption === "self"
        ? "Customer sending own rider"
        : riderOption === "kitchen"
        ? "Kitchen should arrange rider"
        : "N/A";
    lines.push(`🏍 *Rider:* ${riderLabel}`);
    lines.push(`📍 *Address:* ${address || "N/A"}`);
  } else if (orderType === "Room Service") {
    lines.push(`🚪 *Room:* ${roomNumber || "N/A"}`);
  }

  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("💰 *Bill Summary:*");
  lines.push(`  Subtotal:     ₦${Number(subtotal).toLocaleString()}`);
  if (Number(vat) > 0) lines.push(`  VAT (7.5%):   ₦${Number(vat).toLocaleString()}`);
  if (Number(serviceCharge) > 0) lines.push(`  Service:      ₦${Number(serviceCharge).toLocaleString()}`);
  if (Number(packaging) > 0) lines.push(`  Packaging:    ₦${Number(packaging).toLocaleString()}`);
  lines.push(`  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`);
  lines.push(`  *TOTAL: ₦${Number(total).toLocaleString()}*`);
  lines.push("");

  if (paymentConfirmed) {
    lines.push("💳 *Payment Method: Bank Transfer*");
    lines.push("📎 *Receipt: Customer has downloaded and will attach receipt to this chat*");
  } else {
    lines.push("⏳ *Payment: Pending confirmation*");
  }

  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("Thank you for choosing Seasons Kitchen 💚");
  return lines.join("\n");
}

export async function sendNewOrderToKitchen(orderData) {
  const message = buildNewOrderMessage(orderData);

  // Open the tab synchronously (on the user's click) so browsers don't
  // block it as a popup — we navigate it to the real link once the
  // WhatsApp number has been fetched from Firestore.
  //
  // FIX: this call must NOT use "noopener"/"noreferrer". Both flags make
  // window.open() return null (per spec — the caller is denied a handle
  // to the new window), which meant `waTab` below was always null, the
  // blank tab could never be navigated to the real wa.me link, and the
  // async fallback window.open() ran too late to count as a direct
  // response to the user's click — so browsers blocked that one too.
  // Net effect: a permanently blank tab and nothing ever sent.
  const waTab = window.open("", "_blank");

  // Brand the tab for the brief moment it's still ours — before it hands
  // off to WhatsApp, whose own title/icon take over once wa.me loads
  // (that part is outside our control; this only covers our own loading gap).
  if (waTab) {
    try {
      waTab.document.title = "Seasons Kitchen";
      const icon = waTab.document.createElement("link");
      icon.rel = "icon";
      icon.href = `${window.location.origin}/logo.png`;
      waTab.document.head.appendChild(icon);
    } catch (err) {
      console.error("[whatsapp] Could not brand the loading tab:", err);
    }
  }

  let number;
  try {
    number = await getWhatsappNumber();
  } catch (err) {
    console.error("[whatsapp] Failed to resolve WhatsApp number, using fallback:", err);
    number = FALLBACK_WHATSAPP_NUMBER;
  }

  const link = buildWaLink(number, message);

  if (waTab) {
    waTab.location.href = link;
  } else {
    // Popup was blocked — fall back to a direct navigation attempt.
    window.open(link, "_blank", "noopener,noreferrer");
  }

  return link;
}
