// src/components/Navbar.jsx
import React, { useContext, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { CartContext } from "../Context/CartContext.jsx";

export default function Navbar() {
  const { cart } = useContext(CartContext) || { cart: [] };
  const totalQuantity = (cart || []).reduce((s, i) => s + (i.quantity || 0), 0);
  const [open, setOpen] = useState(false);

  const activeClass = "text-green-700 font-semibold";
  const baseClass = "text-gray-700 hover:text-green-700";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-3 md:p-4">
        {/* Logo + Kitchen name */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Seasons Kitchen"
            className="w-12 h-12 object-cover rounded-full border-2 border-white shadow-sm"
            title="Seasons Kitchen"
          />
          <span className="text-lg font-bold text-gray-800">Seasons Kitchen</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" className={({ isActive }) => (isActive ? activeClass : baseClass)}>HOME</NavLink>
          <NavLink to="/menu" className={({ isActive }) => (isActive ? activeClass : baseClass)}>MENU</NavLink>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? activeClass : baseClass)}>CONTACT</NavLink>
          <NavLink to="/feedback" className={({ isActive }) => (isActive ? activeClass : baseClass)}>FEEDBACK</NavLink>
        </nav>

        {/* Right side: cart + mobile toggle */}
        <div className="flex items-center gap-3">
          <NavLink to="/order" className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition" aria-label="Go to cart">
            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 6h14l-2-6" />
            </svg>
            <span className="hidden sm:inline font-medium text-gray-800">My Order</span>
            {totalQuantity > 0 && (
              <span className="ml-2 inline-flex items-center justify-center bg-red-600 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                {totalQuantity}
              </span>
            )}
          </NavLink>

          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-green-700 focus:outline-none"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {open ? (
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden bg-white/95 border-t shadow-sm ${open ? "block" : "hidden"}`}>
        <div className="max-w-6xl mx-auto flex flex-col p-4 gap-3">
          <NavLink to="/" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? activeClass : baseClass)}>HOME</NavLink>
          <NavLink to="/menu" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? activeClass : baseClass)}>MENU</NavLink>
          <NavLink to="/contact" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? activeClass : baseClass)}>CONTACT</NavLink>
          <NavLink to="/feedback" onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? activeClass : baseClass)}>FEEDBACK</NavLink>

          <NavLink to="/order" onClick={() => setOpen(false)} className="mt-2 flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100">
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 6h14l-2-6" />
            </svg>
            <span className="font-medium text-gray-800">My Order</span>
            {totalQuantity > 0 && (
              <span className="ml-auto inline-flex items-center justify-center bg-red-600 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                {totalQuantity}
              </span>
            )}
          </NavLink>
        </div>
      </div>
    </header>
  );
}