import React from "react";

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-72 min-h-screen bg-[#202123] border-r border-gray-800 flex flex-col px-6 py-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-12">
        <i className="fas fa-shield-alt text-3xl text-indigo-500 drop-shadow" />
        <span className="text-2xl font-extrabold tracking-tight">HateSpeech Analyzer</span>
      </div>
      <nav className="flex flex-col gap-2">
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "text"
              ? "bg-indigo-800 text-white shadow-lg ring-2 ring-indigo-400"
              : "hover:bg-indigo-900 hover:text-indigo-300 text-gray-300"
          }`}
          onClick={() => setActiveTab("text")}
        >
          <i className="fas fa-comment-alt" /> Text Analysis
        </button>
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "audio"
              ? "bg-red-800 text-white shadow-lg ring-2 ring-red-400"
              : "hover:bg-red-900 hover:text-red-300 text-gray-300"
          }`}
          onClick={() => setActiveTab("audio")}
        >
          <i className="fas fa-microphone" /> Audio Analysis
        </button>
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "image"
              ? "bg-emerald-800 text-white shadow-lg ring-2 ring-emerald-400"
              : "hover:bg-emerald-900 hover:text-emerald-300 text-gray-300"
          }`}
          onClick={() => setActiveTab("image")}
        >
          <i className="fas fa-image" /> Image Analysis
        </button>
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "reddit"
              ? "bg-orange-700 text-white shadow-lg ring-2 ring-orange-400"
              : "hover:bg-orange-900 hover:text-orange-300 text-gray-300"
          }`}
          onClick={() => setActiveTab("reddit")}
        >
          <i className="fab fa-reddit" /> Reddit Analysis
        </button>
        <button
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "history"
              ? "bg-pink-800 text-white shadow-lg ring-2 ring-pink-400"
              : "hover:bg-pink-900 hover:text-pink-300 text-gray-300"
          }`}
          onClick={() => setActiveTab("history")}
        >
          <i className="fas fa-history" /> History
        </button>
      </nav>
      <div className="mt-auto pt-10 text-xs text-gray-500 text-center">
        <span className="block opacity-60">AI-powered moderation</span>
        <span className="block opacity-40 mt-1">© {new Date().getFullYear()} HateSpeech Analyzer</span>
      </div>
    </aside>
  );
}