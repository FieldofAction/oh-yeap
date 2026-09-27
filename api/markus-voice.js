import { cors } from "./_lib/markus-cors.js";

// Markus's voice. The page sends one sentence of his reply at a time, so
// he starts talking before the whole reply has streamed. format "mp3" (the
// default) plays in the page; "pcm" is 16 kHz 16-bit mono for the Simli
// live face (api/markus-avatar.js), which lip-syncs to it.
// Needs ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID.

const MAX_CHARS = 600;
const MODEL = "eleven_flash_v2_5";

// Spoken forms for things a voice would otherwise read awkwardly.
function forSpeech(text) {
  return text
    .replace(/\b988\b/g, "nine eight eight")
    .replace(/\b911\b/g, "nine one one")
    .replace(/soulmega\.com/gi, "soul mega dot com")
    .replace(/\bDC\b/g, "D.C.");
}

export default async function handler(req, res) {
  const allowed = cors(req, res);
  if (req.method === "OPTIONS") return res.status(allowed ? 204 : 403).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!allowed) return res.status(403).json({ error: "Origin not allowed" });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) return res.status(503).json({ error: "Voice not configured" });

  const pcm = req.body?.format === "pcm";
  const text = typeof req.body?.text === "string" ? req.body.text.trim().slice(0, MAX_CHARS) : "";
  if (!text) return res.status(400).json({ error: "Bad text" });

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=${pcm ? "pcm_16000" : "mp3_44100_128"}`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: pcm ? "application/octet-stream" : "audio/mpeg" },
        body: JSON.stringify({
          text: forSpeech(text),
          model_id: MODEL,
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2 },
        }),
      },
    );
    if (!upstream.ok || !upstream.body) {
      console.error("markus-voice:", upstream.status, await upstream.text().catch(() => ""));
      return res.status(502).json({ error: "Voice unavailable" });
    }

    res.setHeader("Content-Type", pcm ? "application/octet-stream" : "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    const reader = upstream.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (e) {
    console.error("markus-voice:", e?.message);
    if (!res.headersSent) res.status(502).json({ error: "Voice unavailable" });
    else res.end();
  }
}
