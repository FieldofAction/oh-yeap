// Poster lookup for The Oz Index (public/oz-index.html).
//
// GET /api/poster?title=Mad%20Max:%20Fury%20Road&year=2015
//   -> { poster: "https://image.tmdb.org/t/p/w500/....jpg" } | { poster: null }
//
// The key never reaches the page. TMDB attribution is required when a poster
// is shown; the instrument prints it in the plate caption and the colophon.
//
// Set TMDB_API_KEY in the Vercel project env. Either credential works: a v3
// API key (32 hex chars, sent as a query param) or a v4 read token (a JWT,
// sent as a Bearer header).

const TMDB_SEARCH = "https://api.themoviedb.org/3/search/movie";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// Per-IP guard. Serverless instances are ephemeral and not shared, so this
// throttles a single hot client rather than enforcing a global quota — enough
// to keep one open tab from hammering TMDB on our key.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

export async function lookupPoster({ title, year, key }) {
  const params = new URLSearchParams({
    query: title,
    include_adult: "false",
    language: "en-US",
  });
  if (/^\d{4}$/.test(String(year || ""))) params.set("year", String(year));

  const isBearer = key.startsWith("ey");
  if (!isBearer) params.set("api_key", key);

  const res = await fetch(`${TMDB_SEARCH}?${params.toString()}`, {
    headers: isBearer ? { Authorization: `Bearer ${key}` } : {},
  });
  if (!res.ok) return { poster: null, status: res.status };

  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];
  // TMDB orders by its own relevance; take the first result that has art.
  const hit = results.find((r) => r.poster_path);
  if (!hit) return { poster: null, status: 200 };

  return {
    poster: `${IMAGE_BASE}${hit.poster_path}`,
    tmdbId: hit.id,
    matchedTitle: hit.title,
    matchedYear: (hit.release_date || "").slice(0, 4) || null,
    status: 200,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  if (rateLimited(ip)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too many poster lookups. Wait a minute." });
  }

  const title = String(req.query?.title || "").trim().slice(0, 200);
  const year = String(req.query?.year || "").trim();
  if (!title) return res.status(400).json({ error: "title is required" });

  const key = process.env.TMDB_API_KEY;
  // No key configured is not an error the page should care about: the
  // instrument simply runs without the poster tier.
  if (!key) return res.status(200).json({ poster: null, reason: "no-key" });

  try {
    const out = await lookupPoster({ title, year, key });
    if (out.status !== 200) {
      return res.status(200).json({ poster: null, reason: `tmdb-${out.status}` });
    }
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).json(out);
  } catch {
    return res.status(200).json({ poster: null, reason: "lookup-failed" });
  }
}
