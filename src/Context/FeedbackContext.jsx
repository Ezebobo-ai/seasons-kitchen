// src/Context/FeedbackContext.jsx
//
// ── FIX: previously this stored feedback in localStorage, which is
// per-browser/per-device. A customer's feedback was only ever saved to the
// CUSTOMER'S OWN browser storage — the admin dashboard (a different device,
// almost always) could never see it, because it reads from its own,
// completely separate localStorage bucket.
//
// Feedback now lives in its own Firestore collection ("feedback"), one
// document per entry, kept in sync everywhere via onSnapshot. A dedicated
// collection (rather than an array field on the shared settings/admin doc)
// is used because feedback can grow without bound and shouldn't compete for
// space with the menu/media data in that document's 1MB limit.

import React, { createContext, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase.js";

export const FeedbackContext = createContext();

const FEEDBACK_COLLECTION = "feedback";

export function FeedbackProvider({ children }) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const q = query(collection(db, FEEDBACK_COLLECTION), orderBy("date", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setFeedbackList(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              message: data.message,
              // Firestore serverTimestamp() resolves asynchronously; fall back
              // to "now" for the brief window before it's confirmed so the UI
              // never shows an invalid date.
              date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString(),
            };
          })
        );
        setLoaded(true);
      },
      (err) => {
        console.error("[FeedbackContext] onSnapshot error:", err);
        setLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  const submitFeedback = async ({ name, message }) => {
    try {
      await addDoc(collection(db, FEEDBACK_COLLECTION), {
        name: String(name || "").trim(),
        message: String(message || "").trim(),
        date: serverTimestamp(),
      });
      // onSnapshot updates state — no local setFeedbackList() needed.
    } catch (err) {
      console.error("[FeedbackContext] submitFeedback failed:", err);
      throw err;
    }
  };

  const deleteFeedback = async (id) => {
    try {
      await deleteDoc(doc(db, FEEDBACK_COLLECTION, id));
    } catch (err) {
      console.error("[FeedbackContext] deleteFeedback failed:", err);
      throw err;
    }
  };

  return (
    <FeedbackContext.Provider value={{ feedbackList, submitFeedback, deleteFeedback, loaded }}>
      {children}
    </FeedbackContext.Provider>
  );
}
