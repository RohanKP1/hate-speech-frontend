export function formatJsonString(json) {
  if (!json) return "";
  const jsonStr = typeof json === "string" ? json : JSON.stringify(json, null, 2);
  // Regex for keys, strings, numbers, booleans, null
  return jsonStr.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "text-pink-400" : "text-emerald-400";
      } else if (/true|false/.test(match)) {
        cls = "text-amber-400";
      } else if (/null/.test(match)) {
        cls = "text-red-400";
      } else {
        cls = "text-blue-400";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}