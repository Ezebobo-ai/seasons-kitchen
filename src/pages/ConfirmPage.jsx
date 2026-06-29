import React, { useEffect, useContext, useRef } from "react";
import { CartContext } from "../Context/CartContext.jsx";
import { Link } from "react-router-dom";

export default function ConfirmPage() {
  const { placeOrder, setCart } = useContext(CartContext);
  const hasRun = useRef(false);

  const handleOrderMore = () => {
    localStorage.removeItem("orderData");
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const orderData = JSON.parse(localStorage.getItem("orderData"));
    if (!orderData) return;

    const {
      cart = [],
      total = 0,
      orderType,
      email,
      phone,
      notifyMethod,
      address,
      receiverPhone,
      roomNumber,

      // ✅ GET VALUES DIRECTLY (VERY IMPORTANT 🔥)
      subtotal = 0,
      vat = 0,
      serviceCharge = 0,
      packaging = 0
    } = orderData;

    // ✅ NORMALIZE TYPE (already correct now)
    const normalizedType = orderType;

    // ✅ FINAL ORDER OBJECT (NO MORE NaN EVER ✅🔥)
    const newOrder = {
      id: Date.now(),
      items: cart.map(item => ({
  ...item,
  description: item.description || ""
})),

      orderType: normalizedType,

      address:
        normalizedType === "Home Delivery"
          ? address || "No address provided"
          : null,

      roomNumber:
        normalizedType === "Room Service"
          ? roomNumber || "N/A"
          : null,

      phone: phone || receiverPhone || "N/A",

      email,
      notifyMethod,

      // ✅ USE STORED VALUES (NO RECALCULATION 🔥)
      subtotal: Number(subtotal || 0),
      vat: Number(vat || 0),
      serviceCharge: Number(serviceCharge || 0),
      packaging: Number(packaging || 0),
      total: Number(total || 0),

      createdAt: new Date().toISOString(),

      status: "pending"
    };

    console.log("✅ FINAL CLEAN ORDER:", newOrder);

    placeOrder(newOrder);

    fetch("http://127.0.0.1:5000/send-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newOrder)
    });

    localStorage.removeItem("orderData");
    localStorage.removeItem("cart");
    setCart([]);

  }, [placeOrder, setCart]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-sm w-full text-center">

        <img src="/logo.png" className="w-16 mx-auto mb-3" />

        <h1 className="text-lg font-semibold text-gray-800 mb-2">
          Order Sent ✅
        </h1>

        <p className="text-sm text-gray-500 mb-5">
          Your order has been placed successfully.
          You will receive updates shortly.
        </p>

        <Link
          to="/menu"
          onClick={handleOrderMore}
          className="block w-full bg-green-600 text-white py-2 mb-2"
        >
          Order More
        </Link>

        <Link to="/" className="block w-full bg-gray-100 py-2">
          Home
        </Link>

      </div>
    </div>
  );
}