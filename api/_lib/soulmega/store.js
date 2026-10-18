import process from "node:process";
import { OTHER_PLACEMENT } from "./audience.js";

// Aggregate store for capture measurement: Upstash Redis over its REST API
// (Vercel Marketplace "Upstash for Redis"), or log-only when no store is
// provisioned. Holds counters, HyperLogLog uniques and rate-limit buckets.
// Never raw IPs, never emails.
//
// Upstash pipeline: POST {url}/pipeline, Bearer token, body is a JSON array of
// commands, reply is [{result}|{error}, ...] in order (not atomic).
// https://upstash.com/docs/redis/features/restapi

export const TTL_SECONDS = 400 * 86400;
const TIMEOUT_MS = 3000;

export function storeConfig() {
  const pairs = [
    [process.env.KV_REST_API_URL, process.env.KV_REST_API_TOKEN],
    [process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN],
  ];
  for (const [url, token] of pairs) {
    if (url && token && /^https:\/\//.test(url.trim())) {
      return { url: url.trim().replace(/\/+$/, ""), token: token.trim() };
    }
  }
  return null;
}

export async function pipeline(commands, cfg = storeConfig()) {
  if (!cfg) return null;
  if (!commands.length) return [];
  const res = await globalThis.fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`upstash pipeline ${res.status}`);
  const out = await res.json();
  if (!Array.isArray(out)) throw new Error("upstash pipeline: unexpected reply");
  return out;
}

// ---------- rate limiting ----------

const memory = new Map();

function memoryLimited(keys, limits, now) {
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.expires <= now) memory.delete(k);
  }
  let limited = false;
  keys.forEach((key, i) => {
    const hit = memory.get(key);
    const entry = hit && hit.expires > now ? hit : { count: 0, expires: now + limits[i].windowSec * 1000 };
    entry.count += 1;
    memory.set(key, entry);
    if (entry.count > limits[i].max) limited = true;
  });
  return limited;
}

// Fixed windows per hashed IP. Shared through Redis when provisioned; per
// instance in memory otherwise. A store failure fails open.
export async function rateLimit(scope, id, limits) {
  const now = Date.now();
  const keys = limits.map(
    ({ windowSec }) => `smcap:rl:${scope}:${id}:${windowSec}:${Math.floor(now / 1000 / windowSec)}`,
  );
  const cfg = storeConfig();
  if (cfg) {
    try {
      const cmds = keys.flatMap((k, i) => [["INCR", k], ["EXPIRE", k, limits[i].windowSec]]);
      const out = await pipeline(cmds, cfg);
      return limits.some((l, i) => Number(out[i * 2]?.result) > l.max);
    } catch (e) {
      console.error("soulmega-store: rate limit check failed:", e?.message);
      return false;
    }
  }
  return memoryLimited(keys, limits, now);
}

// ---------- beacons ----------

// HINCRBY smcap:{env}:d:{day} "{e}|{p}|{c}|{d}|{src}" n
// PFADD   smcap:{env}:u:{day}:{e}|{p} sid   (not for the "other" placement)
// EXPIRE  both, 400 days
export function signalCommands({ env, day, events, sid }) {
  const hkey = `smcap:${env}:d:${day}`;
  const counts = new Map();
  const pairs = new Set();
  for (const ev of events) {
    const field = `${ev.e}|${ev.p}|${ev.c}|${ev.d}|${ev.src}`;
    counts.set(field, (counts.get(field) || 0) + 1);
    if (ev.p !== OTHER_PLACEMENT) pairs.add(`${ev.e}|${ev.p}`);
  }
  const cmds = [...counts].map(([field, n]) => ["HINCRBY", hkey, field, n]);
  if (cmds.length) cmds.push(["EXPIRE", hkey, TTL_SECONDS]);
  if (sid) {
    for (const pair of pairs) {
      const ukey = `smcap:${env}:u:${day}:${pair}`;
      cmds.push(["PFADD", ukey, sid], ["EXPIRE", ukey, TTL_SECONDS]);
    }
  }
  return { cmds, counts: Object.fromEntries(counts) };
}

export async function recordSignal(batch) {
  const { cmds, counts } = signalCommands(batch);
  const cfg = storeConfig();
  if (!cfg) {
    console.log(JSON.stringify({ smcap: { env: batch.env, day: batch.day, counts } }));
    return { stored: false };
  }
  await pipeline(cmds, cfg);
  return { stored: true };
}

// ---------- Mailchimp webhook ----------

export function webhookCommands({ day, type, source, context }) {
  const key = `smcap:prod:mc:${day}`;
  return [["HINCRBY", key, `${type}|${source}|${context}`, 1], ["EXPIRE", key, TTL_SECONDS]];
}

export async function recordWebhook(entry) {
  const cfg = storeConfig();
  if (!cfg) {
    console.log(JSON.stringify({ smcap: { mc: entry } }));
    return { stored: false };
  }
  await pipeline(webhookCommands(entry), cfg);
  return { stored: true };
}

// ---------- report ----------

// Upstash returns HGETALL as a flat [field, value, ...] array.
function hashFromReply(reply) {
  const out = {};
  const r = reply?.result;
  if (Array.isArray(r)) {
    for (let i = 0; i + 1 < r.length; i += 2) out[r[i]] = Number(r[i + 1]) || 0;
  } else if (r && typeof r === "object") {
    for (const [k, v] of Object.entries(r)) out[k] = Number(v) || 0;
  }
  return out;
}

// Daily counter hashes for the range, summed: { capture: {field: n}, mc: {field: n} }
export async function readCounts({ env, days }) {
  const cfg = storeConfig();
  if (!cfg) return null;
  const cmds = days.flatMap((d) => [["HGETALL", `smcap:${env}:d:${d}`], ["HGETALL", `smcap:${env}:mc:${d}`]]);
  const out = await pipeline(cmds, cfg);
  const capture = {};
  const mc = {};
  days.forEach((_d, i) => {
    for (const [f, n] of Object.entries(hashFromReply(out[i * 2]))) capture[f] = (capture[f] || 0) + n;
    for (const [f, n] of Object.entries(hashFromReply(out[i * 2 + 1]))) mc[f] = (mc[f] || 0) + n;
  });
  return { capture, mc };
}

// Unique sessions across the whole range per "{e}|{p}" (PFCOUNT over the
// day keys is the union). null for a pair whose count failed.
export async function readUniques({ env, days, pairs }) {
  const cfg = storeConfig();
  if (!cfg || !pairs.length) return {};
  const cmds = pairs.map((pair) => ["PFCOUNT", ...days.map((d) => `smcap:${env}:u:${d}:${pair}`)]);
  const out = await pipeline(cmds, cfg);
  return Object.fromEntries(pairs.map((pair, i) => [pair, out[i]?.error ? null : Number(out[i]?.result) || 0]));
}
