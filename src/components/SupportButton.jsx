// src/components/SupportButton.jsx

import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const SUPPORT_PHONE = "tel:2348180149672";
const SUPPORT_WHATSAPP = "https://wa.me/2348180149672";

// Pages where the button must NOT appear
const HIDDEN_PATHS = ["/contact", "/feedback"];

export default function SupportButton() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const shouldHide = HIDDEN_PATHS.includes(location.pathname);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close popup when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      {!shouldHide && (
        <div
          ref={menuRef}
          className="fixed bottom-14 right-4 z-50 flex flex-col items-end gap-3"
          style={{ isolation: "isolate" }}
        >
          {/* ── Popup menu ── */}
          <div
            aria-hidden={!open}
            className={`flex flex-col gap-2 transition-all duration-200 origin-bottom-right ${
              open
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-90 translate-y-2 pointer-events-none"
            }`}
          >
            {/* Call */}
            <a
              href={SUPPORT_PHONE}
              className="flex items-center gap-3 bg-white text-gray-800 font-semibold text-sm
              px-4 py-3 rounded-2xl shadow-lg border border-gray-100
              hover:bg-gray-50 active:scale-95 transition-all duration-150"
            >
              <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                📞
              </span>
              Call Us
            </a>

            {/* WhatsApp */}
            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white text-gray-800 font-semibold text-sm
              px-4 py-3 rounded-2xl shadow-lg border border-gray-100
              hover:bg-gray-50 active:scale-95 transition-all duration-150"
            >
              <span className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                💬
              </span>
              Chat on WhatsApp
            </a>

            {/* Label */}
            <p className="text-xs text-gray-500 text-center pr-1">
              Need help?
            </p>
          </div>

          {/* ── Floating Button ── */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Customer support"
            aria-expanded={open}
            className={`
              w-14 h-14 rounded-full overflow-hidden
              shadow-xl border-2 border-white
              transition-all duration-200
              hover:scale-110 hover:shadow-2xl
              active:scale-95
              ${open ? "ring-2 ring-green-400" : ""}
            `}
          >
            <img
              src="/chat_agent.jpeg"
              alt="Customer support"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </button>
          
<span className="text-[11px] font-semibold text-white bg-green-600 px-2 py-0.5 rounded-full shadow">
  Customer Support
</span>
        </div>
      )}
    </>
  );
}
