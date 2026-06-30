import React, { useState, useContext } from "react";
import { CartContext } from "../Context/CartContext.jsx";
import { MenuContext, CATEGORIES } from "../Context/MenuContext.jsx";
import { Link } from "react-router-dom";

export default function OrderPage() {
  const { cart, setCart } = useContext(CartContext) || {};
  const { menuItems, isInStock } = useContext(MenuContext);

  const [activeCategory, setActiveCategory] = useState("Rice & Pasta");
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [toast, setToast] = useState("");
  const [expandedItems, setExpandedItems] = useState({});
  
  const [selectedSizeByItem, setSelectedSizeByItem] = useState({});

  const getSizePriceRange = (sizes = []) => {
    const prices = sizes.map((s) => Number(s.price) || 0);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  const activeCategories = CATEGORIES.filter((cat) =>
    menuItems.some((item) => item.category === cat)
  );

  const totalQuantity = (cart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  const cartTotal = (cart || []).reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 0), 0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  
  const isSameCartLine = (a, b) =>
    a.id === b.id && a.name === b.name && (a.size || null) === (b.size || null);

 
  const getAvailableFor = (menuItem, sizeLabel) => {
    if (!menuItem) return 0;
    if (sizeLabel && Array.isArray(menuItem.sizes)) {
      const sizeData = menuItem.sizes.find((s) => s.label === sizeLabel);
      return sizeData ? Number(sizeData.stock) || 0 : 0;
    }
    return menuItem.quantityAvailable ?? 0;
  };

  const addToCart = (itemToAdd) => {
    const menuItem = menuItems.find((m) => m.id === itemToAdd.id);
    const available = getAvailableFor(menuItem || itemToAdd, itemToAdd.size);

  
    const currentQty = (cart || [])
      .filter((c) => c.id === itemToAdd.id && (c.size || null) === (itemToAdd.size || null))
      .reduce((sum, c) => sum + (c.quantity || 0), 0);

    if (currentQty >= available) {
      showToast(`Only ${available} available!`);
      return;
    }

    setCart((prev = []) => {
      const idx = prev.findIndex((c) => isSameCartLine(c, itemToAdd));
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: (next[idx].quantity || 0) + 1 };
        return next;
      }
      return [...prev, { ...itemToAdd, quantity: 1 }];
    });
  };

  const decreaseQty = (item) => {
    setCart((prev = []) => {
      const idx = prev.findIndex((c) => isSameCartLine(c, item));
      if (idx === -1) return prev;
      const next = [...prev];
      if ((next[idx].quantity || 0) <= 1) next.splice(idx, 1);
      else next[idx] = { ...next[idx], quantity: next[idx].quantity - 1 };
      return next;
    });
  };

  const increaseQty = (item) => {
    const menuItem = menuItems.find((m) => m.id === item.id);
    const available = getAvailableFor(menuItem, item.size);
    const totalQtyForItem = (cart || [])
      .filter((c) => c.id === item.id && (c.size || null) === (item.size || null))
      .reduce((sum, c) => sum + (c.quantity || 0), 0);
    if (totalQtyForItem >= available) {
      showToast(`Only ${available} available!`);
      return;
    }

    setCart((prev = []) => {
      const idx = prev.findIndex((c) => isSameCartLine(c, item));
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: (next[idx].quantity || 0) + 1 };
      return next;
    });
  };

 
  const addDrinkToCart = (item, sizeOption) => {
    const { sizes, ...base } = item;
    addToCart({
      ...base,
      size: sizeOption.label,
      volume: sizeOption.volume,
      price: sizeOption.price,
    });
  };

  const filteredItems = menuItems.filter(
    (item) =>
      item.category === activeCategory &&
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50/50 pt-20 pb-24">

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-green-700 text-white text-sm font-semibold rounded-full shadow-xl">
          🛒 {toast}
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="text-center mb-5">
          <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Our Menu</p>
          <h1 className="text-3xl font-extrabold text-gray-900">What are you craving?</h1>
          <p className="text-gray-500 mt-1.5 text-sm">Fresh, made-to-order meals from our kitchen to you</p>
        </div>

        {/* Search + Cart */}
        <div className="flex gap-3 max-w-xl mx-auto">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search dishes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
            />
          </div>
          <Link
            to="/order"
            className="relative flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-sm hover:bg-green-700 transition"
          >
            🛒
            {totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold shadow">
                {totalQuantity}
              </span>
            )}
            {cartTotal > 0 && (
              <span className="hidden sm:inline text-xs opacity-90">₦{cartTotal.toLocaleString()}</span>
            )}
          </Link>
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {activeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSearch(""); }}
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-semibold transition border ${
                activeCategory === cat
                  ? "bg-green-600 text-white border-green-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── MENU GRID ── */}
      <div className="max-w-6xl mx-auto px-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">🍽️</p>
            <p className="font-semibold text-gray-600">No items found</p>
            <p className="text-sm mt-1">Try a different category or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredItems.map((item) => {
              const isDrinkWithSizes = Array.isArray(item.sizes) && item.sizes.length > 0;
              const inCart = (cart || []).find((c) => c.id === item.id);
              const available = item.quantityAvailable ?? 0;
              const isOutOfStock = !isInStock(item);

             
              const totalQtyForItem = (cart || [])
                .filter((c) => c.id === item.id)
                .reduce((sum, c) => sum + (c.quantity || 0), 0);

              const selectedLabel = selectedSizeByItem[item.id];
              const selectedSize = isDrinkWithSizes
                ? item.sizes.find((s) => s.label === selectedLabel)
                : null;
              const priceRange = isDrinkWithSizes ? getSizePriceRange(item.sizes) : null;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Image */}
                  <div
                    className="relative h-44 bg-gray-100 cursor-pointer overflow-hidden"
                    onClick={() => item.image && setPreviewImage(item.image)}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">🍽️</div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">Sold Out</span>
                      </div>
                    )}
                    {!isOutOfStock && totalQtyForItem > 0 && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow">
                        <span className="text-white text-xs font-bold">{totalQtyForItem}</span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-800 text-sm leading-snug">{item.name}</h3>
                      <span className="text-green-600 font-extrabold text-sm whitespace-nowrap">
                        {isDrinkWithSizes
                          ? priceRange.min === priceRange.max
                            ? `₦${priceRange.min.toLocaleString()}`
                            : `From ₦${priceRange.min.toLocaleString()}`
                          : `₦${Number(item.price).toLocaleString()}`}
                      </span>
                    </div>

                    {!isOutOfStock && (
                      <p className="text-xs text-gray-400 mb-1">
                        {available} {available === 1 ? "portion" : "portions"} left
                      </p>
                    )}

                    {item.description && (
                      <p className="text-xs text-gray-500 leading-relaxed mb-2">
                        {expandedItems[item.id]
                          ? item.description
                          : item.description.length > 65
                            ? item.description.substring(0, 65) + "…"
                            : item.description}
                        {item.description.length > 65 && (
                          <button
                            className="ml-1 text-green-600 font-semibold hover:underline"
                            onClick={() => setExpandedItems({ ...expandedItems, [item.id]: !expandedItems[item.id] })}
                          >
                            {expandedItems[item.id] ? " less" : " more"}
                          </button>
                        )}
                      </p>
                    )}

                    <div className="flex-1" />

                    {isOutOfStock ? (
                      <button disabled className="w-full mt-2 py-2 bg-gray-100 text-gray-400 text-xs font-semibold rounded-xl cursor-not-allowed">
                        Currently Unavailable
                      </button>
                    ) : isDrinkWithSizes ? (
                      <div className="mt-1">
                        {/* Size picker — "350ml - ₦1000" style rows, single-select,
                            each with its own independent stock */}
                        <div className="space-y-1.5 mb-2">
                          {item.sizes.map((sizeOption) => {
                            const isSelected = selectedLabel === sizeOption.label;
                            const sizeStock = Number(sizeOption.stock) || 0;
                            const sizeSoldOut = sizeStock <= 0;
                            return (
                              <button
                                key={sizeOption.label}
                                disabled={sizeSoldOut}
                                onClick={() =>
                                  setSelectedSizeByItem({ ...selectedSizeByItem, [item.id]: sizeOption.label })
                                }
                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                                  sizeSoldOut
                                    ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                                    : isSelected
                                      ? "border-green-500 bg-green-50 text-green-700"
                                      : "border-gray-200 text-gray-600 hover:border-green-300"
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                      sizeSoldOut ? "border-gray-200" : isSelected ? "border-green-600" : "border-gray-300"
                                    }`}
                                  >
                                    {isSelected && !sizeSoldOut && <span className="w-1.5 h-1.5 rounded-full bg-green-600" />}
                                  </span>
                                  {sizeOption.label}
                                  {!sizeSoldOut && sizeStock <= 5 && (
                                    <span className="text-[10px] text-orange-500 font-medium">({sizeStock} left)</span>
                                  )}
                                </span>
                                <span>{sizeSoldOut ? "Sold out" : `₦${Number(sizeOption.price).toLocaleString()}`}</span>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => {
                            if (!selectedSize) {
                              showToast("Please select a size first");
                              return;
                            }
                            addDrinkToCart(item, selectedSize);
                            showToast(`${item.name} (${selectedSize.label}) added!`);
                          }}
                          disabled={!selectedSize}
                          className={`w-full py-2.5 text-xs font-bold rounded-xl transition ${
                            selectedSize
                              ? "bg-green-600 hover:bg-green-700 active:scale-95 text-white"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {selectedSize ? "+ Add to Order" : "Select a size to continue"}
                        </button>
                      </div>
                    ) : inCart ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2 mt-2">
                        <button
                          onClick={() => decreaseQty(inCart)}
                          className="w-7 h-7 flex items-center justify-center bg-white border border-green-300 rounded-lg text-green-700 font-bold text-lg hover:bg-green-100 transition"
                        >
                          −
                        </button>
                        <span className="text-sm font-extrabold text-gray-800">{inCart.quantity}</span>
                        <button
                          onClick={() => increaseQty(inCart)}
                          disabled={inCart.quantity >= available}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-white font-bold text-lg transition ${
                            inCart.quantity >= available
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          addToCart(item);
                          showToast(`${item.name} added!`);
                        }}
                        className="w-full mt-2 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-bold rounded-xl transition"
                      >
                        + Add to Order
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── STICKY CART BAR (when items added) ── */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40">
          <div className="max-w-lg mx-auto">
            <Link
              to="/order"
              className="flex items-center justify-between bg-green-600 hover:bg-green-700 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-green-300/50 transition"
            >
              <span className="bg-white/20 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
                {totalQuantity} item{totalQuantity !== 1 ? "s" : ""}
              </span>
              <span className="font-extrabold text-sm">View Cart & Order</span>
              <span className="font-extrabold text-sm">₦{cartTotal.toLocaleString()}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── IMAGE PREVIEW ── */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border-4 border-white"
          />
        </div>
      )}
    </div>
  );
}
