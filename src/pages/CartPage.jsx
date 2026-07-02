import React, { useContext, useState } from "react";
import { CartContext } from "../Context/CartContext";
import { MenuContext } from "../Context/MenuContext";
import { useNavigate, Link } from "react-router-dom";
import DeliverySelector from "../components/DeliverySelector";

export default function CartPage() {
  const { cart, setCart, placeOrder } = useContext(CartContext);
  const { menuItems, deductMenuStock } = useContext(MenuContext);
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState("Home Delivery");
  const [address, setAddress] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [riderOption, setRiderOption] = useState("");

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const vat = Math.round(subtotal * 0.075);
  const serviceCharge = orderType === "Room Service" ? Math.round(subtotal * 0.05) : 0;
  let packaging = 0;

if (orderType === "Home Delivery") {
  // 3-litre soup bowls: ₦1000 per bowl
  const soupBowlQty = cart.reduce((sum, item) =>
    item.category === "Soup Bowls" ? sum + Number(item.quantity || 0) : sum, 0
  );

  // All other non-drink items: ₦500 first + ₦500 each extra
  const regularNonDrinkQty = cart.reduce((sum, item) => {
    if (item.category !== "Drinks" && item.category !== "Soup Bowls") {
      return sum + Number(item.quantity || 0);
    }
    return sum;
  }, 0);

  const soupBowlPackaging = soupBowlQty * 1000;
  const regularPackaging  = regularNonDrinkQty > 0
    ? 500 + Math.max(regularNonDrinkQty - 1, 0) * 500
    : 0;

  packaging = soupBowlPackaging + regularPackaging;
}
  const total = subtotal + vat + serviceCharge + packaging;

  
  const increaseQty = (index) => {
    const line = cart[index];
    const menuItem = menuItems.find((m) => m.id === line.id);

    let available;
    if (line.size && menuItem && Array.isArray(menuItem.sizes)) {
      const sizeData = menuItem.sizes.find((s) => s.label === line.size);
      available = sizeData ? Number(sizeData.stock) || 0 : 0;
    } else {
      available = menuItem ? (menuItem.quantityAvailable ?? 0) : (line.quantityAvailable ?? Infinity);
    }

    if ((line.quantity || 0) >= available) {
      alert(`Only ${available} available!`);
      return;
    }

    const updated = [...cart];
    updated[index] = { ...updated[index], quantity: updated[index].quantity + 1 };
    setCart(updated);
  };

  const decreaseQty = (index) => {
    const updated = [...cart];
    if (updated[index].quantity === 1) updated.splice(index, 1);
    else updated[index] = { ...updated[index], quantity: updated[index].quantity - 1 };
    setCart(updated);
  };

  
  const handleProceedToPayment = () => {
    if (!customerName.trim()) return alert("Please enter your name");

    if (orderType === "Home Delivery") {
      if (!address) return alert("Enter delivery address");
      if (!receiverPhone) return alert("Enter receiver phone number");
      if (!riderOption) return alert("Please select a rider option");
    }
    if (orderType === "Room Service") {
      if (!roomNumber) return alert("Select room number");
    }

    const orderData = {
      customerName,
      cart,
      items: cart,
      orderType,
      riderOption,
      address,
      receiverPhone,
      roomNumber,
      deliveryCoords,
      phone: orderType === "Home Delivery" ? receiverPhone : receiverPhone || "N/A",
      subtotal,
      vat,
      serviceCharge,
      packaging,
      total,
      notifyMethod: "whatsapp",
      createdAt: new Date().toISOString(),
    };


    localStorage.setItem("orderData", JSON.stringify(orderData));

    
    deductMenuStock(cart);

  
    navigate("/payment");
  };

  const isReady =
    cart.length > 0 &&
    customerName.trim() &&
    (orderType === "Home Delivery"
      ? address.trim() && receiverPhone.trim() && riderOption !== ""
      : roomNumber !== "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4">

        {/* ── Page Header ── */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Your Order</h1>
          <p className="text-sm text-gray-400 mt-1">
            {cart.length === 0
              ? "Add items from the menu to get started"
              : `${cart.reduce((s, i) => s + i.quantity, 0)} item${cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""} ready to order`}
          </p>
        </div>

        <div className="space-y-5">
          {/* ── Cart Items ── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm">Items</h2>
              {cart.length > 0 && (
                <span className="text-xs text-gray-400">{cart.length} line{cart.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-3">🍽️</p>
                <p className="text-gray-400 text-sm font-medium">Your cart is empty</p>
                <p className="text-gray-300 text-xs mt-1">Browse the menu and add something delicious</p>
                <Link
                  to="/menu"
                  className="inline-block mt-4 px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition"
                >
                  Browse Menu
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cart.map((item, index) => (
                  /* ── Mobile-optimised 2-row cart item ──────────────────
                     Row 1: thumbnail + product info (name, size, unit price)
                     Row 2: large qty controls (left) + line total (right)
                     Prevents overflow on 320–414 px screens.          ── */
                  <div key={index} className="px-4 py-4 space-y-3">

                    {/* Row 1 — image + product info */}
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm leading-snug">
                          {item.name}
                          {item.size && (
                            <span className="text-gray-400 font-normal"> ({item.size})</span>
                          )}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                        <p className="text-green-600 text-xs font-semibold mt-1">
                          ₦{Number(item.price).toLocaleString()} each
                        </p>
                      </div>
                    </div>

                    {/* Row 2 — qty controls + line total
                        Buttons are w-10 h-10 (40 px) for comfortable touch targets */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => decreaseQty(index)}
                          className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-lg flex items-center justify-center hover:bg-red-100 active:scale-95 transition"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-base font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseQty(index)}
                          className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold text-lg flex items-center justify-center hover:bg-green-100 active:scale-95 transition"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-base font-extrabold text-gray-900">
                        ₦{(Number(item.price) * Number(item.quantity)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Bill Summary ── */}
          {cart.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 text-sm">Bill Summary</h2>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-800">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>VAT (7.5%)</span>
                  <span className="font-medium text-gray-800">₦{vat.toLocaleString()}</span>
                </div>
                {orderType === "Room Service" && serviceCharge > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Service Charge (5%)</span>
                    <span className="font-medium text-gray-800">₦{serviceCharge.toLocaleString()}</span>
                  </div>
                )}
                {orderType === "Home Delivery" && packaging > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Packaging</span>
                    <span className="font-medium text-gray-800">₦{packaging.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2.5 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-extrabold text-green-600 text-lg">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </section>
          )}

          {/* ── Customer Details ── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm">Your Details</h2>
            </div>
            <div className="p-5">
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Full Name *</label>
              {/* py-3 + text-base gives ≥44 px height and prevents iOS auto-zoom */}
              <input
                type="text"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </section>

          {/* ── Delivery Details ── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm">Delivery Details</h2>
            </div>
            <div className="p-5 space-y-4">
              <DeliverySelector
                orderType={orderType}
                setOrderType={(type) => {
                  setOrderType(type);
                  setAddress("");
                  setReceiverPhone("");
                  setRoomNumber("");
                  setDeliveryCoords(null);
                  setRiderOption("");
                }}
                address={address}
                setAddress={setAddress}
                receiverPhone={receiverPhone}
                setReceiverPhone={setReceiverPhone}
                roomNumber={roomNumber}
                setRoomNumber={setRoomNumber}
                deliveryCoords={deliveryCoords}
                setDeliveryCoords={setDeliveryCoords}
              />

              {/* ── Rider Option (only for Home Delivery) ── */}
              {orderType === "Home Delivery" && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    🏍 Rider Arrangement <span className="text-red-500">*</span>
                  </p>
                  <div className="space-y-2">
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                        riderOption === "self"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-green-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="riderOption"
                        value="self"
                        checked={riderOption === "self"}
                        onChange={() => setRiderOption("self")}
                        className="mt-0.5 accent-green-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">I will send my own rider</p>
                        <p className="text-xs text-gray-400 mt-0.5">You'll arrange pickup with your own rider</p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                        riderOption === "kitchen"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-green-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="riderOption"
                        value="kitchen"
                        checked={riderOption === "kitchen"}
                        onChange={() => setRiderOption("kitchen")}
                        className="mt-0.5 accent-green-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Kitchen should arrange a rider</p>
                        <p className="text-xs text-gray-400 mt-0.5">We'll organise delivery to your address</p>
                      </div>
                    </label>
                  </div>
                  {riderOption === "" && (
                    <p className="text-xs text-orange-500 mt-2">⚠ Please select a rider option to proceed</p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Flow indicator ── */}
          {cart.length > 0 && (
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                <span className="text-xs font-medium text-green-700">Order</span>
              </div>
              <div className="w-8 h-px bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center font-bold">2</span>
                <span className="text-xs font-medium text-gray-400">Payment</span>
              </div>
              <div className="w-8 h-px bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center font-bold">3</span>
                <span className="text-xs font-medium text-gray-400">WhatsApp</span>
              </div>
            </div>
          )}

          {/* ── Proceed to Payment Button ── */}
          <button
            onClick={handleProceedToPayment}
            disabled={!isReady}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
              isReady
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 active:scale-[0.98]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {!isReady ? (
              cart.length === 0 ? "Add items to continue" : "Complete details to continue"
            ) : (
              <>
                <span className="text-xl">🏦</span>
                Proceed to Payment
              </>
            )}
          </button>

          {isReady && (
            <p className="text-center text-xs text-gray-400">
              Next: Bank transfer details → then confirm on WhatsApp
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
