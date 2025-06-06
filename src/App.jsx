import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:8000";

export default function HateSpeechAnalyzerApp() {
  const [textInput, setTextInput] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [textResult, setTextResult] = useState(null);
  const [audioResult, setAudioResult] = useState(null);
  const [loading, setLoading] = useState({ text: false, audio: false });
  const [history, setHistory] = useState(() => {
    // Using in-memory storage instead of localStorage for Claude.ai compatibility
    return [];
  });
  const [activeTab, setActiveTab] = useState("text");

  // Popup state for showing result details
  const [popupResult, setPopupResult] = useState(null);
  const [redditInput, setRedditInput] = useState("");
  const [redditResult, setRedditResult] = useState(null);
  const [redditNumComments, setRedditNumComments] = useState(1);

  const handleTextAnalyze = async (validate = false) => {
    if (!textInput.trim()) {
      setTextResult({ error: "Please enter some text to analyze." });
      return;
    }
    setLoading((prev) => ({ ...prev, text: true }));
    setTextResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/text/${validate ? "validate" : "analyze"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput })
      });
      const data = await res.json();
      if (res.ok) {
        setTextResult({ success: data });
        addToHistory(validate ? "Text Validation" : "Text Analysis", textInput, data, "text");
      } else {
        setTextResult({ error: data.error || "Unknown error" });
      }
    } catch (err) {
      setTextResult({ error: err.message });
    } finally {
      setLoading((prev) => ({ ...prev, text: false }));
    }
  };

  const handleAudioAnalyze = async (validate = false) => {
    if (!audioFile) {
      setAudioResult({ error: "Please select an audio file to analyze." });
      return;
    }
    setLoading((prev) => ({ ...prev, audio: true }));
    setAudioResult(null);

    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      const res = await fetch(`${API_BASE_URL}/audio/${validate ? "validate-audio" : "analyze-audio"}`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setAudioResult({ success: data });
        addToHistory(validate ? "Audio Validation" : "Audio Analysis", audioFile.name, data, "audio");
      } else {
        setAudioResult({ error: data.error || "Unknown error" });
      }
    } catch (err) {
      setAudioResult({ error: err.message });
    } finally {
      setLoading((prev) => ({ ...prev, audio: false }));
    }
  };

  // Reddit analysis handler (fixed to match backend schema)
  const handleRedditAnalyze = async () => {
    if (!redditInput.trim()) {
      setRedditResult({ error: "Please enter a Reddit thread URL to analyze." });
      return;
    }
    setLoading((prev) => ({ ...prev, reddit: true }));
    setRedditResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/reddit/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reddit_url: redditInput,
          num_comments: redditNumComments || 1
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRedditResult({ success: data });
        addToHistory("Reddit Analysis", redditInput, data, "reddit");
      } else {
        setRedditResult({ error: data.error || "Unknown error" });
      }
    } catch (err) {
      setRedditResult({ error: err.message });
    } finally {
      setLoading((prev) => ({ ...prev, reddit: false }));
    }
  };

  const addToHistory = (type, input, result, category) => {
    const item = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type,
      input: input.length > 100 ? input.slice(0, 100) + "..." : input,
      fullInput: input,
      result,
      category
    };
    const updated = [item, ...history.slice(0, 49)];
    setHistory(updated);
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear history?")) {
      setHistory([]);
    }
  };

  // CSV download handler
  const downloadCSV = () => {
    if (!history.length) return;
    const headers = ["Timestamp", "Type", "Input", "Result"];
    const rows = history.map((h) => [
      new Date(h.timestamp).toLocaleString(),
      h.type,
      `"${h.input.replace(/"/g, '""')}"`,
      `"${JSON.stringify(h.result).replace(/"/g, '""')}"`
    ]);
    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis_history.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Dashboard-style ResultBox with validation as an addon
  const ResultBox = ({ data }) => {
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
    if (!result) return null;

    // If validation exists, show it in a user-friendly dashboard style
    if (result.validation && typeof result.validation === "object") {
      const validation = result.validation;
      const agent = validation.agent_classification || {};
      const validator = validation.validation_classification || {};

      // Color helpers
      const getClassificationColor = (classification) => {
        const cl = (classification || "").toLowerCase();
        if (cl.includes("hate") || cl.includes("toxic")) {
          return "bg-red-600 text-white";
        } else if (cl.includes("neutral") || cl.includes("safe")) {
          return "bg-green-600 text-white";
        } else if (cl.includes("warning") || cl.includes("moderate")) {
          return "bg-yellow-500 text-white";
        }
        return "bg-blue-600 text-white";
      };

      return (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Agent */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-robot text-white text-sm" />
                </div>
                <h3 className="text-lg font-bold text-white">Primary Agent</h3>
              </div>
              <div className="space-y-2">
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getClassificationColor(agent.classification)}`}>
                  {agent.classification || "Unknown"} ({agent.confidence || "N/A"})
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  <span className="font-medium">Reasoning:</span>
                  <span className="ml-1">{agent.reason || "No reasoning provided"}</span>
                </div>
              </div>
            </div>
            {/* Validation Agent */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shield-check text-white text-sm" />
                </div>
                <h3 className="text-lg font-bold text-white">Validation Agent</h3>
              </div>
              <div className="space-y-2">
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getClassificationColor(validator.classification)}`}>
                  {validator.classification || "Unknown"} ({validator.confidence || "N/A"})
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  <span className="font-medium">Reasoning:</span>
                  <span className="ml-1">{validator.reason || "No reasoning provided"}</span>
                </div>
              </div>
            </div>
            {/* Status */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-yellow-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-flag text-white text-sm" />
                </div>
                <h3 className="text-lg font-bold text-white">Validation Status</h3>
              </div>
              <div className={`px-6 py-3 rounded-xl text-center text-lg font-bold ${
                validation.status === "failure"
                  ? "bg-red-700 text-white"
                  : "bg-green-700 text-white"
              }`}>
                {validation.status ? validation.status.toUpperCase() : "N/A"}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- Extract main analysis fields ---
    let hateSpeech = result.hate_speech || result.hateSpeech || result.hate || {};
    let policies = result.policies || [];
    let reasoning = result.reasoning || result.reason || "";
    let action = result.action || result.actions || {};

    // --- If validation exists, extract validation fields as addon ---
    let validationAddon = null;
    if (result.validation && typeof result.validation === "object") {
      const validationData = result.validation;
      const agent = validationData.agent_classification || {};
      const validator = validationData.validation_classification || {};

      validationAddon = (
        <div className="space-y-4 mt-6">
          <div className="bg-gray-900/50 border border-gray-600 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <i className="fas fa-robot text-gray-400 mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-300 mb-1">Validation: Primary Agent</div>
                <div className="text-sm text-gray-400">
                  <span className="font-medium">Classification:</span> {agent.classification || "N/A"}
                </div>
                <div className="text-sm text-gray-400">
                  <span className="font-medium">Confidence:</span> {agent.confidence || "N/A"}
                </div>
                <div className="text-sm text-gray-400">
                  <span className="font-medium">Reasoning:</span> {agent.reason || "No reasoning provided"}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 border border-gray-600 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <i className="fas fa-shield-check text-gray-400 mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-300 mb-1">Validation: Validation Agent</div>
                <div className="text-sm text-gray-400">
                  <span className="font-medium">Classification:</span> {validator.classification || "N/A"}
                </div>
                <div className="text-sm text-gray-400">
                  <span className="font-medium">Confidence:</span> {validator.confidence || "N/A"}
                </div>
                <div className="text-sm text-gray-400">
                  <span className="font-medium">Reasoning:</span> {validator.reason || "No reasoning provided"}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Classification color mapping
    const getClassificationColor = (classification) => {
      const cl = (classification || "").toLowerCase();
      if (cl.includes("hate") || cl.includes("toxic") || cl.includes("harmful")) {
        return { bg: "bg-red-500", text: "text-red-100", badge: "bg-red-600" };
      } else if (cl.includes("neutral") || cl.includes("safe")) {
        return { bg: "bg-green-500", text: "text-green-100", badge: "bg-green-600" };
      } else if (cl.includes("warning") || cl.includes("moderate")) {
        return { bg: "bg-yellow-500", text: "text-yellow-100", badge: "bg-yellow-600" };
      }
      return { bg: "bg-blue-500", text: "text-blue-100", badge: "bg-blue-600" };
    };

    const classificationColors = getClassificationColor(hateSpeech.classification);

    // Risk level mapping
    const getRiskLevel = (confidence) => {
      const conf = confidence || "";
      if (conf.toLowerCase() === "high") return "High";
      if (conf.toLowerCase() === "medium") return "Medium";
      if (conf.toLowerCase() === "low") return "Low";
      const confNum = parseFloat(confidence) || 0;
      if (confNum >= 0.8) return "High";
      if (confNum >= 0.5) return "Medium";
      return "Low";
    };

    const getActionColor = (actionType) => {
      const act = (actionType || "").toLowerCase();
      if (act.includes("block") || act.includes("remove") || act.includes("ban")) {
        return "bg-red-600";
      } else if (act.includes("warn") || act.includes("flag")) {
        return "bg-yellow-600";
      } else if (act.includes("allow") || act.includes("approve")) {
        return "bg-green-600";
      }
      return "bg-blue-600";
    };

    return (
      <div className="mt-8 space-y-6">
        {/* Top Row - Classification, Action, Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classification */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-bullseye text-white text-sm" />
              </div>
              <h3 className="text-lg font-bold text-white">Classification</h3>
            </div>
            <div className="space-y-4">
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${classificationColors.badge} ${classificationColors.text}`}>
                {hateSpeech.classification || "Unknown"} ({hateSpeech.confidence || "N/A"})
              </div>
              <div className="bg-gray-900/50 border border-gray-600 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <i className="fas fa-robot text-gray-400 mt-1" />
                  <div>
                    <div className="text-sm font-semibold text-gray-300 mb-1">Primary Agent</div>
                    <div className="text-sm text-gray-400">
                      <span className="font-medium">Reasoning:</span> {hateSpeech.reason || "No reasoning provided"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Validation Addon */}
            {validationAddon}
          </div>
          {/* Recommended Action */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-bolt text-white text-sm" />
              </div>
              <h3 className="text-lg font-bold text-white">Recommended Action</h3>
            </div>
            <div className="space-y-4">
              <div className={`px-8 py-4 rounded-xl text-center text-white font-bold text-lg ${getActionColor(action.action)}`}>
                {(action.action || "ALLOW").toUpperCase()}
              </div>
              <div className="text-sm text-gray-400">
                <span className="font-medium">Severity:</span> {action.severity || "None"}
              </div>
              <details className="bg-gray-900/50 border border-gray-600 rounded-xl p-4">
                <summary className="cursor-pointer text-sm font-semibold text-orange-400 flex items-center gap-2">
                  <i className="fas fa-question-circle" />
                  Why this action?
                </summary>
                <div className="mt-3 text-sm text-gray-300">
                  {action.reasoning || "No reasoning provided"}
                </div>
              </details>
            </div>
          </div>
          {/* Summary */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-bar text-white text-sm" />
              </div>
              <h3 className="text-lg font-bold text-white">Summary</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Risk Level</div>
                <div className="text-2xl font-bold text-white">{getRiskLevel(hateSpeech.confidence)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Confidence</div>
                <div className="text-2xl font-bold text-white">{hateSpeech.confidence || "N/A"}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Row - Policy References and Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Policy References */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-book text-white text-sm" />
              </div>
              <h3 className="text-lg font-bold text-white">Policy References</h3>
            </div>
            <div className="space-y-3">
              {policies.length > 0 ? policies.map((policy, index) => (
                <details key={index} className="bg-gray-900/50 border border-gray-600 rounded-xl">
                  <summary className="cursor-pointer p-4 text-sm font-semibold text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-file-alt text-gray-400" />
                      {policy.source || `Policy ${index + 1}`} (Score: {policy.relevance_score?.toFixed(2) || "0.00"})
                    </div>
                    <i className="fas fa-chevron-down text-gray-400" />
                  </summary>
                  <div className="px-4 pb-4 pt-2 text-sm text-gray-300 border-t border-gray-600">
                    {policy.content || "No content available"}
                    {policy.rank && (
                      <div className="mt-2 text-xs text-gray-500">Rank: {policy.rank}</div>
                    )}
                  </div>
                </details>
              )) : (
                <div className="bg-gray-900/50 border border-gray-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-file-alt text-gray-400" />
                    <span className="text-sm font-semibold text-white">Meta Policy (Score: 0.20)</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    Standard community guidelines for content moderation and user safety.
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Detailed Analysis */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-search text-white text-sm" />
              </div>
              <h3 className="text-lg font-bold text-white">Detailed Analysis</h3>
            </div>
            <div className="text-sm text-gray-300 leading-relaxed">
              {reasoning ? (
                <p>{reasoning}</p>
              ) : (
                <p>No detailed reasoning provided by the model.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modern input style
  const inputBase =
    "w-full p-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-700 transition";

  // Modern button style
  const buttonBase =
    "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-72 min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-900 border-r border-gray-800 flex flex-col px-6 py-8 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 mb-12">
          <i className="fas fa-shield-alt text-3xl text-indigo-500 drop-shadow" />
          <span className="text-2xl font-extrabold tracking-tight">HateSpeech Analyzer</span>
        </div>
        <nav className="flex flex-col gap-2">
          <button
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "text"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-lg ring-2 ring-indigo-400"
                : "hover:bg-gray-800 text-gray-300"
            }`}
            onClick={() => setActiveTab("text")}
          >
            <i className="fas fa-comment-alt" /> Text Analysis
          </button>
          <button
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "audio"
                ? "bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg ring-2 ring-red-400"
                : "hover:bg-gray-800 text-gray-300"
            }`}
            onClick={() => setActiveTab("audio")}
          >
            <i className="fas fa-microphone" /> Audio Analysis
          </button>
          <button
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "reddit"
                ? "bg-gradient-to-r from-orange-500 to-orange-700 text-white shadow-lg ring-2 ring-orange-400"
                : "hover:bg-gray-800 text-gray-300"
            }`}
            onClick={() => setActiveTab("reddit")}
          >
            <i className="fab fa-reddit" /> Reddit Analysis
          </button>
          <button
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "history"
                ? "bg-gradient-to-r from-pink-600 to-pink-800 text-white shadow-lg ring-2 ring-pink-400"
                : "hover:bg-gray-800 text-gray-300"
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start px-2 sm:px-6 md:px-12 py-10">
        {activeTab === "text" && (
          <section className="w-full max-w-4xl mt-6">
            <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-indigo-400">
              <i className="fas fa-comment-alt" /> Text Analysis
            </h2>
            <textarea
              className={inputBase + " resize-none mb-4 w-full min-h-[120px]"}
              rows={8}
              placeholder="Paste or type text to analyze..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full">
              <button
                className={buttonBase + " bg-indigo-700 hover:bg-indigo-800 text-white w-full sm:w-auto"}
                onClick={() => handleTextAnalyze(false)}
                disabled={loading.text}
              >
                <i className="fas fa-search" /> Analyze
              </button>
              <button
                className={buttonBase + " bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto"}
                onClick={() => handleTextAnalyze(true)}
                disabled={loading.text}
              >
                <i className="fas fa-check-circle" /> Validate
              </button>
            </div>
            {loading.text && (
              <div className="flex items-center gap-3 mt-4 px-4 py-3 bg-black/60 border border-indigo-700 rounded-xl shadow animate-pulse">
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-indigo-600 flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin text-white text-base" />
                  </span>
                </span>
                <span className="text-indigo-200 font-semibold text-base">
                  Analyzing text, please wait...
                </span>
              </div>
            )}
            <ResultBox data={textResult} />
          </section>
        )}

        {activeTab === "audio" && (
          <section className="w-full max-w-4xl mt-6">
            <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-red-400">
              <i className="fas fa-microphone" /> Audio Analysis
            </h2>
            <label className="block mb-4 w-full">
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setAudioFile(e.target.files[0])}
              />
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-900 rounded-xl cursor-pointer transition text-white font-semibold shadow">
                <i className="fas fa-upload" /> {audioFile ? audioFile.name : "Upload Audio"}
              </span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full">
              <button
                className={buttonBase + " bg-red-700 hover:bg-red-800 text-white w-full sm:w-auto"}
                onClick={() => handleAudioAnalyze(false)}
                disabled={loading.audio}
              >
                <i className="fas fa-search" /> Analyze
              </button>
              <button
                className={buttonBase + " bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto"}
                disabled={loading.audio}
                onClick={() => handleAudioAnalyze(true)}
              >
                <i className="fas fa-check-circle" /> Validate
              </button>
            </div>
            {loading.audio && (
              <div className="flex items-center gap-3 mt-4 px-4 py-3 bg-black/60 rounded-xl shadow animate-pulse">
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-red-600 flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin text-white text-base" />
                  </span>
                </span>
                <span className="text-red-200 font-semibold text-base">
                  Processing audio, please wait...
                </span>
              </div>
            )}
            <ResultBox data={audioResult} />
          </section>
        )}

        {activeTab === "reddit" && (
          <section className="w-full max-w-4xl mt-6">
            <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-orange-400">
              <i className="fab fa-reddit" /> Reddit Analysis
            </h2>
            <textarea
              className={inputBase + " resize-none mb-4 w-full min-h-[60px]"}
              rows={3}
              placeholder="Paste a Reddit thread URL here..."
              value={redditInput}
              onChange={(e) => setRedditInput(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full items-center">
              <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <label htmlFor="num-comments" className="text-sm text-gray-300 font-semibold">
                  Number of comments:
                </label>
                <input
                  id="num-comments"
                  type="number"
                  min={1}
                  max={25}
                  value={redditNumComments || 1}
                  onChange={e => setRedditNumComments(Number(e.target.value))}
                  className="w-20 p-2 rounded-lg bg-black/40 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full">  
              <button
                className={buttonBase + " bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"}
                onClick={handleRedditAnalyze}
                disabled={loading.reddit}
              >
                <i className="fab fa-reddit" /> Analyze Reddit
              </button>
            </div>
            {loading.reddit && (
              <div className="flex items-center gap-3 mt-4 px-4 py-3 bg-black/60 border border-orange-700 rounded-xl shadow animate-pulse">
                <span className="relative flex h-8 w-8">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-8 w-8 bg-orange-600 flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin text-white text-lg" />
                  </span>
                </span>
                <span className="text-orange-200 font-semibold text-base">
                  Analyzing Reddit content, please wait...
                </span>
              </div>
            )}
            <RedditResultBox data={redditResult} />
          </section>
        )}

        {activeTab === "history" && (
          <section className="w-full max-w-4xl mt-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-pink-400">
                <i className="fas fa-history" /> Analysis History
              </h2>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-2 bg-pink-700 hover:bg-pink-800 text-white px-5 py-2 rounded-xl font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                  onClick={downloadCSV}
                  disabled={!history.length}
                >
                  <i className="fas fa-download" /> Download CSV
                </button>
                <button
                  className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-5 py-2 rounded-xl font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                  onClick={clearHistory}
                >
                  <i className="fas fa-trash" /> Clear History
                </button>
              </div>
            </div>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center opacity-60 py-12">
                <i className="fas fa-inbox text-5xl mb-2" />
                <span className="text-lg">No analysis history yet.</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="min-w-full text-left text-sm bg-black/40 rounded-xl">
                  <thead>
                    <tr>
                      <th className="py-3 px-4 text-indigo-300 border-b-2 border-indigo-700">Timestamp</th>
                      <th className="py-3 px-4 text-red-300 border-b-2 border-red-700">Type</th>
                      <th className="py-3 px-4 text-orange-300 border-b-2 border-orange-700">Input</th>
                      <th className="py-3 px-4 text-pink-300 border-b-2 border-pink-700">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id} className="border-b border-gray-800 hover:bg-black/30 transition">
                        <td className="py-2 px-4 whitespace-nowrap">{new Date(h.timestamp).toLocaleString()}</td>
                        <td className="py-2 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            h.category === "audio"
                              ? "bg-red-900/80 text-red-300"
                              : h.category === "reddit"
                              ? "bg-orange-900/80 text-orange-300"
                              : h.category === "text"
                              ? "bg-indigo-900/80 text-indigo-300"
                              : "bg-pink-900/80 text-pink-300"
                          }`}>
                            {h.type}
                          </span>
                        </td>
                        <td className="py-2 px-4 truncate max-w-xs" title={h.fullInput}>{h.input}</td>
                        <td className="py-2 px-4 truncate max-w-xs">
                          <button
                            className="px-3 py-1 rounded bg-pink-700 hover:bg-pink-800 text-white font-semibold text-xs shadow transition"
                            onClick={() => setPopupResult(h.result)}
                            type="button"
                          >
                            Show Result
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Popup for result details */}
            {popupResult && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-8 w-[95vw] max-w-2xl relative mx-2">
                  <button
                    className="absolute top-2 right-3 text-gray-400 hover:text-white text-2xl"
                    onClick={() => setPopupResult(null)}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <h3 className="text-lg sm:text-xl font-bold mb-4 text-pink-400 flex items-center gap-2">
                    <i className="fas fa-info-circle" /> Analysis Result
                  </h3>
                  <div className="overflow-auto max-h-[70vh]">
                    <pre className="whitespace-pre-wrap break-words text-sm text-gray-200">
                      {JSON.stringify(popupResult, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );

  // RedditResultBox component
  function RedditResultBox({ data }) {
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
            <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 mb-4 text-gray-200 text-sm">
              {item.text}
            </div>
            {/* Analysis Result */}
            <ResultBox data={{ success: item.analysis_result }} />
          </div>
        ))}
      </div>
    );
  }
}