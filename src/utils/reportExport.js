// src/utils/reportExport.js
// Utility functions for exporting data as CSV (and optionally PDF via print).
// No external dependencies needed — plain CSV download via data-URI.

// ─── CSV helpers ─────────────────────────────────────────────────────────────

function escapeCsv(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(headers, rows) {
  const lines = [headers.map(escapeCsv).join(",")];
  rows.forEach(row => lines.push(row.map(escapeCsv).join(",")));
  return lines.join("\n");
}

function downloadCsv(csv, filename) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── ANALYTICS EXPORT ────────────────────────────────────────────────────────

export function exportAnalyticsCsv({ payments, orders, filterLabel = "All time" }) {
  const totalRevenue    = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const subtotalSum     = orders.filter(o => o.status !== "pending" && o.status !== "rejected").reduce((s, o) => s + (o.subtotal || 0), 0);
  const vatSum          = orders.filter(o => o.status !== "pending" && o.status !== "rejected").reduce((s, o) => s + (o.vat || 0), 0);
  const serviceSum      = orders.filter(o => o.status !== "pending" && o.status !== "rejected").reduce((s, o) => s + (o.serviceCharge || 0), 0);
  const packagingSum    = orders.filter(o => o.status !== "pending" && o.status !== "rejected").reduce((s, o) => s + (o.packaging || 0), 0);
  const deliveryFees    = 0; // placeholder — will be filled when delivery cost data is stored on orders

  const summaryHeaders = ["Metric", "Value"];
  const summaryRows = [
    ["Filter Applied",    filterLabel],
    ["Total Revenue",     `₦${totalRevenue.toLocaleString()}`],
    ["Subtotal",          `₦${subtotalSum.toLocaleString()}`],
    ["VAT (7.5%)",        `₦${vatSum.toLocaleString()}`],
    ["Service Charges",   `₦${serviceSum.toLocaleString()}`],
    ["Packaging Fees",    `₦${packagingSum.toLocaleString()}`],
    ["Delivery Fees",     `₦${deliveryFees.toLocaleString()}`],
    ["Total Orders",      orders.length],
    ["Delivered Orders",  orders.filter(o => o.status === "delivered").length],
    ["Rejected Orders",   orders.filter(o => o.status === "rejected").length],
    ["Payment Count",     payments.length],
  ];

  const txHeaders = ["Date", "Time", "Order ID", "Amount (₦)"];
  const txRows = payments
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(p => [
      p.date ? new Date(p.date).toLocaleDateString("en-GB") : "",
      p.date ? new Date(p.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "",
      `#${String(p.id).slice(-6)}`,
      p.amount,
    ]);

  const csv = [
    "SEASONS KITCHEN — ANALYTICS REPORT",
    `Generated: ${new Date().toLocaleString("en-GB")}`,
    "",
    "=== SUMMARY ===",
    buildCsv(summaryHeaders, summaryRows),
    "",
    "=== TRANSACTIONS ===",
    buildCsv(txHeaders, txRows),
  ].join("\n");

  downloadCsv(csv, `seasons_analytics_${Date.now()}.csv`);
}

// ─── BUDGET / MARKET EXPORT ───────────────────────────────────────────────────

export function exportMarketCsv({ marketList, totals }) {
  const headers = ["Item Name", "Category", "Qty", "Unit", "Suggested Price (₦)", "Actual Price (₦)", "Total Suggested (₦)", "Total Actual (₦)", "Difference (₦)"];
  const rows = marketList.map(item => [
    item.name,
    item.category,
    item.qty,
    item.unit || "",
    item.suggestedPrice,
    item.actualPrice,
    item.suggestedPrice * item.qty,
    item.actualPrice    * item.qty,
    (item.actualPrice - item.suggestedPrice) * item.qty,
  ]);

  rows.push([]);
  rows.push(["TOTALS", "", "", "", "", "", totals.estimated, totals.actual, totals.diff]);

  const csv = [
    "SEASONS KITCHEN — MARKET LIST / BUDGET REPORT",
    `Generated: ${new Date().toLocaleString("en-GB")}`,
    "",
    buildCsv(headers, rows),
  ].join("\n");

  downloadCsv(csv, `seasons_market_${Date.now()}.csv`);
}

// ─── INVENTORY EXPORT ─────────────────────────────────────────────────────────

export function exportInventoryCsv({ inventory }) {
  const headers = ["Item Name", "Category", "Qty", "Unit", "Min Threshold", "Status"];
  const rows = inventory.map(item => [
    item.name,
    item.category,
    item.qty,
    item.unit,
    item.minThreshold,
    item.qty <= item.minThreshold ? "LOW STOCK ⚠️" : "OK",
  ]);

  const csv = [
    "SEASONS KITCHEN — INVENTORY REPORT",
    `Generated: ${new Date().toLocaleString("en-GB")}`,
    "",
    buildCsv(headers, rows),
  ].join("\n");

  downloadCsv(csv, `seasons_inventory_${Date.now()}.csv`);
}
