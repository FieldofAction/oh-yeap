#!/usr/bin/env node
// Local server for the Soul Mega audience capture prototype.
//
//   npm run soulmega:lab            -> http://localhost:5181/soulmega/capture/lab.html
//   PORT=5190 npm run soulmega:lab  -> another port
//
// Serves public/ as static files and runs the api/soulmega-*.js handlers
// with Vercel-shaped req/res objects, so the lab can be exercised end to end
// without `vercel dev`. Every request is dry-run: SOULMEGA_CAPTURE_DRY_RUN=1
// is forced unless SOULMEGA_CAPTURE_LIVE=1 is set, and the handlers treat
// localhost origins as dry-run regardless.
//
// SOULMEGA_CAPTURE_API_DIR points the /api routes at another folder of
// handlers (used to test this server against stubs). HOST defaults to
// 127.0.0.1 so the server is not reachable from the network.
//
// Vercel adds client IP and geo headers at its edge. This server adds the
// same headers when a request lacks them, so the GEOIP and METRO logic runs
// locally: SOULMEGA_CAPTURE_DEV_GEO="City,REGION,CC" (default
// "Washington,DC,US"), or SOULMEGA_CAPTURE_DEV_GEO=0 to send none.

import http from "node:http";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PUBLIC_DIR = join(ROOT, "public");
const API_DIR = resolve(process.env.SOULMEGA_CAPTURE_API_DIR || join(ROOT, "api"));
const PORT = Number(process.env.PORT) || 5181;
const HOST = process.env.HOST || "127.0.0.1";
const LAB_PATH = "/soulmega/capture/lab.html";
const MAX_BODY = 1024 * 1024;
const HANDLER_TIMEOUT_MS = 30_000;

const DEV_GEO = parseDevGeo(process.env.SOULMEGA_CAPTURE_DEV_GEO);

const LIVE = process.env.SOULMEGA_CAPTURE_LIVE === "1";
if (!LIVE) process.env.SOULMEGA_CAPTURE_DRY_RUN = "1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

// ---- Logging: one line per request ----

function stamp() {
  return new Date().toTimeString().slice(0, 8);
}

function logRequest(req, res, started, note) {
  const ms = Date.now() - started;
  const tail = note ? `  ${note}` : "";
  console.log(`${stamp()} ${req.method} ${req.url} ${res.statusCode} ${ms}ms${tail}`);
}

// ---- Vercel-shaped request helpers ----

function parseDevGeo(raw) {
  if (raw === "0") return null;
  const [city, region, country] = String(raw || "Washington,DC,US").split(",").map((s) => s.trim());
  if (!city || !country) return null;
  return { city, region: region || "", country };
}

// What Vercel's edge would have added. Never overrides a header the
// request already carries, and geo is all or nothing.
function addEdgeHeaders(req) {
  const ip = String(req.socket?.remoteAddress || "127.0.0.1").replace(/^::ffff:/, "");
  req.headers["x-forwarded-for"] ??= ip;
  req.headers["x-real-ip"] ??= ip;
  const hasGeo = ["x-vercel-ip-city", "x-vercel-ip-country-region", "x-vercel-ip-country"].some(
    (h) => h in req.headers,
  );
  if (DEV_GEO && !hasGeo) {
    req.headers["x-vercel-ip-city"] = encodeURIComponent(DEV_GEO.city);
    if (DEV_GEO.region) req.headers["x-vercel-ip-country-region"] = DEV_GEO.region;
    req.headers["x-vercel-ip-country"] = DEV_GEO.country;
  }
}

// Vercel gives repeated query keys as arrays, single ones as strings.
function parseQuery(searchParams) {
  const query = {};
  for (const [key, value] of searchParams) {
    if (key in query) {
      query[key] = Array.isArray(query[key]) ? [...query[key], value] : [query[key], value];
    } else {
      query[key] = value;
    }
  }
  return query;
}

function parseCookies(header) {
  const cookies = {};
  for (const part of String(header || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 1) continue;
    const key = part.slice(0, i).trim();
    const raw = part.slice(i + 1).trim();
    try {
      cookies[key] = decodeURIComponent(raw);
    } catch {
      cookies[key] = raw;
    }
  }
  return cookies;
}

// Past MAX_BODY the rest is read and discarded, so the 413 can still be sent.
function readBody(req) {
  return new Promise((done, fail) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size <= MAX_BODY) chunks.push(chunk);
    });
    req.on("end", () => {
      if (size > MAX_BODY) fail(Object.assign(new Error("Payload too large"), { status: 413 }));
      else done(Buffer.concat(chunks));
    });
    req.on("error", fail);
  });
}

// Mirrors @vercel/node: JSON -> object, urlencoded -> flat object (keys such
// as "data[merges][SOURCE]" stay as written), text/plain -> string,
// octet-stream -> Buffer, anything else -> undefined.
function parseBody(contentType, buffer) {
  const type = String(contentType || "").split(";")[0].trim().toLowerCase();
  if (!type) return undefined;
  if (type === "application/json") {
    const text = buffer.toString("utf8");
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw Object.assign(new Error("Invalid JSON"), { status: 400 });
    }
  }
  if (type === "application/x-www-form-urlencoded") {
    return parseQuery(new URLSearchParams(buffer.toString("utf8")));
  }
  if (type === "text/plain") return buffer.toString("utf8");
  if (type === "application/octet-stream") return buffer;
  return undefined;
}

// ---- Vercel-shaped response helpers ----

function withCharset(type) {
  return /charset=/i.test(type) ? type : `${type}; charset=utf-8`;
}

function decorateResponse(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.send = (body) => {
    if (body === null || body === undefined) {
      res.end();
      return res;
    }
    if (Buffer.isBuffer(body)) {
      if (!res.getHeader("content-type")) res.setHeader("Content-Type", "application/octet-stream");
      res.end(body);
      return res;
    }
    if (typeof body === "object") return res.json(body);
    const text = String(body);
    const type = res.getHeader("content-type");
    res.setHeader("Content-Type", withCharset(typeof type === "string" ? type : "text/html"));
    res.end(text);
    return res;
  };
  res.json = (value) => {
    if (!res.getHeader("content-type")) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(value));
    return res;
  };
  res.redirect = (statusOrUrl, maybeUrl) => {
    const url = maybeUrl === undefined ? statusOrUrl : maybeUrl;
    res.statusCode = maybeUrl === undefined ? 307 : statusOrUrl;
    res.setHeader("Location", url);
    res.end();
    return res;
  };
  return res;
}

// ---- API: /api/soulmega-<name> -> <API_DIR>/soulmega-<name>.js ----

const handlers = new Map();

async function loadHandler(name) {
  if (handlers.has(name)) return handlers.get(name);
  const file = join(API_DIR, `soulmega-${name}.js`);
  try {
    if (!(await stat(file)).isFile()) return null;
  } catch {
    return null;
  }
  const mod = await import(pathToFileURL(file).href);
  if (typeof mod.default !== "function") {
    throw new Error(`${file} has no default export`);
  }
  handlers.set(name, mod.default);
  return mod.default;
}

async function serveApi(req, res, url, name) {
  let handler;
  try {
    handler = await loadHandler(name);
  } catch (e) {
    console.error(`soulmega-dev: could not load handler soulmega-${name}:`, e);
    return res.status(500).json({ ok: false, error: "handler_failed_to_load" });
  }
  if (!handler) return res.status(404).json({ ok: false, error: "not_found" });

  let buffer;
  try {
    buffer = await readBody(req);
    req.body = parseBody(req.headers["content-type"], buffer);
  } catch (e) {
    res.statusCode = e.status || 400;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end(e.message);
  }
  req.query = parseQuery(url.searchParams);
  req.cookies = parseCookies(req.headers.cookie);
  addEdgeHeaders(req);

  const timer = setTimeout(() => {
    if (res.writableEnded) return;
    console.error(`soulmega-dev: soulmega-${name} did not end the response within ${HANDLER_TIMEOUT_MS}ms`);
    if (!res.headersSent) res.statusCode = 504;
    res.end();
  }, HANDLER_TIMEOUT_MS);
  res.on("close", () => clearTimeout(timer));

  try {
    await handler(req, res);
  } catch (e) {
    console.error(`soulmega-dev: soulmega-${name} threw:`, e);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "server_error" });
    else if (!res.writableEnded) res.end();
  }
}

// ---- Static: public/ ----

let publicReal;

async function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).send("Method not allowed");
  }

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return res.status(400).send("Bad request");
  }
  // No NUL bytes, no backslashes, no dot segments (covers .., .env, .DS_Store).
  const segments = decoded.split("/").filter(Boolean);
  if (decoded.includes("\0") || decoded.includes("\\") || segments.some((s) => s.startsWith("."))) {
    return res.status(404).send("Not found");
  }

  let file = resolve(PUBLIC_DIR, ...segments);
  if (file !== PUBLIC_DIR && !file.startsWith(PUBLIC_DIR + sep)) {
    return res.status(404).send("Not found");
  }

  let info;
  try {
    info = await stat(file);
    if (info.isDirectory()) {
      file = join(file, "index.html");
      info = await stat(file);
    }
    if (!info.isFile()) throw new Error("not a file");
    // A symlink inside public/ must not lead outside it.
    publicReal ??= await realpath(PUBLIC_DIR);
    const real = await realpath(file);
    if (!real.startsWith(publicReal + sep)) throw new Error("outside public");
  } catch {
    return res.status(404).send("Not found");
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", TYPES[extname(file).toLowerCase()] || "application/octet-stream");
  res.setHeader("Content-Length", info.size);
  res.setHeader("Cache-Control", "no-store");
  // Vercel serves public/ with this header; config.json and the module are
  // fetched cross-origin from soulmega.com in production.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method === "HEAD") return res.end();
  createReadStream(file)
    .on("error", () => res.destroy())
    .pipe(res);
}

// ---- Router ----

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  let note = "";
  decorateResponse(res);
  res.on("finish", () => logRequest(req, res, started, note));

  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch {
    return res.status(400).send("Bad request");
  }

  if (url.pathname === "/") {
    res.setHeader("Location", LAB_PATH + url.search);
    res.setHeader("Cache-Control", "no-store");
    return res.status(302).end();
  }

  const api = /^\/api\/soulmega-([a-z0-9][a-z0-9-]{0,40})\/?$/.exec(url.pathname);
  if (api) {
    note = LIVE ? "[live env]" : "[dry-run]";
    return serveApi(req, res, url, api[1]);
  }
  if (url.pathname.startsWith("/api/")) {
    return res.status(404).json({ ok: false, error: "not_found" });
  }

  return serveStatic(req, res, url.pathname);
});

server.on("error", (e) => {
  console.error(`soulmega-dev: ${e.code === "EADDRINUSE" ? `port ${PORT} is in use` : e.message}`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const store = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL ? "Upstash" : "log only";
  console.log(`Soul Mega capture lab: http://localhost:${PORT}${LAB_PATH}`);
  console.log(`  static   ${PUBLIC_DIR}`);
  console.log(`  api      ${API_DIR}/soulmega-*.js`);
  console.log(`  mode     ${LIVE ? "SOULMEGA_CAPTURE_LIVE=1 (dry-run forcing is off)" : "dry-run (SOULMEGA_CAPTURE_DRY_RUN=1)"}`);
  console.log(`  store    ${store}`);
  console.log(`  geo      ${DEV_GEO ? `${DEV_GEO.city}, ${DEV_GEO.region}, ${DEV_GEO.country} (simulated Vercel headers)` : "none"}`);
});
