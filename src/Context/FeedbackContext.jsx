import React, { createContext, useState, useEffect } from "react";
import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

export const FeedbackContext = createContext();

// Firestore collection reference
const feedbackCol = collection(db, "feedback");

export function FeedbackProvider({ children }) {
  const [feedbackList, setFeedbackList] = useState([]);

  // ── Real-time listener: keeps admin view in sync across devices ──────────
  useEffect(() => {
    const q = query(feedbackCol, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setFeedbackList(
        snap.docs.map((d) => ({
          id: d.id,           // Firestore doc ID (used for deletion)
          ...d.data(),
          // Convert Firestore Timestamp → ISO string for consistent display
          date: d.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        }))
      );
    });
    return unsub; // unsubscribe on unmount
  }, []);

  // ── Submit feedback → Firestore ──────────────────────────────────────────
  const submitFeedback = async ({ name, message }) => {
    const trimmedName    = (name    ?? "").trim();
    const trimmedMessage = (message ?? "").trim();

    // Guard: prevent empty submissions reaching Firestore
    if (!trimmedMessage) return;

    const entry = {
      message:   trimmedMessage,
      createdAt: serverTimestamp(),
    };

    // Only include customerName if a non-empty name was provided
    if (trimmedName) entry.customerName = trimmedName;

    await addDoc(feedbackCol, entry);
    // onSnapshot above updates feedbackList automatically — no setState needed
  };

  // ── Delete feedback entry (admin only) ───────────────────────────────────
  const deleteFeedback = async (id) => {
    await deleteDoc(doc(db, "feedback", id));
    // onSnapshot handles the local state update
  };

  return (
    <FeedbackContext.Provider value={{ feedbackList, submitFeedback, deleteFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}
