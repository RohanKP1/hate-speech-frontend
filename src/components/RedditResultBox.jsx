import React from "react";
import ResultBox from "./ResultBox";

export default function RedditResultBox({ data }) {
  if (!data) return null;
  if (data.error) {
    return (
      <div className="mt-6 p-6 bg-red-900/20 border border-red-500 rounded-xl">
        <div className="flex items-center gap-3 text-red-400">
          <i className="fas fa-exclamation-circle text-xl" />
          <span className="font-semibold text-lg">Error</span>
        </div>
        <p className="mt-2 text-red-300">{data.error}</p>
      </div>
    );
  }
  const result = data.success;
  if (!result || !result.results || !Array.isArray(result.results)) return null;

  return (
    <div className="mt-8 space-y-8">
      {result.results.map((item, idx) => (
        <div key={item.comment_id || idx} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <i className="fab fa-reddit text-2xl text-orange-400" />
            <span className="font-bold text-lg text-white">Comment by <span className="text-orange-300">{item.author}</span></span>
            <span className="ml-auto text-xs text-gray-400">ID: {item.comment_id}</span>
          </div>
          <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 mb-4 text-gray-200 text-sm overflow-x-auto break-words max-w-full">
            <span className="break-words whitespace-pre-wrap block">{item.text}</span>
          </div>
          {/* Analysis Result */}
          <ResultBox data={{ success: item.analysis_result }} />
        </div>
      ))}
    </div>
  );
}