import React, { createContext, useState } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {

  const [cart, setCart] = useState([]);
  const [stock, setStock] = useState(
    JSON.parse(localStorage.getItem("stock")) || {}
  );

  const [orders, setOrders] = useState(
    JSON.parse(localStorage.getItem("orders")) || []
  );

  const updateStock = (id) => {
    const updated = {
      ...stock,
      [id]: stock[id] === false ? true : false,
    };
    setStock(updated);
    localStorage.setItem("stock", JSON.stringify(updated));
  };

  // ✅ ✅ ✅ FIXED ORDER STORAGE
  const placeOrder = (orderData) => {
    const newOrder = {
      id: Date.now(),
      items: orderData.items || [],

      orderType: orderData.orderType || "N/A",

      address: orderData.address || null,
      roomNumber: orderData.roomNumber || null,

      phone: orderData.phone || "N/A",
      email: orderData.email || "N/A",
      // ✅ Preserve the customer's chosen notification channel (email/whatsapp)
      // so the admin dashboard knows whether to follow up via WhatsApp.
      notifyMethod: orderData.notifyMethod || null,

      subtotal: Number(orderData.subtotal || 0),
      vat: Number(orderData.vat || 0),
      serviceCharge: Number(orderData.serviceCharge || 0),
      packaging: Number(orderData.packaging || 0),
      total: Number(orderData.total || 0),

      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // ✅ Read fresh from localStorage at call-time, NOT from stale `orders` closure.
    // If the user cleared localStorage after the app mounted, `orders` in memory
    // still holds the old items. Reading localStorage here means placeOrder always
    // starts from the true current state — empty after a clear, not from memory.
    const current = JSON.parse(localStorage.getItem("orders") || "[]");
    const updated = [newOrder, ...current];

    setOrders(updated);
    localStorage.setItem("orders", JSON.stringify(updated));
  };

  return (
    <CartContext.Provider
  value={{
    cart,
    setCart,
    stock,
    updateStock,
    orders,
    setOrders, // ✅🔥 ADD THIS LINE
    placeOrder,
  }}

    >
      {children}
    </CartContext.Provider>
  );
}