import { timingSafeEqual } from "node:crypto";

// Relay for the Workshop tools that run on the server-side Anthropic key
// (Breakground, Desert, FOA Generator). It is not a general-purpose proxy:
// - only Field of Action origins (or the deployment itself) may call it from a browser
// - when STUDIO_PASSWORD is set in the environment, the caller must send the
//   same value in x-studio-key (the client sends what was typed at the gate)
// - only known models, a bounded max_tokens, and plain text turns go upstream

const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)?fieldofaction\.org$/,
  /^http:\/\/localhost(:\d+)?$/,
];

// Same-origin calls are always fine, which covers Vercel preview deployments
// without naming their domains here.
function originAllowed(req) {
  const origin = req.headers.origin || "";
  if (!origin) return true;
  try {
    if (new URL(origin).host === req.headers.host) return true;
  } catch {
    return false;
  }
  return ALLOWED_ORIGINS.some((re) => re.test(origin));
}
const ALLOWED_MODELS = new Set([
  "claude-sonnet-5-5",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
]);
const MAX_TOKENS = 4096;
const MAX_TURNS = 60;
const MAX_TURN_CHARS = 8000;
const MAX_SYSTEM_CHARS = 12000;

function keyMatches(given, expected) {
  const a = Buffer.from(String(given || ""));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_TURN_CHARS) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  return msgs.length ? msgs : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  if (!originAllowed(req)) {
    return res.status(403).json({ error: { message: "Origin not allowed" } });
  }

  const studioPassword = process.env.STUDIO_PASSWORD;
  if (studioPassword && !keyMatches(req.headers["x-studio-key"], studioPassword)) {
    return res.status(401).json({ error: { message: "Studio is locked. Unlock it again and retry." } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "API key not configured" } });
  }

  const body = req.body || {};
  if (!ALLOWED_MODELS.has(body.model)) {
    return res.status(400).json({ error: { message: "Model not allowed" } });
  }
  const messages = cleanMessages(body.messages);
  if (!messages) {
    return res.status(400).json({ error: { message: "No messages" } });
  }
  const maxTokens = Math.min(Math.max(parseInt(body.max_tokens, 10) || 1024, 1), MAX_TOKENS);
  const upstream = { model: body.model, max_tokens: maxTokens, messages };
  if (typeof body.system === "string" && body.system.trim()) {
    upstream.system = body.system.slice(0, MAX_SYSTEM_CHARS);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(upstream),
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
