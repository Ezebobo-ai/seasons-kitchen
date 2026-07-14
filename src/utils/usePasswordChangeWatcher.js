// src/utils/usePasswordChangeWatcher.js
//
// While an admin is logged in on this device, listens live to
// settings/admin for the passwordChangedAt field. If it ever changes to a
// value this session didn't set itself (see recordPasswordVersion in
// adminAuth.js), the password was changed on a DIFFERENT device — so this
// session is force-logged-out immediately, rather than staying "logged in"
// under a password that's no longer valid.
//
// The device that makes the change records its own new version right after
// writing (in adminAuth.js's setAdminPassword), so it never logs itself out.

import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import {
  getStoredPasswordVersion,
  setStoredPasswordVersion,
  consumeSelfChangeFlag,
  logoutAdmin,
} from "./adminAuth.js";

/**
 * @param {boolean} active - only subscribe while the admin is actually logged in.
 * @param {() => void} onForceLogout - called when this session gets logged out
 *   because the password changed elsewhere. Use it to update UI state and
 *   show a message like "logged out — password changed on another device."
 */
export function usePasswordChangeWatcher(active, onForceLogout) {
  useEffect(() => {
    if (!active) return undefined;

    const ref = doc(db, "settings", "admin");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const serverVersion = data.passwordChangedAt?.toMillis
          ? String(data.passwordChangedAt.toMillis())
          : null;
        if (serverVersion === null) return; // no password change has ever been recorded

        const localVersion = getStoredPasswordVersion();

        if (localVersion === null) {
          // First time this session has observed a version (e.g. this fix
          // just shipped and the session predates it) — adopt it as the
          // baseline instead of logging out over a change we can't attribute.
          setStoredPasswordVersion(serverVersion);
          return;
        }

        if (localVersion !== serverVersion) {
          if (consumeSelfChangeFlag()) {
            // This tab caused the change itself (setAdminPassword) — adopt
            // the new baseline, no logout.
            setStoredPasswordVersion(serverVersion);
            return;
          }
          logoutAdmin();
          onForceLogout?.();
        }
      },
      (err) => {
        console.error("[usePasswordChangeWatcher] listener error:", err);
      }
    );

    return () => unsub();
  }, [active, onForceLogout]);
}
