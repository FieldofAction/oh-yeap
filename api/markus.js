import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./_lib/markus-prompt.js";

// Markus, Soul Mega's bartender. Called from soulmega.com, so CORS is
// limited to Soul Mega origins. Streams plain text back to the page.

const ALLOWED_ORIGINS = [
  /^https:\/\/(www\.)?soulmega\.com$/,
  /^https:\/\/[a-z0-9-]+\.webflow\.io$/,
  /^http:\/\/localhost(:\d+)?$/,
];
const MAX_TURNS = 30;
const MAX_CHARS = 2000;

const client = new Anthropic();

function cors(req, res) {
  const origin = req.headers.origin || "";
  const ok = ALLOWED_ORIGINS.some((re) => re.test(origin));
  if (ok) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  return ok;
}

// Keep only well-formed user/assistant text turns, starting on a user turn.
function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim(),
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_TURNS);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

export default async function handler(req, res) {
  const allowed = cors(req, res);
  if (req.method === "OPTIONS") return res.status(allowed ? 204 : 403).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!allowed) return res.status(403).json({ error: "Origin not allowed" });

  const messages = cleanMessages(req.body?.messages);
  if (!messages) return res.status(400).json({ error: "Bad messages" });

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  try {
    const stream = client.beta.messages.stream({
      model: "claude-opus-5",
      max_tokens: 2048,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(event.delta.text);
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      res.write("Let's take that one somewhere else. What else is on your mind?");
    }
    res.end();
  } catch (e) {
    console.error("markus:", e?.status, e?.message);
    if (!res.headersSent) res.status(502);
    res.end(res.headersSent ? "" : "Markus stepped away for a second. Try again.");
  }
}
