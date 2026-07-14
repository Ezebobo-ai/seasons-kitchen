// src/utils/adminAuth.js
//
// Lightweight admin auth helpers.
//
// ── FIX: the admin PASSWORD used to live only in this browser's
// localStorage. Changing it on one device never reached any other device
// — a new device, a cleared browser, or an incognito window would silently
// fall back to the hardcoded factory default, which looked like "the admin
// panel reset itself." The password itself is now stored in Firestore
// (settings/admin -> adminPassword), the same document already used for
// the WhatsApp number, so a change made on one device is immediately the
// correct password everywhere.
//
// The LOGIN SESSION (isAdminLoggedIn/setAdminLoggedIn/logoutAdmin) is
// intentionally kept per-device in sessionStorage — being logged in on
// your laptop should not automatically log in your phone, that's normal,
// expected behavior for a login session and is unrelated to the password
// itself being correct.
//
// Writes only ever happen after a password has already been verified
// (either the current password, during a deliberate "change password"
// action, or — for the one-time migration below — the legacy password
// itself), so this file never writes to Firestore automatically or
// unauthenticated, consistent with the CRITICAL-2 fix in MenuContext /
// InventoryContext / MediaContext.

// ── FORCE-LOGOUT ON PASSWORD CHANGE: each device that logs in records a
// "password version" (the server's passwordChangedAt, as millis) in its own
// sessionStorage. usePasswordChangeWatcher.js listens to that field live and
// logs the device out the moment it sees a version this session didn't set
// itself — i.e. the password was changed somewhere else.

import { getAdminSettings, updateAdminPassword } from "./settingsService.js";

// ─── Storage keys ────────────────────────────────────────────────────────────
const ADMIN_PASSWORD_KEY = "sk_admin_password"; // legacy, per-device — read-only now, used only for migration
const ADMIN_SESSION_KEY  = "sk_admin_session";
const PW_VERSION_KEY     = "sk_admin_pw_version"; // this session's known passwordChangedAt (ms), or "0" if unset

// Default password for first-time use / brand-new deploy.
const DEFAULT_ADMIN_PASSWORD = "admin123";

function toVersionString(passwordChangedAt) {
  return passwordChangedAt?.toMillis ? String(passwordChangedAt.toMillis()) : "0";
}

/** Records the given settings' passwordChangedAt as THIS session's known
 *  version, so the change-watcher won't treat it as a foreign change. */
function recordPasswordVersion(settings) {
  sessionStorage.setItem(PW_VERSION_KEY, toVersionString(settings?.passwordChangedAt));
}

/** Used by usePasswordChangeWatcher.js to compare against live Firestore data. */
export function getStoredPasswordVersion() {
  return sessionStorage.getItem(PW_VERSION_KEY);
}

export function setStoredPasswordVersion(versionString) {
  sessionStorage.setItem(PW_VERSION_KEY, versionString);
}

export function clearStoredPasswordVersion() {
  sessionStorage.removeItem(PW_VERSION_KEY);
}

// A plain module-level flag (NOT sessionStorage) — scoped to this one tab's
// JS execution context only. setAdminPassword() sets it synchronously BEFORE
// writing to Firestore, so even the near-instant local echo of our own write
// that the watcher's onSnapshot receives is covered — there is no read-after
// -write race to lose. Other tabs/devices have their own separate module
// instance, so this flag never suppresses a genuinely foreign change.
let selfChangeInFlight = false;

/** Called by usePasswordChangeWatcher.js when it sees a version change. */
export function consumeSelfChangeFlag() {
  const was = selfChangeInFlight;
  selfChangeInFlight = false;
  return was;
}

// ─── Password storage (Firestore-backed) ─────────────────────────────────────

/**
 * Returns the current admin password.
 * Firestore is the source of truth once a password has been set there.
 * Before that (brand-new project, or Firestore unreachable), falls back to
 * this device's legacy localStorage value if present, then the hardcoded
 * default — the same fallback chain verifyAdminPassword() uses below.
 */
export async function getAdminPassword() {
  const settings = await getAdminSettings();
  if (settings?.adminPassword) return settings.adminPassword;
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

/**
 * Sets a new admin password in Firestore so it takes effect on every
 * device immediately. Only ever call this after the CURRENT password has
 * already been verified (see AdminSettingsPage.jsx) — this function does
 * not itself re-check anything, by design, to match how setDoc-based
 * writes work elsewhere in this app (persist(), persistInv(), etc.).
 */
export async function setAdminPassword(newPassword) {
  // Set BEFORE the write — synchronous, same tick — so this tab's own
  // watcher can never mistake its own change for a foreign one, regardless
  // of how fast the local onSnapshot echo arrives. See selfChangeInFlight above.
  selfChangeInFlight = true;
  const result = await updateAdminPassword(newPassword);
  if (!result.success) {
    selfChangeInFlight = false;
    throw new Error("Could not save the new password — please check your connection and try again.");
  }
  // The Firestore value is now authoritative; drop the stale per-device copy.
  localStorage.removeItem(ADMIN_PASSWORD_KEY);
}

/**
 * Checks `password` against the current admin password.
 *
 * If Firestore already has a password set, that's the only thing checked
 * — this is the normal, steady-state path on every device.
 *
 * If Firestore does NOT have a password set yet (this app predates this
 * fix, or it's a brand-new deploy), falls back to this device's legacy
 * localStorage value (or the hardcoded default) for THIS check only. If
 * that fallback matches, the password is migrated up to Firestore right
 * away so every device is in sync from this point on. This only ever
 * triggers once, and only as a result of someone successfully proving
 * they know the correct (existing) password — it never overwrites a
 * password Firestore already has.
 */
export async function verifyAdminPassword(password) {
  const settings = await getAdminSettings();

  if (settings?.adminPassword) {
    const ok = String(password || "") === settings.adminPassword;
    if (ok) recordPasswordVersion(settings); // this login now knows the current version
    return ok;
  }

  const legacyOrDefault = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  const matched = String(password || "") === legacyOrDefault;

  if (matched) {
    try {
      await updateAdminPassword(legacyOrDefault);
      localStorage.removeItem(ADMIN_PASSWORD_KEY);
      const fresh = await getAdminSettings();
      recordPasswordVersion(fresh); // this device originated the migration — not a foreign change
    } catch (err) {
      // Migration failing shouldn't block this login — it'll just be
      // retried on the next successful login attempt.
      console.error("[adminAuth] Failed to migrate password to Firestore:", err);
    }
  }

  return matched;
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
// Intentionally per-device — see file header note.

export function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function setAdminLoggedIn(loggedIn) {
  if (loggedIn) sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  else          sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function logoutAdmin() {
  setAdminLoggedIn(false);
  clearStoredPasswordVersion();
}
