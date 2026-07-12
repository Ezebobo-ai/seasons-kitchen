// src/utils/seedGuard.js
//
// Guards Firestore "factory default" seed writes so they can only ever be
// triggered by an authenticated admin session — never by a customer-facing
// page load.
//
// This is the remediation for CRITICAL-2 in the production data-loss audit:
// MenuContext / InventoryContext / MediaContext each contain a branch inside
// their onSnapshot handler that calls setDoc() with hardcoded defaults
// whenever an expected field is missing. Because those providers wrap the
// entire app (not just /admin), that branch used to run — and was able to
// write to Firestore — in every visitor's browser, with no check on who
// was asking.
//
// This file does NOT change any menu/category/inventory/media CRUD logic.
// It only gates the one-time "seed factory defaults" writes.

import { setDoc } from "firebase/firestore";
import { isAdminLoggedIn } from "./adminAuth.js";

/**
 * Writes `payload` to `ref` via setDoc(..., { merge: true }) ONLY if the
 * current browser has an authenticated admin session (per adminAuth.js /
 * isAdminLoggedIn()). In every other case — a customer browsing, a bot,
 * a stray tab, a brand-new visitor — this is a no-op: it logs a warning
 * and returns without touching Firestore.
 *
 * Existing Firestore data is never affected by this function refusing to
 * write: it only ever runs in the branch where the field was ALREADY
 * missing, so skipping the write can't overwrite or lose anything that's
 * already there. It just stops that gap from being auto-"fixed" by an
 * unauthenticated browser.
 */
export function seedIfAdmin(ref, payload, label) {
  if (!isAdminLoggedIn()) {
    console.warn(
      `[seedGuard] Skipped auto-seed${label ? ` (${label})` : ""} — ` +
        "no authenticated admin session in this browser. Firestore was not modified."
    );
    return Promise.resolve();
  }
  return setDoc(ref, payload, { merge: true });
}
