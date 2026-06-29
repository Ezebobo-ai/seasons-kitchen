// src/pages/AdminSettingsPage.jsx
// /admin/settings — Change Password (admin must already be logged in).
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  isAdminLoggedIn,
  verifyAdminPassword,
  setAdminPassword,
  validatePasswordStrength,
} from "../utils/adminAuth.js";

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [loggedIn] = useState(() => isAdminLoggedIn());

  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]       = useState("");
  const [confirmPassword,  setConfirmPassword]   = useState("");
  const [error,            setError]             = useState("");
  const [success,          setSuccess]           = useState("");

  // ── Guard: must be logged in to reach this page ──────────────────────────
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm border border-gray-100 text-center">
          <span className="text-3xl">🔒</span>
          <h2 className="mt-3 text-lg font-bold text-gray-800">Admin Login Required</h2>
          <p className="text-sm text-gray-500 mt-2">
            You need to log in before you can change the admin password.
          </p>
          <Link
            to="/admin"
            className="mt-5 inline-block w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm transition"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!verifyAdminPassword(currentPassword)) {
      setError("❌ Current password is incorrect.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("❌ New password and confirmation do not match.");
      return;
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      setError(`❌ ${strength.message}`);
      return;
    }

    if (newPassword === currentPassword) {
      setError("❌ New password must be different from the current password.");
      return;
    }

    setAdminPassword(newPassword);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess("✅ Password updated successfully.");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate("/admin")}
            className="text-sm font-semibold text-gray-500 hover:text-green-700 transition flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <img src="/logo.png" className="w-10 h-10 rounded-full" alt="Seasons Kitchen" />
            <div>
              <h1 className="font-bold text-gray-900 text-base">Change Admin Password</h1>
              <p className="text-xs text-gray-400">Update your dashboard login password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <Field
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter current password"
            />
            <Field
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="At least 6 characters, with a letter & number"
            />
            <Field
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter new password"
            />

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm transition shadow-sm"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-gray-200 p-3 w-full rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
      />
    </div>
  );
}
