// src/utils/receiptPDF.js
// Generates a real, downloadable PDF receipt using jsPDF.
// Layout: balanced two-column header (logo+brand left / receipt#+date right),
// a clean two-column customer-details block, a dedicated wrapped address
// block, an itemized list, and a totals section — all on consistent
// margins/spacing so nothing overflows or overlaps.

import { jsPDF } from "jspdf";

const BRAND_GREEN = [22, 163, 74]; // #16a34a
const BRAND_GREEN_DARK = [21, 128, 61]; // #15803d
const DARK = [17, 24, 39]; // #111827
const MUTED = [107, 114, 128]; // #6b7280
const LIGHT_MUTED = [156, 163, 175]; // #9ca3af
const LINE = [229, 231, 235]; // #e5e7eb
const WHITE = [255, 255, 255];

const NAIRA = (n) => `NGN ${Math.round(Number(n) || 0).toLocaleString()}`;

/**
 * Loads the logo and returns it pre-composited as a perfect circle on a
 * white backing (any source aspect ratio is center-cropped to "cover" the
 * circle). Done via an off-screen canvas so jsPDF only ever has to place a
 * single already-circular PNG — no in-PDF clipping tricks needed.
 * Resolves to null on any failure so the receipt still generates fine
 * without a logo.
 */
async function loadCircularLogoDataURL(url, size = 160) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const radius = size / 2;

    // White circular backing — keeps the logo legible on the green header
    // band regardless of transparency in the source image.
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Clip to that same circle, then draw the source image "cover"-fit so a
    // non-square logo still fills the circle without distortion.
    ctx.save();
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const scale = Math.max(size / img.width, size / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    ctx.drawImage(img, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
    ctx.restore();

    URL.revokeObjectURL(objectUrl);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/**
 * Builds the receipt as a jsPDF document and returns the instance so callers
 * can save it, preview it, or reuse the layout elsewhere.
 */
export async function generateReceiptPDF({ orderData, orderId, orderDate }) {
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
  } = orderData || {};

  const riderLabel =
    riderOption === "self"
      ? "Customer sending own rider"
      : riderOption === "kitchen"
      ? "Kitchen arranging rider"
      : null;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ── Shared layout constants ────────────────────────────────────
  const marginX = 48;
  const contentRight = pageWidth - marginX;
  const headerHeight = 108;
  const rowHeight = 19;
  const sectionGap = 30;
  let y;

  const ensureSpace = (needed, onNewPage) => {
    if (y + needed > pageHeight - 90) {
      doc.addPage();
      y = 64;
      if (onNewPage) onNewPage();
    }
  };

  // Small accent bar + uppercase heading, used for every section title so
  // the visual hierarchy stays consistent throughout the document.
  const sectionHeading = (label) => {
    doc.setFillColor(...BRAND_GREEN);
    doc.rect(marginX, y - 9, 3, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK);
    doc.text(label, marginX + 10, y);
    y += 22;
  };

  // ── Header band ─────────────────────────────────────────────────
  // Left: logo + brand name + tagline. Right: receipt number + date.
  // Both blocks are vertically centered within the same header band so the
  // header reads as one balanced row.
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  const logoSize = 56;
  const logoY = (headerHeight - logoSize) / 2;
  const logoData = await loadCircularLogoDataURL("/logo.png", 160);

  let textStartX = marginX;
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", marginX, logoY, logoSize, logoSize, undefined, "FAST");
      textStartX = marginX + logoSize + 16; // clear, consistent gap from logo to text
    } catch {
      // Skip the logo silently if it can't be embedded for any reason
    }
  }

  const brandBlockCenter = headerHeight / 2;
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text("Seasons Kitchen", textStartX, brandBlockCenter - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("F R E S H   ·   H E A L T H Y   ·   D E L I C I O U S", textStartX, brandBlockCenter + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(`Receipt #${orderId}`, contentRight, brandBlockCenter - 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(String(orderDate), contentRight, brandBlockCenter + 12, { align: "right" });

  y = headerHeight + 40;

  // ── Customer details (two-column: label left, value right) ─────
  sectionHeading("CUSTOMER DETAILS");

  const detailRow = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    doc.text(label, marginX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(String(value), contentRight, y, { align: "right" });

    y += rowHeight;
  };

  detailRow("Name", customerName);
  if (phone) detailRow("Phone", phone);
  detailRow("Order Type", orderType);
  if (roomNumber) detailRow("Room Number", roomNumber);
  if (riderLabel) detailRow("Rider", riderLabel);

  // ── Address — its own wrapped block, never crammed into a row ──
  // Long addresses are placed on their own line(s) below the details so
  // they can never overflow the page or overlap neighbouring text.
  if (address) {
    y += 8;
    const addressWidth = contentRight - marginX;
    const addressLines = doc.splitTextToSize(String(address), addressWidth);
    ensureSpace(20 + addressLines.length * 13);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    doc.text("Delivery Address", marginX, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    addressLines.forEach((line) => {
      doc.text(line, marginX, y);
      y += 13;
    });
  }

  y += sectionGap - 12;
  doc.setDrawColor(...LINE);
  doc.line(marginX, y, contentRight, y);
  y += sectionGap;

  // ── Items ─────────────────────────────────────────────────────
  ensureSpace(40);
  sectionHeading("ITEMS ORDERED");

  items.forEach((item, index) => {
    ensureSpace(44, () => sectionHeading("ITEMS ORDERED (CONT'D)"));
    const lineTotal = Number(item.price || 0) * (item.quantity || 1);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK);
    const itemLabel = item.size ? `${item.name || ""} (${item.size})` : String(item.name || "");
    doc.text(itemLabel, marginX, y);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(NAIRA(lineTotal), contentRight, y, { align: "right" });
    y += 14;

    if (item.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...LIGHT_MUTED);
      doc.text(String(item.description), marginX, y);
      y += 12;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`Qty: ${item.quantity || 1}  x  ${NAIRA(item.price || 0)}`, marginX, y);
    y += 14;

    // Light divider between items (skip after the last one)
    if (index < items.length - 1) {
      doc.setDrawColor(...LINE);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(marginX, y, contentRight, y);
      doc.setLineDashPattern([], 0);
      y += 10;
    }
  });

  ensureSpace(140);
  y += sectionGap - 12;
  doc.setDrawColor(...LINE);
  doc.line(marginX, y, contentRight, y);
  y += sectionGap;

  // ── Totals ────────────────────────────────────────────────────
  const totalRow = (label, value, { bold = false } = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 13 : 10.5);
    doc.setTextColor(...(bold ? BRAND_GREEN : MUTED));
    doc.text(label, marginX, y);
    doc.setTextColor(...(bold ? BRAND_GREEN : DARK));
    doc.text(NAIRA(value), contentRight, y, { align: "right" });
    y += bold ? 24 : 17;
  };

  totalRow("Subtotal", subtotal);
  if (Number(vat) > 0) totalRow("VAT (7.5%)", vat);
  if (Number(serviceCharge) > 0) totalRow("Service Charge", serviceCharge);
  if (Number(packaging) > 0) totalRow("Packaging", packaging);

  y += 6;
  doc.setDrawColor(...DARK);
  doc.line(marginX, y, contentRight, y);
  y += 24;
  totalRow("TOTAL PAID", total, { bold: true });

  // Payment method — explicitly "Payment Method", never "Payment Confirmed"
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_GREEN_DARK);
  doc.text("Payment Method: Bank Transfer", marginX, y);

  // ── Footer ────────────────────────────────────────────────────
  y += 38;
  ensureSpace(60);
  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(...LINE);
  doc.line(marginX, y, contentRight, y);
  doc.setLineDashPattern([], 0);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...LIGHT_MUTED);
  doc.text("Thank you for choosing Seasons Kitchen. We hope you enjoy your meal!", pageWidth / 2, y, {
    align: "center",
  });
  y += 14;
  doc.text("For enquiries, reach us on WhatsApp.", pageWidth / 2, y, { align: "center" });

  return doc;
}

/**
 * Generates the PDF and triggers an immediate file download.
 * Same exported name/usage as before so existing call sites (PaymentPage,
 * ThankYouPage) keep working unchanged.
 */
export async function downloadReceiptFile(orderData, orderId, orderDate) {
  const doc = await generateReceiptPDF({ orderData, orderId, orderDate });
  doc.save(`Seasons-Kitchen-Receipt-${orderId}.pdf`);
}
