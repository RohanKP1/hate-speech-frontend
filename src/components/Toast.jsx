import React, { useEffect } from "react";

export default function Toast({ message, onClose, duration = 2000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <i className="fas fa-check-circle text-green-400" />
        <span>{message}</span>
      </div>
    </div>
  );
}