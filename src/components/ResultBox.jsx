import React from "react";
import { getClassificationColor, getRiskLevel, getActionColor, getRiskTextColor } from "../utils/analysisHelpers";

export default function ResultBox({ data }) {
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

  // Validation dashboard
  if (result.validation && typeof result.validation === "object") {
    const validation = result.validation;
    const agent = validation.agent_classification || {};
    const validator = validation.validation_classification || {};
    const getColor = (classification) => {
      const cl = (classification || "").toLowerCase();
      if (cl.includes("hate") || cl.includes("toxic")) return "bg-red-600 text-white";
      if (cl.includes("neutral") || cl.includes("safe")) return "bg-green-600 text-white";
      if (cl.includes("warning") || cl.includes("moderate")) return "bg-yellow-500 text-white";
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
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getColor(agent.classification)}`}>
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
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-shield text-indigo-300 text-sm" />
              </div>
              <h3 className="text-lg font-bold text-white">Validation Agent</h3>
            </div>
            <div className="space-y-2">
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getColor(validator.classification)}`}>
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

  // Main analysis fields
  let hateSpeech = result.hate_speech || result.hateSpeech || result.hate || {};
  let policies = result.policies || [];
  let reasoning = result.reasoning || result.reason || "";
  let action = result.action || result.actions || {};

  // Validation Addon
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

  const classificationColors = getClassificationColor(hateSpeech.classification);

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
              <div className={`text-2xl font-bold ${getRiskTextColor(getRiskLevel(hateSpeech.classification))}`}>{getRiskLevel(hateSpeech.classification)}</div>
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
}