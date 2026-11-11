// Shared call path for the Workshop tools that use the server-side key
// (Breakground, Desert, FOA Generator). One model constant so a retirement
// is a one-line change, and one place that attaches the Studio key the
// operator typed at the gate so /api/generate can verify it.

export const STUDIO_MODEL = "claude-sonnet-5-5";
export const STUDIO_KEY_STORAGE = "foa_studio_key";

function studioKey() {
  try { return sessionStorage.getItem(STUDIO_KEY_STORAGE) || ""; } catch { return ""; }
}

export function studioGenerate({ system, messages, maxTokens, signal }) {
  const headers = { "Content-Type": "application/json" };
  const key = studioKey();
  if (key) headers["x-studio-key"] = key;
  return fetch("/api/generate", {
    method: "POST",
    signal,
    headers,
    body: JSON.stringify({ model: STUDIO_MODEL, max_tokens: maxTokens, system, messages }),
  });
}
