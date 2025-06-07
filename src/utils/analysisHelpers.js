export function getClassificationColor(classification) {
  const cl = (classification || "").toLowerCase();
  if (cl === "hate" || cl === "toxic" || cl === "offensive") {
    return { bg: "bg-red-500", text: "text-red-100", badge: "bg-red-600", textColor: "text-red-400" };
  } else if (cl === "neutral") {
    return { bg: "bg-green-500", text: "text-green-100", badge: "bg-green-600", textColor: "text-green-400" };
  } else if (cl === "ambiguous") {
    return { bg: "bg-yellow-500", text: "text-yellow-100", badge: "bg-yellow-600", textColor: "text-yellow-400" };
  }
  return { bg: "bg-blue-500", text: "text-blue-100", badge: "bg-blue-600", textColor: "text-blue-400" };
}

// Risk logic: High for Hate/Toxic/Offensive, Medium for Ambiguous, Low for Neutral/other
export function getRiskLevel(classification) {
  if (!classification) return "Low";
  const cl = (classification.classification || classification).toLowerCase();
  if (cl === "hate" || cl === "toxic" || cl === "offensive") return "High";
  if (cl === "ambiguous") return "Medium";
  return "Low";
}

// Returns Tailwind color class for risk text
export function getRiskTextColor(risk) {
  switch (risk) {
    case "High":
      return "text-red-400";
    case "Medium":
      return "text-yellow-400";
    case "Low":
      return "text-green-400";
    default:
      return "text-blue-400";
  }
}

export function getActionColor(actionType) {
  const act = (actionType || "").toLowerCase();
  if (act.includes("block") || act.includes("remove") || act.includes("ban")) {
    return "bg-red-600";
  } else if (act.includes("warn") || act.includes("flag")) {
    return "bg-yellow-600";
  } else if (act.includes("allow") || act.includes("approve")) {
    return "bg-green-600";
  }
  return "bg-blue-600";
}