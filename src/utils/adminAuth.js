// src/utils/adminAuth.js
//
// Lightweight, fully client-side admin auth helpers.
// Handles login session and password management only.
// (Forgot-password / OTP reset flow has been removed.)

// ─── Storage keys ────────────────────────────────────────────────────────────
const ADMIN_PASSWORD_KEY = "sk_admin_password";
const ADMIN_SESSION_KEY  = "sk_admin_session";

// Default password for first-time use
const DEFAULT_ADMIN_PASSWORD = "admin123";

// ─── Password storage ────────────────────────────────────────────────────────

export function getAdminPassword() {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

export function setAdminPassword(newPassword) {
  localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
}

export function verifyAdminPassword(password) {
  return String(password || "") === getAdminPassword();
}

/**
 * Basic strength rules:
 * - at least 6 characters
 * - at least one letter
 * - at least one number
 */
export function validatePasswordStrength(password) {
  const pwd = String(password || "");
  if (!pwd.trim()) {
    return { valid: false, message: "Password cannot be empty." };
  }
  if (pwd.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters." };
  }
  if (!/[a-zA-Z]/.test(pwd)) {
    return { valid: false, message: "Password must contain at least one letter." };
  }
  if (!/[0-9]/.test(pwd)) {
    return { valid: false, message: "Password must contain at least one number." };
  }
  return { valid: true, message: "" };
}

// ─── Session (login state) ───────────────────────────────────────────────────
// sessionStorage clears automatically when the browser tab/window closes.

export function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function setAdminLoggedIn(loggedIn) {
  if (loggedIn) sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  else          sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function logoutAdmin() {
  setAdminLoggedIn(false);
}
