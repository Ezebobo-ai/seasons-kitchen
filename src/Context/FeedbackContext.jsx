import React, { createContext, useState } from "react";

export const FeedbackContext = createContext();

export function FeedbackProvider({ children }) {
  const [feedbackList, setFeedbackList] = useState(() => {
    try {
      const stored = localStorage.getItem("feedbackList");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [];
  });

  const submitFeedback = ({ name, message }) => {
    const entry = {
      id: Date.now(),
      name: name.trim(),
      message: message.trim(),
      date: new Date().toISOString(),
    };
    const updated = [entry, ...feedbackList];
    setFeedbackList(updated);
    localStorage.setItem("feedbackList", JSON.stringify(updated));
  };

  const deleteFeedback = (id) => {
    const updated = feedbackList.filter((f) => f.id !== id);
    setFeedbackList(updated);
    localStorage.setItem("feedbackList", JSON.stringify(updated));
  };

  return (
    <FeedbackContext.Provider value={{ feedbackList, submitFeedback, deleteFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}
