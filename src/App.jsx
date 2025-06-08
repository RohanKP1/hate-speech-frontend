import React, { useState, useEffect } from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';
import ResultBox from "./components/ResultBox";
import RedditResultBox from "./components/RedditResultBox";
import Sidebar from "./components/Sidebar";
import { formatJsonString } from "./utils/formatJsonString";
import Toast from "./components/Toast";

const API_BASE_URL = "http://localhost:8000";

export default function HateSpeechAnalyzerApp() {
  // --- State ---
  const [textInput, setTextInput] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [imageFile, setImageFile] = useState(null); // NEW
  const [textResult, setTextResult] = useState(null);
  const [audioResult, setAudioResult] = useState(null);
  const [imageResult, setImageResult] = useState(null); // NEW
  const [loading, setLoading] = useState({ text: false, audio: false, image: false }); // add image
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem("hs_history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState("text");
  const [popupResult, setPopupResult] = useState(null);
  const [redditInput, setRedditInput] = useState("");
  const [redditResult, setRedditResult] = useState(null);
  const [redditNumComments, setRedditNumComments] = useState(1);
  const [toast, setToast] = useState("");
  const [audioDragActive, setAudioDragActive] = useState(false);
  const [imageDragActive, setImageDragActive] = useState(false);

  // --- Effects ---
  useEffect(() => {
    try {
      localStorage.setItem("hs_history", JSON.stringify(history));
    } catch {}
  }, [history]);

  // --- Handlers ---
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

  // NEW: Image analysis handler
  const handleImageAnalyze = async () => {
    if (!imageFile) {
      setImageResult({ error: "Please select an image file to analyze." });
      return;
    }
    setLoading((prev) => ({ ...prev, image: true }));
    setImageResult(null);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      // Use the correct backend endpoint
      const res = await fetch(`${API_BASE_URL}/image/analyze-image`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setImageResult({ success: data });
        addToHistory("Image Analysis", imageFile.name, data, "image");
      } else {
        setImageResult({ error: data.error || "Unknown error" });
      }
    } catch (err) {
      setImageResult({ error: err.message });
    } finally {
      setLoading((prev) => ({ ...prev, image: false }));
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

  // --- UI Constants ---
  const inputBase =
    "w-full p-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-700 transition";
  const buttonBase =
    "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2";

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#18181a] text-white">
      {/* Fixed Sidebar */}
      <div className="fixed top-0 left-0 h-full z-40">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      {/* Main Content */}
      <main className="ml-72 flex flex-col items-center justify-start px-2 sm:px-6 md:px-12 py-10 min-h-screen">
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
                className={buttonBase + " bg-indigo-700 hover:bg-indigo-800 text-white w-full sm:w-auto cursor-pointer"}
                onClick={() => handleTextAnalyze(false)}
                disabled={loading.text}
              >
                <i className="fas fa-search" /> Analyze
              </button>
              <button
                className={buttonBase + " bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto cursor-pointer"}
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
            {/* Audio upload section */}
            <div className="mb-6">
              <label className="block w-full cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setAudioFile(e.target.files[0])}
                />
                <div
                  className={`w-full p-6 rounded-xl border-2 border-dashed transition-all duration-200 ${
                    audioFile
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-red-400 bg-red-900/10 hover:bg-red-900/20 hover:border-red-300'
                  }`}
                  onDragOver={e => {
                    e.preventDefault();
                    setAudioDragActive(true);
                  }}
                  onDragLeave={e => {
                    e.preventDefault();
                    setAudioDragActive(false);
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    setAudioDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setAudioFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      audioFile 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      <i className={`fas ${audioFile ? 'fa-check' : 'fa-microphone-alt'} text-2xl`} />
                    </div>
                    <div className={`font-semibold text-lg mb-2 ${
                      audioFile ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {audioFile ? 'Audio File Selected' : 'Upload Audio File'}
                    </div>
                    <div className="text-gray-300 text-sm mb-2">
                      {audioFile ? audioFile.name : 'Click to browse or drag and drop'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Supported formats: MP3, WAV, M4A, OGG
                    </div>
                  </div>
                </div>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full">
              <button
                className={buttonBase + " bg-red-700 hover:bg-red-800 text-white w-full sm:w-auto cursor-pointer"}
                onClick={() => handleAudioAnalyze(false)}
                disabled={loading.audio}
              >
                <i className="fas fa-search" /> Analyze
              </button>
              <button
                className={buttonBase + " bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto cursor-pointer"}
                disabled={loading.audio}
                onClick={() => handleAudioAnalyze(true)}
              >
                <i className="fas fa-check-circle" /> Validate
              </button>
            </div>
            {/* Show extracted text in both analysis and validation cases */}
            {audioResult?.success?.transcription && (
              <div className="mb-6 mt-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                      <i className="fas fa-file-audio text-red-300 text-lg" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Extracted Text from Audio</h3>
                  </div>
                  <div className="text-gray-200 text-base whitespace-pre-line break-words">
                    {audioResult.success.transcription}
                  </div>
                </div>
              </div>
            )}
            {loading.audio && (
              <div className="flex items-center gap-3 mt-4 px-4 py-3 bg-black/60 border border-red-700 rounded-xl shadow animate-pulse">
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

        {activeTab === "image" && (
          <section className="w-full max-w-4xl mt-6">
            {/* Changed to dark green */}
            <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-emerald-400">
              <i className="fas fa-image" /> Image Analysis
            </h2>
            <div className="mb-6">
              <label className="block w-full cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
                <div
                  className={`w-full p-6 rounded-xl border-2 border-dashed transition-all duration-200 ${
                    imageFile
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-emerald-700 bg-emerald-900/10 hover:bg-emerald-900/20 hover:border-emerald-600'
                  }`}
                  onDragOver={e => {
                    e.preventDefault();
                    setImageDragActive(true);
                  }}
                  onDragLeave={e => {
                    e.preventDefault();
                    setImageDragActive(false);
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    setImageDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setImageFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      imageFile
                        ? 'bg-green-600 text-white'
                        : 'bg-emerald-700 text-white'
                    }`}>
                      <i className={`fas ${imageFile ? 'fa-check' : 'fa-image'} text-2xl`} />
                    </div>
                    <div className={`font-semibold text-lg mb-2 ${
                      imageFile ? 'text-green-400' : 'text-emerald-400'
                    }`}>
                      {imageFile ? 'Image File Selected' : 'Upload Image File'}
                    </div>
                    <div className="text-gray-300 text-sm mb-2">
                      {imageFile ? imageFile.name : 'Click to browse or drag and drop'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Supported formats: PNG, JPG, JPEG, GIF
                    </div>
                  </div>
                </div>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full">
              <button
                className={buttonBase + " bg-emerald-700 hover:bg-emerald-800 text-white w-full sm:w-auto cursor-pointer"}
                onClick={handleImageAnalyze}
                disabled={loading.image}
              >
                <i className="fas fa-search" /> Analyze
              </button>
            </div>
            {loading.image && (
              <div className="flex items-center gap-3 mt-4 px-4 py-3 bg-black/60 border border-emerald-700 rounded-xl shadow animate-pulse">
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-700 flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin text-white text-base" />
                  </span>
                </span>
                <span className="text-emerald-200 font-semibold text-base">
                  Analyzing image, please wait...
                </span>
              </div>
            )}
            {/* Show extracted text if present */}
            {imageResult?.success?.transcription && (
              <div className="mb-6 mt-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                      <i className="fas fa-file-image text-emerald-300 text-lg" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Extracted Text from Image</h3>
                  </div>
                  <div className="text-gray-200 text-base whitespace-pre-line break-words">
                    {imageResult.success.transcription}
                  </div>
                </div>
              </div>
            )}
            <ResultBox data={imageResult} />
          </section>
        )}

        {activeTab === "reddit" && (
          <section className="w-full max-w-4xl mt-6">
            <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-orange-400">
              <i className="fab fa-reddit" /> Reddit Analysis
            </h2>
            <textarea
              className={
                inputBase +
                " resize-none mb-4 w-full min-h-[60px] border-orange-700 focus:ring-orange-400"
              }
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
                className={buttonBase + " bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto cursor-pointer"}
                onClick={handleRedditAnalyze}
                disabled={loading.reddit}
                type="button"
              >
                <i className="fas fa-search" /> Analyze
              </button>
            </div>
            {loading.reddit && (
              <div className="flex items-center gap-3 mt-4 px-4 py-3 bg-black/60 border border-orange-700 rounded-xl shadow animate-pulse">
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-orange-600 flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin text-white text-base" />
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
                  className="flex items-center gap-2 bg-pink-700 hover:bg-pink-800 text-white px-5 py-2 rounded-xl font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
                  onClick={downloadCSV}
                  disabled={!history.length}
                >
                  <i className="fas fa-download" /> Download CSV
                </button>
                <button
                  className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-5 py-2 rounded-xl font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
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
                              : h.category === "image"
                              ? "bg-emerald-900/80 text-emerald-300"
                              : "bg-pink-900/80 text-pink-300"
                          }`}>
                            {h.type}
                          </span>
                        </td>
                        <td className="py-2 px-4 truncate max-w-xs" title={h.fullInput}>{h.input}</td>
                        <td className="py-2 px-4 truncate max-w-xs">
                          <button
                            className="px-3 py-1 rounded bg-pink-700 hover:bg-pink-800 text-white font-semibold text-xs shadow transition cursor-pointer"
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
                <div className="bg-[#202123] border border-gray-700 rounded-2xl p-4 sm:p-8 w-[95vw] max-w-2xl relative mx-2">
                  <button
                    className="absolute top-2 right-3 text-gray-400 hover:text-white text-2xl cursor-pointer"
                    onClick={() => setPopupResult(null)}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-pink-400 flex items-center gap-2">
                      <i className="fas fa-info-circle" /> Analysis Result
                    </h3>
                    <button
                      className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(popupResult, null, 2));
                        setToast("JSON copied to clipboard!");
                      }}
                    >
                      <i className="fas fa-copy" /> Copy JSON
                    </button>
                  </div>
                  <div className="overflow-auto max-h-[70vh] rounded-lg">
                    <div
                      className="font-mono text-sm leading-relaxed p-4 bg-black/20 rounded-lg overflow-x-auto whitespace-pre"
                      dangerouslySetInnerHTML={{
                        __html: formatJsonString(popupResult)
                      }}
                    />
                  </div>
                </div>
                <Toast message={toast} onClose={() => setToast("")} />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}