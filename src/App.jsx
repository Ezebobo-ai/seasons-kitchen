// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import OrderPage from "./pages/OrderPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import Contact from "./pages/ContactPage.jsx";
import Feedback from "./pages/FeedbackPage.jsx";
import ThankYouPage from "./pages/ThankYouPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import ConfirmPage from "./pages/ConfirmPage.jsx";
import RiderSelf from "./pages/RiderSelf";
import RiderUs from "./pages/RiderUs";
import { CartProvider } from "./Context/CartContext.jsx";
import { MenuProvider } from "./Context/MenuContext.jsx";
import { FeedbackProvider } from "./Context/FeedbackContext.jsx";
import { MediaProvider } from "./Context/MediaContext.jsx";
import { InventoryProvider } from "./Context/InventoryContext.jsx";
import "./index.css";
import AdminPage from "./pages/AdminPage.jsx";
import AdminSettingsPage from "./pages/AdminSettingsPage.jsx";
import SupportButton from "./components/SupportButton.jsx";

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Navbar />}
      <main>
        <Routes>
          {/* ── Customer routes ── */}
          <Route path="/"           element={<LandingPage />} />
          <Route path="/menu"       element={<OrderPage />} />
          <Route path="/order"      element={<CartPage />} />
          <Route path="/contact"    element={<Contact />} />
          <Route path="/feedback"   element={<Feedback />} />
          <Route path="/payment"    element={<PaymentPage />} />
          <Route path="/rider-self" element={<RiderSelf />} />
          <Route path="/rider-us"   element={<RiderUs />} />
          <Route path="/confirm"    element={<ConfirmPage />} />
          <Route path="/thank-you"  element={<ThankYouPage />} />

          {/* ── Admin routes ── */}
          <Route path="/admin"          element={<AdminPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />

          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
      {!isAdmin && <SupportButton />}
      {!isAdmin && (
        <div className="bottom-ad">
          <div className="ad-content">
            The food we choose makes a difference.... Order a healthy meal today!!!
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <FeedbackProvider>
        <MenuProvider>
          <CartProvider>
            <MediaProvider>
              <InventoryProvider>
                <AppContent />
              </InventoryProvider>
            </MediaProvider>
          </CartProvider>
        </MenuProvider>
      </FeedbackProvider>
    </BrowserRouter>
  );
}
