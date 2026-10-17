import { cors } from "./_lib/markus-cors.js";

// Starts a Simli session for Markus's live face. The page gets a
// short-lived session token and ICE servers; the Simli API key stays here.
// Sessions bill per minute, so they are short and end when idle.
// Needs SIMLI_API_KEY and SIMLI_FACE_ID.

const SIMLI = "https://api.simli.ai";

export default async function handler(req, res) {
  const allowed = cors(req, res);
  if (req.method === "OPTIONS") return res.status(allowed ? 204 : 403).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!allowed) return res.status(403).json({ error: "Origin not allowed" });

  const apiKey = process.env.SIMLI_API_KEY;
  const faceId = process.env.SIMLI_FACE_ID;
  if (!apiKey || !faceId) return res.status(503).json({ error: "Avatar not configured" });

  res.setHeader("Cache-Control", "no-store");
  try {
    const [tokenRes, iceRes] = await Promise.all([
      fetch(`${SIMLI}/compose/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-simli-api-key": apiKey },
        body: JSON.stringify({
          faceId,
          handleSilence: true,
          maxSessionLength: 600,
          maxIdleTime: 90,
        }),
      }),
      fetch(`${SIMLI}/compose/ice`, { headers: { "x-simli-api-key": apiKey } }),
    ]);
    if (!tokenRes.ok) {
      console.error("markus-avatar token:", tokenRes.status, await tokenRes.text().catch(() => ""));
      return res.status(502).json({ error: "Avatar unavailable" });
    }
    const { session_token } = await tokenRes.json();
    const iceServers = iceRes.ok ? await iceRes.json() : null;
    return res.status(200).json({
      session_token,
      iceServers: Array.isArray(iceServers) && iceServers.length ? iceServers : [{ urls: ["stun:stun.l.google.com:19302"] }],
    });
  } catch (e) {
    console.error("markus-avatar:", e?.message);
    return res.status(502).json({ error: "Avatar unavailable" });
  }
}
