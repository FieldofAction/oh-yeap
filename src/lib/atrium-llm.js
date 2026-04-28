// Shared LLM helper for the Atrium runner. The canonical standalone modules
// (Backstage, FieldConsole, ArtOfModel, FOAGenerator, BreakgroundCard, DesertVisual)
// each maintain their own direct-fetch call paths — this helper does NOT replace
// theirs, it only powers the Atrium's sequence runner. The separability contract
// means modules' standalone behavior is untouched by this file.
//
// BYOK: callers pass apiKey from settings.apiKey (localStorage-backed).
// Browser-direct access enabled via anthropic-dangerous-direct-browser-access.

export class AtriumLLMError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "AtriumLLMError";
    this.status = status;
    this.body = body;
  }
}

export async function callAtriumLLM({
  system,
  user,
  apiKey,
  model,
  anthropicVersion,
  maxTokens = 1500,
  signal,
}) {
  if (!apiKey) {
    throw new AtriumLLMError("No API key set. Open Backstage → Settings to add one.");
  }
  if (!model) {
    throw new AtriumLLMError("No model configured.");
  }
  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": anthropicVersion || "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new AtriumLLMError(`Network error: ${err.message || String(err)}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AtriumLLMError(
      `Anthropic API ${res.status}${text ? `: ${text.slice(0, 240)}` : ""}`,
      { status: res.status, body: text }
    );
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) {
    throw new AtriumLLMError("Empty response from Anthropic API.");
  }
  return { text, raw: data };
}

// Robust JSON extraction from LLM output. Handles fenced code blocks,
// leading/trailing prose, and trailing commas (best-effort).
export function extractJSON(text) {
  if (!text || typeof text !== "string") return null;
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenceMatch) {
    const parsed = tryParse(fenceMatch[1]);
    if (parsed) return parsed;
  }
  const direct = tryParse(text);
  if (direct) return direct;
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    const parsed = tryParse(braceMatch[0]);
    if (parsed) return parsed;
  }
  return null;
}

function tryParse(s) {
  try { return JSON.parse(s); } catch {}
  try { return JSON.parse(s.replace(/,(\s*[}\]])/g, "$1")); } catch {}
  return null;
}
