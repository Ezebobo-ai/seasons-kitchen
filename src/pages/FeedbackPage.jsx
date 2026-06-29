import React, { useState, useContext } from "react";
import { FeedbackContext } from "../Context/FeedbackContext.jsx";

export default function FeedbackPage() {
  const { submitFeedback } = useContext(FeedbackContext);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !message.trim()) {
      setError("Please fill in your name and message.");
      return;
    }
    submitFeedback({ name, message });
    setName("");
    setMessage("");
    setError("");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 pt-24 px-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg border border-green-100 p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Thank you!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your feedback has been received. We appreciate you taking the time to share your experience.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 pt-24 px-6 pb-16">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Share Your Experience</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Your feedback helps us serve you better at Seasons Kitchen.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

          {/* Name */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Your Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Amara Okafor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>

          {/* Message */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Your Message <span className="text-red-400">*</span>
            </label>
            <textarea
              placeholder="Tell us about your experience — what you loved, what we can improve…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-xs mb-4 font-medium">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm transition shadow-sm"
          >
            Submit Feedback
          </button>
        </div>

      </div>
    </div>
  );
}
