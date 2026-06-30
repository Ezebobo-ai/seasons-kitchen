// src/utils/settingsService.js
// Centralized Firestore access for the app's global admin settings.
// Collection: "settings"  |  Document: "admin"
//
// Schema:
// {
//   whatsappNumber: "234XXXXXXXXXX",
//   updatedAt: <Firestore Timestamp>
// }

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.js";

const SETTINGS_COLLECTION = "settings";
const ADMIN_DOC_ID = "admin";

// Sensible fallback used only if Firestore is unreachable or the
// document doesn't exist yet (e.g. brand-new project, first deploy).
const FALLBACK_WHATSAPP_NUMBER = "2348180149672";

function settingsDocRef() {
  return doc(db, SETTINGS_COLLECTION, ADMIN_DOC_ID);
}

/**
 * Fetch the current admin settings from Firestore.
 * Returns { whatsappNumber, updatedAt } or null if the document
 * doesn't exist (caller decides how to fall back).
 */
export async function getAdminSettings() {
  try {
    const snap = await getDoc(settingsDocRef());
    if (snap.exists()) {
      return snap.data();
    }
    console.warn("[settingsService] No admin settings document found yet.");
    return null;
  } catch (err) {
    console.error("[settingsService] Failed to fetch admin settings:", err);
    return null;
  }
}

/**
 * Convenience helper — fetch just the WhatsApp number, with a safe
 * fallback if Firestore is unreachable or unset.
 */
export async function getWhatsappNumber() {
  const settings = await getAdminSettings();
  return settings?.whatsappNumber || FALLBACK_WHATSAPP_NUMBER;
}

/**
 * Update (or create) the admin settings document in Firestore.
 * Uses `setDoc` with `merge: true` so partial updates never wipe
 * out other fields stored on the same document.
 */
export async function updateAdminSettings(partialSettings) {
  try {
    await setDoc(
      settingsDocRef(),
      {
        ...partialSettings,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err) {
    console.error("[settingsService] Failed to update admin settings:", err);
    return { success: false, error: err };
  }
}

export async function updateWhatsappNumber(whatsappNumber) {
  return updateAdminSettings({ whatsappNumber });
}

export { FALLBACK_WHATSAPP_NUMBER };
