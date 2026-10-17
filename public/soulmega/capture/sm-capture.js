/* Soul Mega audience capture, client module (sm-capture).
 *
 * One classic script, no dependencies (Webflow registers hosted scripts as
 * classic). Invitations render inside Shadow DOM so the site's ~300 global
 * !important rules cannot reach the controls. It talks to /api/soulmega-* on
 * www.fieldofaction.org and counts what it does with a first-party beacon.
 * Copy, placements and switches live in config.json beside this file, so the
 * words change without a release. Contract and rollout: SOULMEGA-CAPTURE.md.
 */
(function () {
  "use strict";
  if (window.SoulMegaCapture) return;

  const VERSION = "1.0.0";
  const T0 = Date.now();
  const SCRIPT = document.currentScript || document.querySelector('script[src*="sm-capture"]');
  const SCRIPT_SRC = (SCRIPT && SCRIPT.src) || location.href;
  const CONTEXTS = ["home", "product", "events", "radio", "journal", "local", "shop"];
  const INTERESTS = ["events", "beer", "music", "merch"];
  const VARIANTS = ["inline", "flyout", "continue", "footer-extras"];
  const EVENTS = "pv imp open submit ok err dismiss prefs_view prefs_ok prefs_skip sms_click fallback".split(" ");
  const ERRS = "invalid_email age_required bad_request rate_limited unavailable expired forbidden rejected bounced".split(" ");
  const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/;
  const EVENT_SLUG = /^[a-z0-9-]{1,60}$/;
  const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
  const OUTBOUND = 'a.sm-ev, a[href*="posh.vip"], a[href*="fourthwall"], a[href*="thewineconcierge"]';
  const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia)\./;
  const SOCIAL = /(^|\.)(instagram\.com|facebook\.com|fb\.com|t\.co|x\.com|twitter\.com|tiktok\.com|linkedin\.com|lnkd\.in|threads\.(net|com)|youtube\.com|youtu\.be|reddit\.com)$/;
  const DAY = 864e5;
  // Phones in either orientation, and any short window: the docked, collapsed flyout.
  const MOBILE = window.matchMedia ? window.matchMedia("(max-width:767px), (max-height:500px)") : null;
  // Webflow staging (soulmega.webflow.io) is never live: the module runs dry there too.
  const STAGE = /\.webflow\.io$/i.test(location.hostname);
  const CONSENT = /^[a-z0-9][a-z0-9.-]{0,31}$/;
  // Where the fallback may send an address: Mailchimp's own JSONP endpoint, nothing else.
  const MC_ACTION = /^https:\/\/[a-z0-9-]+\.us\d{1,2}\.list-manage\.com\/subscribe\/post-json$/;

  /* ---- Defaults. config.json ships the same values; window.SM_CAPTURE_CONFIG wins over both. ---- */
  const DEFAULTS = {
    enabled: true,
    api: "https://www.fieldofaction.org/api",
    configUrl: null,
    privacyUrl: "/privacy",
    consentId: "email-v1",
    dryRun: false,
    lab: false,
    path: null,
    simulate: null,
    mailchimpFallback: { enabled: true, action: "https://soulmega.us3.list-manage.com/subscribe/post-json", u: "98da2d6b76edc4cb79c46d8b8", id: "94b16e1a8e" },
    contexts: {
      home: { eyebrow: "Rendezvous", body: "", preselect: [], sms: false },
      product: { eyebrow: "New releases", body: "First word when a new beer leaves the brewhouse. Releases, collaborations, and where to find them.", preselect: ["beer"], sms: false },
      events: { eyebrow: "Gatherings", body: "Local nights, invitations, and where we’re pouring next. You’ll hear about it early.", preselect: ["events"], sms: true },
      radio: { eyebrow: "Soul Mega Radio", body: "New mixes, the selectors behind them, and the culture around the beer.", preselect: ["music"], sms: false },
      journal: { eyebrow: "Journal", body: "New stories and the people we make things with.", preselect: ["music"], sms: false },
      local: { eyebrow: "Near you", body: "Tell us your city and we’ll let you know when Soul Mega lands nearby.", preselect: [], sms: false },
      shop: { eyebrow: "Merch", body: "Limited drops and small-run pieces, announced here first.", preselect: ["merch"], sms: false },
    },
    routes: [
      { match: "^/beer$|^/collabs$", context: "product" },
      { match: "^/events(/|$)", context: "events" },
      { match: "^/radio(/|$)", context: "radio" },
      { match: "^/journal(/|$)", context: "journal" },
      { match: "^/find-us$", context: "local" },
      { match: "^/(shop|merch|store)(/|$)", context: "shop" },
    ],
    placements: [
      { id: "home-origin", match: "^/home-enter$", selector: "div.we-ve-got-soul.home-test", position: "afterend", context: "home", enabled: true },
      { id: "beer-list", match: "^/beer$", selector: "[data-beer-page] [data-collabs-card], [data-beer-page] .sm-cocard", position: "beforebegin", context: "product", enabled: true },
      { id: "collabs-end", match: "^/collabs$", selector: "[data-collabs-page]", position: "beforeend", context: "product", enabled: true },
      { id: "events-list", match: "^/events$", selector: ".sm-events-past, .sm-events-list", pick: "last", position: "afterend", context: "events", rule: false, enabled: true },
      { id: "journal-index", match: "^/journal$", selector: ".sm-jn-inner", position: "beforeend", context: "journal", enabled: true },
      { id: "journal-story", match: "^/journal/[^/]+$", selector: "footer.sm-art-foot", position: "beforebegin", context: "journal", enabled: true },
      { id: "radio-day", match: "^/radio$", selector: "section.r-day", position: "afterend", context: "radio", enabled: true },
      { id: "find-us-local", match: "^/find-us$", selector: ".cta-location", position: "afterend", context: "local", enabled: true },
    ],
    flyout: {
      enabled: true, engagedSeconds: 35, scrollDepth: 0.5, scrollMinSeconds: 15, dismissDays: 30, maxIgnored: 3,
      excludePaths: ["^/$", "^/markus", "^/megafest", "^/contact-us", "^/radio-lab", "^/404"], mobileCollapsed: true,
    },
    footer: { enhance: true, selector: ".footer form#email-form" },
    sms: { enabled: false, url: null, contexts: ["events"] },
    interests: [
      { id: "events", label: "Events" }, { id: "beer", label: "Beer releases" },
      { id: "music", label: "Music & culture" }, { id: "merch", label: "Merch" },
    ],
    copy: {
      headline: "Keep good company.",
      body: "A little Soul Mega in your inbox. New releases, gatherings, and good things worth knowing about.",
      emailLabel: "Email address", emailPlaceholder: "Email address",
      cta: "Keep me posted", sending: "Sending",
      age: "I’m 21 or older",
      fine: "For adults 21+. Unsubscribe anytime.", privacy: "Privacy Policy", newTab: "(opens in a new tab)",
      errEmail: "That email doesn’t look right. Try again?",
      errAge: "Confirm you’re 21 or older to join.",
      errGeneric: "Something went sideways. Try again in a minute.",
      errBounced: "That address bounced before. Try another one?",
      errRejected: "We couldn’t add that address. Try another one?",
      prefsHead: "What moves you?", prefsSub: "Pick any that fit.",
      cityLabel: "City", cityPlaceholder: "Your city", cities: ["Washington DC", "Baltimore", "Annapolis", "Wilmington", "Richmond"],
      prefsCta: "That’s me", skip: "Skip",
      doneHead: "See you out there.",
      done: { subscribed: "You’re on the list.", pending: "Check your inbox to confirm and you’re in.", updated: "Good to see you again. You’re still on the list.", updatedPicks: "Good to see you again. We’ve got your picks." },
      smsLine: "Want a text when something’s happening near you? Texts are for 21+.", smsCta: "Get texts",
      region: "Soul Mega newsletter invitation", dismiss: "Dismiss",
    },
  };

  /* ---- Helpers ---- */
  const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const arr = (v) => (Array.isArray(v) ? v : []);
  const str = (v, n) => (typeof v === "string" ? v.slice(0, n || 100) : "");
  const num = (v, d) => (Number(v) > 0 ? Number(v) : d);
  // Thresholds where 0 means "at once" or "never": any finite number >= 0.
  const nn = (v, d) => {
    const n = typeof v === "number" || (typeof v === "string" && v.trim()) ? Number(v) : NaN;
    return Number.isFinite(n) && n >= 0 ? n : d;
  };
  const normEmail = (v) => String(v || "").trim().toLowerCase();
  const validEmail = (v) => v.length <= 254 && EMAIL.test(v);
  function merge(a, b) {
    if (!isObj(b)) return a;
    const out = Object.assign({}, a);
    for (const k of Object.keys(b)) {
      if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
      out[k] = isObj(a[k]) && isObj(b[k]) ? merge(a[k], b[k]) : b[k];
    }
    return out;
  }
  function rx(s) {
    try { return typeof s === "string" && s ? new RegExp(s) : null; } catch { return null; }
  }
  function emit(name, detail) {
    try { document.dispatchEvent(new CustomEvent(name, { detail })); } catch { /* very old browser */ }
  }
  // Read with one argument, write with two, delete with null. Storage may throw anywhere.
  function store(area, key, val) {
    try {
      const s = window[area];
      if (val === undefined) { const v = s.getItem(key); return v ? JSON.parse(v) : null; }
      if (val === null) s.removeItem(key); else s.setItem(key, JSON.stringify(val));
    } catch { /* blocked: the module runs on memory alone */ }
    return null;
  }
  function rid() {
    let b;
    try { b = crypto.getRandomValues(new Uint8Array(16)); } catch { b = Array.from({ length: 16 }, () => Math.random() * 256); }
    return Array.from(b, (x) => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(x) % 36]).join("");
  }
  const RM = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function dur(name, fb) {
    if (RM && RM.matches) return 1;
    const v = getComputedStyle(document.documentElement).getPropertyValue("--sm-" + name).trim();
    const n = parseFloat(v);
    return isFinite(n) ? (/ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n) : fb;
  }
  function h(tag, attrs, kids) {
    const el = document.createElement(tag);
    for (const k of Object.keys(attrs || {})) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "text") el.textContent = v;
      else el.setAttribute(k, v === true ? "" : String(v));
    }
    for (const c of kids || []) if (c) el.append(c);
    return el;
  }
  // The module's own glyphs: constant templates, never config strings.
  const ICONS = {
    arrow: '<svg viewBox="0 0 16 12" width="16" height="12"><path d="M1 6h13.2M9.4 1.2 14.2 6l-4.8 4.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M2 2l10 10M12 2 2 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 12 10" width="12" height="10"><path d="M1.2 5.3 4.4 8.4 10.8 1.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    alert: '<svg viewBox="0 0 16 16" width="15" height="15"><circle cx="8" cy="8" r="7.1" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 4.4v4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.5" r="1" fill="currentColor"/></svg>',
  };
  function icon(name) {
    const s = h("span", { class: "ic", "aria-hidden": "true" });
    s.innerHTML = ICONS[name];
    return s;
  }
  function visibleRatio(el) {
    const r = el.getBoundingClientRect();
    if (!r.height || !r.width) return 0;
    return Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / Math.min(r.height, innerHeight);
  }
  // Light when the nearest painted ancestor is light (/beer, the home bone and white bands).
  function autoRegister(el) {
    for (let n = el.parentElement; n; n = n.parentElement) {
      const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(n).backgroundColor || "");
      const p = m ? m[1].split(/[\s,/]+/).map(parseFloat) : [];
      if (p.length < 3 || (p.length > 3 && !(p[3] > 0.5))) continue;
      const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      return 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]) > 0.5 ? "light" : "dark";
    }
    return "dark";
  }
  function busy(btn, label) {
    const t = btn.querySelector(".cta-t"), was = t.textContent;
    btn.style.minWidth = btn.offsetWidth + "px";
    btn.classList.add("busy");
    btn.setAttribute("aria-busy", "true");
    t.textContent = label;
    return () => { btn.style.minWidth = ""; btn.classList.remove("busy"); btn.removeAttribute("aria-busy"); t.textContent = was; };
  }

  /* ---- Runtime state ---- */
  let cfg = merge(DEFAULTS, isObj(window.SM_CAPTURE_CONFIG) ? window.SM_CAPTURE_CONFIG : {});
  let killed = false, booted = false, PREVIEW = false;
  let PATH = location.pathname, CTX = "home", EVENT = "", SRC = "direct";
  let local = { subscribed: 0, dismissedAt: 0, ignored: 0, gate: 0 };
  let sess = { sid: rid(), shown: 0, pv: 0 };
  let ft = null, io = null;
  const F = { host: null, engaged: 0, lastAct: 0, lastType: 0, lastOut: 0, retry: 0, touched: false, shown: false, counted: false };
  const Q = [], seen = new Set();
  // Another tab, or this page restored from the back/forward cache, may have
  // written newer flags. Merge before every decision and every write, so a
  // stale page never shows what was dismissed or writes 0 over a timestamp.
  function syncLocal() {
    const l = store("localStorage", "smcap:v1");
    if (!isObj(l)) return;
    const n = (k) => (Number(l[k]) > 0 ? Number(l[k]) : 0);
    const theirs = n("dismissedAt"), ours = local.dismissedAt || 0;
    // ignored resets to 0 when it turns into a dismissal: follow whichever side did that last.
    local.ignored = theirs > ours ? n("ignored") : ours > theirs ? local.ignored || 0 : Math.max(n("ignored"), local.ignored || 0);
    for (const k of ["subscribed", "dismissedAt", "gate"]) local[k] = Math.max(n(k), local[k] || 0);
  }
  function syncSess() {
    const x = store("sessionStorage", "smcap:s");
    if (!isObj(x)) return;
    for (const k of ["shown", "pv"]) if (Number(x[k]) > (sess[k] || 0)) sess[k] = Number(x[k]);
  }
  const saveLocal = () => { syncLocal(); store("localStorage", "smcap:v1", local); };
  const saveSess = () => { syncSess(); store("sessionStorage", "smcap:s", sess); };
  const isDry = () => !!(cfg.dryRun || cfg.lab || PREVIEW || STAGE);
  // The API base is pinned: config.json is not covered by the script's SRI hash,
  // so it cannot point signups anywhere else. The lab uses its own origin.
  function apiBase() {
    const v = String(cfg.api || "").replace(/\/+$/, "");
    return v === DEFAULTS.api || (cfg.lab && v === "/api") ? v : DEFAULTS.api;
  }
  const api = (p) => apiBase() + p;
  const consentId = () => (CONSENT.test(cfg.consentId || "") ? cfg.consentId : DEFAULTS.consentId);
  function fallbackCfg() {
    const d = DEFAULTS.mailchimpFallback, mc = isObj(cfg.mailchimpFallback) ? cfg.mailchimpFallback : {};
    return {
      enabled: mc.enabled !== false,
      action: MC_ACTION.test(mc.action || "") ? mc.action : d.action,
      u: /^[0-9a-f]{16,40}$/.test(mc.u || "") ? mc.u : d.u,
      id: /^[0-9a-f]{6,20}$/.test(mc.id || "") ? mc.id : d.id,
    };
  }
  const state = () => ({
    version: VERSION, ready: booted, killed, path: PATH, context: CTX, event: EVENT || null,
    dryRun: isDry(), lab: !!cfg.lab, preview: PREVIEW, src: SRC, firstTouch: ft,
    subscribed: local.subscribed || 0, dismissedAt: local.dismissedAt || 0, ignored: local.ignored || 0, gate: local.gate || 0,
    sid: sess.sid, shown: sess.shown || 0, pv: sess.pv || 0,
    flyout: { open: !!F.host, engagedSeconds: F.engaged, blocked: booted ? hardBlock() || softBlock() : "booting" },
  });
  const emitState = () => emit("smcap:state", state());

  async function loadConfig() {
    const win = isObj(window.SM_CAPTURE_CONFIG) ? window.SM_CAPTURE_CONFIG : {};
    let url = win.configUrl;
    if (url == null) try { url = new URL("config.json", SCRIPT_SRC).href; } catch { url = ""; }
    let remote = {};
    if (url) {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 1500);
      try {
        const r = await fetch(new URL(url, location.href).href, { credentials: "omit", signal: ctl.signal });
        const j = r.ok ? await r.json() : null;
        if (isObj(j)) remote = j;
      } catch { /* slow or offline: built-in defaults */ }
      clearTimeout(t);
    }
    killed = remote.enabled === false || win.enabled === false; // the kill switch wins from any layer
    cfg = merge(merge(DEFAULTS, remote), win);
    cfg.configUrl = url || null;
  }

  function firstTouch() {
    const old = store("localStorage", "smcap:ft");
    if (old && Date.now() - Date.parse(old.ts) < 30 * DAY) return old;
    const q = new URLSearchParams(location.search);
    let ref = "", internal = false;
    try {
      const host = new URL(document.referrer).hostname;
      if (host.replace(/^www\./, "") === location.hostname.replace(/^www\./, "")) internal = true;
      else ref = host;
    } catch { /* no referrer */ }
    let src = internal ? "internal" : "direct";
    if ((q.get("utm_medium") || "").toLowerCase() === "email" || q.has("mc_cid")) src = "email";
    else if (["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].some((k) => q.has(k))) src = "campaign";
    else if (ref) src = SEARCH.test(ref) ? "search" : SOCIAL.test(ref) ? "social" : "referral";
    const t = { source: str(q.get("utm_source")), medium: str(q.get("utm_medium")), campaign: str(q.get("utm_campaign")), content: str(q.get("utm_content")), referrer: str(ref), landing: str(PATH), ts: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), src };
    store("localStorage", "smcap:ft", t);
    return t;
  }

  /* ---- Beacons ---- */
  function track(e, d) {
    if (killed || !EVENTS.includes(e)) return;
    d = d || {};
    const ev = { e, p: e !== "pv" && SLUG.test(d.p || "") ? d.p : "-", c: CONTEXTS.includes(d.c) ? d.c : CTX, path: PATH, d: innerWidth < 768 ? "m" : "d", src: SRC };
    if (Number.isInteger(d.n) && d.n >= 0 && d.n < 100) ev.n = d.n;
    if (ERRS.includes(d.x)) ev.x = d.x;
    Q.push(ev);
    emit("smcap:track", ev);
  }
  function flush() {
    while (Q.length) {
      const json = JSON.stringify(Object.assign({ v: 1, sid: sess.sid, events: Q.splice(0, 25) }, isDry() ? { dryRun: true } : {}));
      let sent = false;
      try { sent = navigator.sendBeacon(api("/soulmega-signal"), new Blob([json], { type: "text/plain" })); } catch { /* no beacon */ }
      if (!sent) try { fetch(api("/soulmega-signal"), { method: "POST", body: json, headers: { "Content-Type": "text/plain;charset=UTF-8" }, credentials: "omit", keepalive: true }).catch(() => {}); } catch { /* dropped */ }
    }
  }
  // One imp per placement per pageview, once at least half of it has been in view for a second.
  function observeImp(el, p, c) {
    if (!("IntersectionObserver" in window) || seen.has(p)) return;
    el._imp = { p, c, t: 0 };
    io = io || new IntersectionObserver((list) => {
      for (const en of list) {
        const m = en.target._imp;
        const on = en.isIntersecting && (en.intersectionRatio >= 0.5 || en.intersectionRect.height >= innerHeight / 2);
        if (on && !m.t) m.t = setTimeout(() => {
          if (!seen.has(m.p)) { seen.add(m.p); track("imp", m); }
          io.unobserve(en.target);
        }, 1000);
        else if (!on && m.t) { clearTimeout(m.t); m.t = 0; }
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    io.observe(el);
  }

  /* ---- Network ---- */
  async function post(path, body) {
    const endpoint = path.slice(1), url = api(path);
    emit("smcap:request", { endpoint, url, body });
    let status = 0, json = null;
    if (cfg.lab && cfg.simulate === "unavailable" && endpoint === "soulmega-subscribe") {
      status = 503; json = { ok: false, error: "unavailable", simulated: true };
    } else {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 10000);
      try {
        const r = await fetch(url, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "text/plain;charset=UTF-8" }, credentials: "omit", keepalive: false, signal: ctl.signal });
        status = r.status;
        json = await r.json().catch(() => null);
      } catch { status = 0; }
      clearTimeout(t);
    }
    emit("smcap:response", { endpoint, url, status, json });
    return { status, json };
  }
  // Mailchimp's own JSONP endpoint, the path the footer form already uses. Only
  // reached when our API cannot save the signup, and never sent in dry run or
  // the lab. It carries the same age, consent and source stamps the API writes
  // (hidden merge fields), so a fallback member keeps their 21+ record.
  // Resolves to "subscribed" | "pending" | "updated", or null when it failed.
  function jsonp(o, mc) {
    const cb = "__smcap_jsonp_" + rid();
    const day = new Date().toISOString().slice(0, 10);
    const q = new URLSearchParams({
      u: mc.u, id: mc.id, EMAIL: o.email,
      AGE21: day + " checkbox", CONSENT: consentId() + " " + day, SOURCE: o.placement, CONTEXT: o.context, SIGNUPPG: PATH,
      ["b_" + mc.u + "_" + mc.id]: "", c: cb,
    });
    const url = mc.action + "?" + q;
    if (isDry()) {
      emit("smcap:request", { endpoint: "mailchimp-jsonp", url, dryRun: true, note: "dry run: described only" });
      emit("smcap:response", { endpoint: "mailchimp-jsonp", status: 200, json: { result: "success", msg: "dry run" } });
      return Promise.resolve("subscribed");
    }
    return new Promise((resolve) => {
      const s = document.createElement("script");
      const end = (st) => {
        clearTimeout(t);
        s.remove();
        window[cb] = () => {};
        resolve(st);
      };
      const t = setTimeout(() => end(null), 10000);
      window[cb] = (r) => {
        const msg = String((r && r.msg) || "");
        if (r && r.result === "success") end(/confirm/i.test(msg) ? "pending" : "subscribed");
        else end(/already subscribed/i.test(msg) ? "updated" : null);
      };
      s.onerror = () => end(null);
      s.src = url;
      document.head.append(s);
    });
  }
  async function subscribe(o) {
    const body = {
      v: 1, email: o.email, age21: true, consent: consentId(), placement: o.placement, context: o.context, page: PATH,
      attribution: {}, hp: o.hp || "", elapsed: Math.max(0, Math.round(o.elapsed)), sid: sess.sid,
    };
    for (const k of ["source", "medium", "campaign", "content", "referrer", "landing", "ts"]) body.attribution[k] = str(ft && ft[k]);
    if (o.event) body.event = o.event;
    if (isDry()) body.dryRun = true;
    const r = await post("/soulmega-subscribe", body);
    const j = r.json || {};
    const t = { p: o.placement, c: o.context };
    // A dry-run answer to a page that did not ask for one (the API is held in
    // dry run) means nothing was saved: treat it like an outage.
    const held = r.status === 200 && j.ok && j.dryRun === true && !isDry();
    let out = null;
    if (r.status === 200 && j.ok && !held) {
      const status = ["subscribed", "pending", "updated"].includes(j.status) ? j.status : "subscribed";
      track("ok", Object.assign({ n: status === "updated" ? 0 : 1 }, t));
      out = { kind: "ok", status, token: j.token || "", geo: j.geo || null };
    } else if (held || r.status === 503 || r.status === 0) {
      const mc = fallbackCfg();
      const status = mc.enabled ? await jsonp(o, mc) : null;
      if (!status) return { kind: "error", code: "unavailable" };
      track("fallback", t);
      out = { kind: "fallback", status, token: "", geo: null };
    } else {
      return { kind: "error", code: ERRS.includes(j.error) ? j.error : r.status === 429 ? "rate_limited" : "bad_request" };
    }
    // A dry run outside the lab (preview, staging) saved nothing, so this browser is not marked as subscribed.
    if (cfg.lab || !isDry()) {
      local.subscribed = Date.now();
      saveLocal();
    }
    if (F.host && F.host !== o.from) closeFlyout(); // one invitation at a time
    emitState();
    return out;
  }

  /* ---- Styles: one sheet, adopted by every shadow root ---- */
  const CSS = `
:host{all:initial;display:block;width:100%;min-width:0;align-self:stretch;grid-column:1/-1}
:host([hidden]){display:none!important}
:host([variant=flyout]){position:fixed;z-index:900;right:max(16px,var(--sm-rail,6vw));bottom:var(--smc-lift,clamp(16px,2vw,28px));width:min(400px,calc(100vw - 32px));transition:bottom var(--sm-move,280ms) var(--sm-ease,ease)}
*,::before,::after{box-sizing:border-box}
*{transition:color var(--t),background-color var(--t),box-shadow var(--t),border-color var(--t),outline-color var(--t),opacity var(--t),transform var(--t)}
.root{--face:var(--sm-face,"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);--lime:var(--sm-lime,#82bd4a);--pill:var(--sm-pill,999px);--move:var(--sm-move,280ms);--ease:var(--sm-ease,cubic-bezier(.2,.6,.2,1));--t:var(--sm-quick,160ms) var(--ease);--fg:#fff;--fg2:hsla(0,0%,100%,.72);--fg3:hsla(0,0%,100%,.58);--fg8:hsla(0,0%,100%,.82);--hair:var(--sm-hair,hsla(0,0%,100%,.42));--stroke:var(--sm-stroke,hsla(0,0%,100%,.45));--ring:#fff;--brow:var(--lime);--solid:#fff;--on-solid:#000;--ph:hsla(0,0%,100%,.55);--lit:var(--lime);font:400 15px/1.5 var(--face);color:var(--fg);text-align:left;-webkit-font-smoothing:antialiased}
.root[data-register=light]{--fg:#000;--fg2:rgba(0,0,0,.68);--fg3:rgba(0,0,0,.6);--fg8:rgba(0,0,0,.82);--hair:rgba(0,0,0,.26);--stroke:rgba(0,0,0,.45);--ring:#000;--brow:rgba(0,0,0,.55);--solid:#000;--on-solid:#fff;--ph:#6b6b6b;--lit:#5f8f33;--edge:rgba(0,0,0,.45);-webkit-font-smoothing:auto}
button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
input{font:inherit;color:inherit;margin:0;border:0;-webkit-appearance:none;appearance:none}
h2{margin:0;font:inherit}
a{color:inherit}
:focus-visible{outline:2px solid var(--ring);outline-offset:3px}
.vh{position:absolute!important;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.hp{position:absolute;left:-10000px;width:1px;opacity:0}
.ic{display:inline-flex;flex:none}
.ic svg{display:block}
.stage{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"eyebrow" "head" "body" "lead" "rest"}
.form{display:contents}
.eyebrow{grid-area:eyebrow;margin-bottom:12px;font:600 13px/16px var(--face);letter-spacing:.2em;text-transform:uppercase;color:var(--brow)}
.head{grid-area:head;outline:0;text-wrap:balance}
.body{grid-area:body;margin-top:10px;max-width:46ch;color:var(--fg2);text-wrap:pretty}
.lead{grid-area:lead;margin-top:20px;min-width:0;container:smc-field/inline-size}
.rest{grid-area:rest;min-width:0}
.shell{display:flex;align-items:center;gap:8px;height:54px;padding:0 5px 0 22px;border-radius:var(--pill);background:#fff;box-shadow:inset 0 0 0 1px var(--edge,transparent);outline:2px solid transparent;outline-offset:3px}
.shell:focus-within,.shell.bad{outline-color:var(--ring)}
.field{flex:1;min-width:0}
.in{display:block;width:100%;height:44px;padding:0;outline:0;background:none;color:#000;caret-color:#000;font-size:16px;line-height:1.25}
.in::placeholder{color:#6b6b6b;opacity:1}
.in:-webkit-autofill{-webkit-box-shadow:0 0 0 40px #fff inset;-webkit-text-fill-color:#000}
.cta,.solid{display:inline-flex;align-items:center;justify-content:center;gap:10px;flex:none;border-radius:var(--pill);font:600 14px/1 var(--face);letter-spacing:.05em;white-space:nowrap}
.cta{height:44px;padding:0 18px 0 20px;background:#000;color:#fff}
.cta:hover{background:#222}
.cta:focus-visible{outline-color:#000;outline-offset:2px}
:is(.cta,.solid,.text-btn,.go):hover .ic{transform:translateX(3px)}
.busy .ic{display:none}
@container smc-field (max-width:359.98px){
.shell{height:auto;flex-direction:column;align-items:stretch;gap:10px;padding:0;background:none;box-shadow:none;outline:0}
.field{display:flex;align-items:center;flex:none;height:54px;padding:0 22px;border-radius:var(--pill);background:#fff;box-shadow:inset 0 0 0 1px var(--edge,transparent);outline:2px solid transparent;outline-offset:3px}
.field:focus-within,.bad .field{outline-color:var(--ring)}
.cta{height:54px;width:100%;padding:0 24px;background:var(--solid);color:var(--on-solid);box-shadow:inset 0 0 0 1px var(--solid)}
.cta:hover{background:none;color:var(--fg)}
.cta:focus-visible{outline-color:var(--ring);outline-offset:3px}
}
.check{position:relative;display:inline-flex;align-items:center;gap:12px;min-height:44px;margin-top:8px;padding-right:8px;font-size:14px;line-height:1.3;cursor:pointer;-webkit-user-select:none;user-select:none}
.check input{position:absolute;left:0;top:50%;width:20px;height:20px;margin-top:-10px;opacity:0;cursor:pointer}
.box{display:grid;place-items:center;flex:none;width:20px;height:20px;border-radius:4px;color:#000;box-shadow:inset 0 0 0 1px var(--stroke);outline:2px solid transparent;outline-offset:2px}
.box .ic{opacity:0;transform:scale(.8)}
.check:hover .box{box-shadow:inset 0 0 0 1px var(--fg)}
.check :checked+.box{background:var(--lime);box-shadow:inset 0 0 0 1px var(--lit)}
:checked+.box .ic{opacity:1;transform:none}
:focus-visible+.box,.bad .box{outline-color:var(--ring)}
.fine{margin-top:4px;font-size:12px;color:var(--fg3);text-wrap:pretty}
.fine a{color:var(--fg2);text-decoration-thickness:1px;text-underline-offset:2px}
.fine a:hover{color:var(--fg)}
.fine a:focus-visible{outline-offset:2px}
.msg{display:flex;gap:8px;margin-top:12px;font-size:13px;font-weight:500;line-height:1.4;color:var(--fg8)}
.msg:empty{display:none}
.msg .ic{margin-top:1px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-flex;align-items:center;min-height:40px;padding:0 calc(16px - .14em) 0 16px;border-radius:var(--pill);box-shadow:inset 0 0 0 1px var(--stroke);color:var(--fg8);font:700 11px/1 var(--face);letter-spacing:.14em;text-transform:uppercase}
.chip:hover{box-shadow:inset 0 0 0 1px var(--fg);color:var(--fg)}
.chip[aria-pressed=true]{background:var(--lime);color:#000;box-shadow:inset 0 0 0 1px var(--lit)}
.city{display:grid;gap:10px;margin-top:22px}
.lead>.city{margin-top:0}
.rest>.chips{margin-top:22px}
.lbl{font:700 11px/1 var(--face);letter-spacing:.14em;text-transform:uppercase;color:var(--fg2)}
.line{display:block;width:100%;height:54px;padding:0 24px;border-radius:var(--pill);background:none;caret-color:var(--fg);font-size:16px;line-height:1.25;box-shadow:inset 0 0 0 1px var(--stroke)}
.line::placeholder{color:var(--ph);opacity:1}
.line:hover{box-shadow:inset 0 0 0 1px var(--fg2)}
.line:focus{box-shadow:inset 0 0 0 1px var(--fg)}
.line::-webkit-calendar-picker-indicator{display:none!important}
.line:-webkit-autofill{-webkit-text-fill-color:var(--fg)}
.actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px 22px;margin-top:22px}
.solid{height:54px;padding:0 26px 0 30px;background:var(--solid);color:var(--on-solid);box-shadow:inset 0 0 0 1px var(--solid)}
.solid:hover{background:none;color:var(--fg)}
.text-btn{display:inline-flex;align-items:center;gap:8px;min-width:44px;min-height:44px;padding:0 2px;border-radius:2px;font:700 12px/1 var(--face);letter-spacing:.14em;text-transform:uppercase;text-decoration:none}
.text-btn .t{padding:3px 0;border-bottom:1.5px solid var(--stroke)}
.text-btn:hover .t{border-color:var(--fg)}
.text-btn:focus-visible{outline-offset:2px}
.sms{margin-top:22px;max-width:40ch}
.sms p{margin:0 0 4px;color:var(--fg2);font-size:14px;line-height:1.45}
.stage.fade{opacity:0}
.stage.rise{animation:smc-rise var(--move) var(--ease) both}
@keyframes smc-rise{from{opacity:0;transform:translateY(6px)}}
.v-inline{--h:var(--sm-heading,clamp(30px,3.6vw,54px))}
.v-inline .frame{padding-block:var(--sm-section,clamp(56px,5vw,88px))}
.v-inline[data-bleed] .frame{padding-inline:var(--sm-rail,max(var(--sm-gutter,6vw),calc((100% - 1380px) / 2)))}
.v-inline .inner{max-width:1380px;padding-top:clamp(28px,3vw,44px);border-top:1px solid var(--hair);container:smc-inline/inline-size}
.v-inline.no-rule .inner{padding-top:0;border-top:0}
.v-inline .eyebrow{margin-bottom:clamp(16px,1.6vw,22px)}
.v-inline .head{font:500 var(--h)/1.02 var(--sm-display,"Druk wide",sans-serif);letter-spacing:-.01em;text-transform:uppercase}
.v-inline .body{margin-top:clamp(14px,1.4vw,20px);max-width:44ch;font-size:clamp(15px,1.2vw,17px)}
.v-inline .lead{margin-top:clamp(26px,2.6vw,34px)}
@container smc-inline (min-width:900px){
.v-inline:not(.compact) .stage:not(.solo){grid-template-columns:minmax(0,11fr) minmax(0,9fr);column-gap:clamp(40px,5vw,96px);grid-template-areas:"eyebrow ." "head lead" "body rest"}
.v-inline:not(.compact) .stage:not(.solo) :is(.lead,.rest){justify-self:end;width:min(100%,520px)}
.v-inline:not(.compact) .stage:not(.solo) .lead{align-self:end;margin:0 0 calc(var(--h) * .2)}
.v-inline:not(.compact) .stage:not(.solo) .rest{margin-top:calc(var(--h) * -.2)}
}
:is(.v-flyout,.v-continue) .head{font:500 clamp(20px,2vw,24px)/1.1 var(--face);letter-spacing:-.01em}
:is(.v-flyout,.v-continue) .body{margin-top:8px}
.v-flyout .eyebrow{margin-bottom:10px}
.v-flyout .lead{margin-top:18px}
.v-flyout .stage>:first-child{padding-right:40px}
.v-continue{max-width:480px;padding-top:6px}
.v-footer-extras .extras{max-width:430px;padding-top:6px}
.card{position:relative;padding:22px;background:radial-gradient(120% 80% at 0 0,rgba(130,189,74,.1),transparent 60%),rgba(19,19,19,.94);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid var(--sm-edge,#2f2f2f);border-radius:var(--sm-radius,18px);box-shadow:0 24px 60px rgba(0,0,0,.45),inset 0 1px 0 hsla(0,0%,100%,.04);max-height:calc(100vh - 2 * clamp(16px,2vw,28px));max-height:calc(100dvh - var(--smc-lift,clamp(16px,2vw,28px)) - clamp(16px,2vw,28px));overflow-y:auto;overscroll-behavior:contain;opacity:0;transform:translateY(110%);transition:transform var(--t),opacity var(--t)}
.card.is-in{opacity:1;transform:none;transition-duration:var(--move)}
.card.is-in.away{opacity:0;transform:translateY(110%);visibility:hidden;transition:transform var(--t),opacity var(--t),visibility 0s linear var(--sm-quick,160ms)}
.x{position:absolute;top:8px;right:7px;z-index:1;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;color:var(--fg2)}
.x:hover{background:hsla(0,0%,100%,.12);color:#fff}
.x:focus-visible{outline-offset:-2px}
.peek{display:none;align-items:center;gap:10px}
.peek-head{flex:1;min-width:0;font-size:16px;font-weight:500;line-height:1.15;letter-spacing:-.01em;cursor:pointer;text-wrap:balance}
.go{display:inline-flex;align-items:center;flex:none;height:44px}
.go .pill{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 13px 0 16px;border-radius:var(--pill);background:#fff;color:#000;font-size:13px;font-weight:600;line-height:1;letter-spacing:.05em;white-space:nowrap}
.go:focus-visible{outline:0}
.go:focus-visible .pill{outline:2px solid #fff;outline-offset:3px}
.peek .x{position:static;flex:none;margin-right:-15px}
@media (max-width:767px),(max-height:500px){
:host([variant=flyout]){left:0;right:0;width:auto;bottom:var(--smc-lift,0px)}
.card{padding:14px 7vw calc(16px + env(safe-area-inset-bottom));max-height:85vh;max-height:85svh;overflow-y:auto;overscroll-behavior:contain;border:0;border-top:1px solid #262626;border-radius:var(--sm-radius,12px) var(--sm-radius,12px) 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.4)}
:host([data-lifted]) .card{padding-bottom:16px;border:1px solid var(--sm-edge,#2f2f2f);border-radius:var(--sm-radius,12px)}
.card>.x{top:0;right:calc(7vw - 15px)}
.is-peek{padding-top:10px;padding-bottom:calc(10px + env(safe-area-inset-bottom))}
.is-peek>.stage,.is-peek>.x{display:none}
.is-peek>.peek{display:flex}
}
@media (prefers-reduced-motion:reduce){
:host,*,::before,::after{transition-duration:1ms!important;animation-duration:1ms!important;animation-iteration-count:1!important}
.card,.stage,.ic{transform:none!important}
}
@media (forced-colors:active){
.shell,.cta,.solid,.chip,.line,.box,.go .pill{border:1px solid ButtonText}
.chip[aria-pressed=true],.check :checked+.box{forced-color-adjust:none;background:Highlight;color:HighlightText;border-color:Highlight}
.shell,.box{outline-style:none}
.shell:focus-within,.shell.bad,:focus-visible+.box,.bad .box{outline-style:solid}
@container smc-field (max-width:359.98px){
.shell{border:0}
.field{border:1px solid ButtonText;outline-style:none}
.field:focus-within,.bad .field{outline-style:solid}
}
}`;
  let sheet = null;
  function adopt(sr) {
    try {
      sheet = sheet || new CSSStyleSheet();
      if (!sheet.cssRules.length) sheet.replaceSync(CSS);
      sr.adoptedStyleSheets = [sheet];
    } catch {
      sr.append(h("style", { text: CSS }));
    }
  }

  /* ---- The element ---- */
  class SmCapture extends HTMLElement {
    connectedCallback() {
      ready.then(() => this._build());
    }
    disconnectedCallback() {
      if (this._off) this._off();
      this._off = null;
      if (io) io.unobserve(this);
      // Gone before its second in view: no impression.
      if (this._imp && this._imp.t) { clearTimeout(this._imp.t); this._imp.t = 0; }
    }
    _build() {
      if (killed || this.shadowRoot || !this.isConnected) return;
      const a = (n) => this.getAttribute(n) || "";
      const v = (this._v = VARIANTS.includes(a("variant")) ? a("variant") : "inline");
      if (v === "inline" && local.subscribed && !PREVIEW) { this.hidden = true; return; }
      this._ctx = CONTEXTS.includes(a("context")) ? a("context") : CTX;
      this._p = SLUG.test(a("placement")) ? a("placement") : v === "flyout" || v === "inline" ? v : "footer";
      this._ev = EVENT_SLUG.test(a("event")) ? a("event") : EVENT;
      this._c = merge(DEFAULTS.copy, cfg.copy);
      this._cc = merge(DEFAULTS.contexts[this._ctx] || {}, (cfg.contexts || {})[this._ctx]);
      const reg = /^(dark|light)$/.test(a("register")) ? a("register") : v === "inline" ? autoRegister(this) : "dark";
      const sr = this.attachShadow({ mode: "open" });
      adopt(sr);
      const root = (this._root = h("div", { class: "root v-" + v + (a("layout") === "compact" ? " compact" : "") + (a("rule") === "none" ? " no-rule" : ""), "data-register": reg }));
      this._stage = h("div", { class: "stage", id: "stage" });
      this._live = h("div", { class: "vh", "aria-live": "polite" });
      if (v === "inline") {
        root.append(h("div", { class: "frame" }, [h("div", { class: "inner" }, [this._stage])]));
        // The rail only applies when the host spans the page; inside a padded column it would double.
        const bleed = () => root.toggleAttribute("data-bleed", this.getBoundingClientRect().width >= document.documentElement.clientWidth - 2);
        bleed();
        if (window.ResizeObserver) { const ro = new ResizeObserver(bleed); ro.observe(this); this._off = () => ro.disconnect(); }
      } else if (v === "flyout") {
        this._flyout(root);
      } else if (v === "footer-extras") {
        this._f = { t0: Date.now() };
        root.append(h("div", { class: "extras" }, this._ageBlock()));
      } else {
        root.append(this._stage);
      }
      root.append(this._live);
      sr.append(root);
      if (v !== "footer-extras") {
        const d = this._smc || {};
        Object.assign(this, { _tok: d.token || "", _status: d.status || "subscribed", _geo: d.geo || null });
        this._show(v === "continue" ? (d.step === "done" || !this._tok ? "done" : "prefs") : "email", true);
        if (d.focus) this._focusHead();
      }
      if (v !== "continue") observeImp(this, this._p, this._ctx);
    }
    _t(extra) {
      return Object.assign({ p: this._p, c: this._ctx }, extra);
    }

    _flyout(root) {
      const c = this._c;
      const card = (this._card = h("div", { class: "card", role: "region", "aria-label": c.region }));
      const xBtn = () => {
        const b = h("button", { class: "x", type: "button", "aria-label": c.dismiss }, [icon("x")]);
        b.addEventListener("click", () => this._dismiss());
        return b;
      };
      card.append(xBtn(), this._stage);
      if (!cfg.flyout || cfg.flyout.mobileCollapsed !== false) {
        // Phones see one row until the person asks for more. The class is inert on wide screens.
        const go = h("button", { class: "go", type: "button", "aria-expanded": "false", "aria-controls": "stage" }, [h("span", { class: "pill" }, [h("span", { class: "cta-t", text: c.cta }), icon("arrow")])]);
        const head = h("span", { class: "peek-head", text: c.headline });
        const open = () => {
          if (!card.classList.contains("is-peek")) return;
          card.classList.remove("is-peek");
          go.setAttribute("aria-expanded", "true");
          this._rise();
          track("open", this._t());
          this._focusHead();
        };
        go.addEventListener("click", open);
        head.addEventListener("click", open);
        card.append(h("div", { class: "peek" }, [head, go, xBtn()]));
        card.classList.add("is-peek");
        this._stage.addEventListener("focusin", () => { if (!isMobile()) card.classList.remove("is-peek"); });
      }
      root.append(card);
      root.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { e.stopPropagation(); this._dismiss(); }
      });
      for (const t of ["pointerdown", "focusin", "keydown"]) this.addEventListener(t, () => { F.touched = true; });
      // Where focus came from, so closing can hand it back instead of dropping it on <body>.
      this.addEventListener("focusin", (e) => {
        const from = e.relatedTarget;
        if (from && from !== this && from.nodeType === 1 && !this.contains(from)) this._back = from;
      });
      this.addEventListener("focusout", () => setTimeout(() => {
        if (!this.isConnected || this.shadowRoot.activeElement) return;
        if (this._leave && F.host === this) closeFlyout();
        else if (this._place) this._place();
      }, 0));
      this._off = watchPlace(this);
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add("is-in")));
    }
    _dismiss() {
      local.dismissedAt = Date.now();
      saveLocal();
      track("dismiss", this._t());
      closeFlyout();
    }
    _out(done) {
      if (this._card) this._card.classList.remove("is-in");
      setTimeout(done, dur("quick", 160) + 30);
    }

    _show(step, first) {
      const st = this._stage;
      const hadFocus = !first && !!this.shadowRoot.activeElement;
      const build = () => {
        st.replaceChildren(...(step === "email" ? this._email() : step === "prefs" ? this._prefs() : this._done()));
        st.classList.toggle("solo", !st.querySelector(".lead, .rest"));
        this._root.setAttribute("data-step", step);
        if (!first) this._rise();
        if (hadFocus) this._focusHead();
        emitState();
      };
      if (first) return build();
      st.classList.add("fade");
      setTimeout(() => { st.classList.remove("fade"); build(); }, dur("quick", 160));
    }
    _rise() {
      this._stage.classList.remove("rise");
      void this._stage.offsetWidth;
      this._stage.classList.add("rise");
    }
    _focusHead() {
      const hd = this._stage.querySelector(".head");
      if (hd) hd.focus({ preventScroll: this._v === "flyout" });
    }
    _intro(head, body) {
      const brow = this._v !== "continue" && this._cc.eyebrow;
      return [brow && h("div", { class: "eyebrow", text: brow }), h("h2", { class: "head", tabindex: "-1", text: head }), body && h("div", { class: "body", text: body })].filter(Boolean);
    }
    // The age box, the two message slots and the fine print: shared by step 1 and the footer extras.
    _ageBlock() {
      const c = this._c, f = this._f;
      f.e1 = h("div", { class: "msg", id: "e1", "aria-live": "polite" });
      f.e2 = h("div", { class: "msg", id: "e2", "aria-live": "polite" });
      // aria-required, so the box is not announced as invalid before anyone has touched it.
      f.age = h("input", { type: "checkbox", id: "age", name: "age21", "aria-required": "true", "aria-describedby": "e2" });
      f.row = h("label", { class: "check", for: "age" }, [f.age, h("span", { class: "box", "aria-hidden": "true" }, [icon("check")]), h("span", { text: c.age })]);
      f.age.addEventListener("change", () => { if (f.age.checked) this._clear("age"); });
      const url = /^(\/(?!\/)|https:\/\/)/.test(str(cfg.privacyUrl, 300)) ? cfg.privacyUrl : "/privacy";
      const link = h("a", { href: url, target: "_blank", rel: "noopener" }, [c.privacy, h("span", { class: "vh", text: " " + c.newTab })]);
      return [f.e1, f.row, f.e2, h("div", { class: "fine" }, [c.fine + " ", link])];
    }
    _err(which, code) {
      const f = this._f, c = this._c;
      const text = { invalid_email: c.errEmail, age_required: c.errAge, bounced: c.errBounced, rejected: c.errRejected }[code] || c.errGeneric;
      (which === "age" ? f.e2 : f.e1).replaceChildren(icon("alert"), h("span", { text }));
      const bad = which === "age" ? [f.row, f.age] : which === "email" && f.shell ? [f.shell, f.input] : null;
      if (bad) { bad[0].classList.add("bad"); bad[1].setAttribute("aria-invalid", "true"); }
      track("err", this._t({ x: code }));
    }
    _clear(which) {
      const f = this._f;
      for (const [k, msg, box, ctl] of [["email", f.e1, f.shell, f.input], ["age", f.e2, f.row, f.age]]) {
        if (which && which !== k) continue;
        msg.textContent = "";
        if (box) { box.classList.remove("bad"); ctl.removeAttribute("aria-invalid"); }
      }
    }
    // Step 1 on every surface: validate, send, report. Resolves to the result, or null after showing an error.
    async _send(email, hp, input) {
      this._clear();
      if (!validEmail(email)) { this._err("email", "invalid_email"); if (input) input.focus(); return null; }
      if (!this._f.age.checked) { this._err("age", "age_required"); this._f.age.focus(); return null; }
      this._busy = true;
      track("submit", this._t());
      const r = await subscribe({ email, hp, placement: this._p, context: this._ctx, event: this._ev, elapsed: Date.now() - this._f.t0, from: this });
      this._busy = false;
      if (r.kind !== "error") return r;
      this._err(/^(invalid_email|bounced|rejected)$/.test(r.code) ? "email" : r.code === "age_required" ? "age" : "gen", r.code);
      return null;
    }
    async _footer(form) {
      if (this._busy || !this._f) return;
      const input = form.querySelector('input[name="EMAIL"]');
      const focus = form.contains(document.activeElement) || !!this.shadowRoot.activeElement;
      this.setAttribute("aria-busy", "true");
      const r = await this._send(normEmail(input && input.value), "", input);
      this.removeAttribute("aria-busy");
      if (!r) return;
      // Hand over: the Webflow form and its notes go (flagged: the site sets display:flex
      // !important on the form), and step 2 takes the slot.
      for (const n of [form, ...form.parentElement.querySelectorAll(".w-form-done, .w-form-fail")]) n.style.setProperty("display", "none", "important");
      const next = mk("continue", this._p, this._ctx);
      next._smc = { token: r.token, status: r.status, geo: r.geo, step: r.kind === "ok" ? "prefs" : "done", focus };
      form.insertAdjacentElement("afterend", next);
      this.remove();
    }
    _email() {
      const c = this._c, f = (this._f = { t0: Date.now() });
      f.input = h("input", { class: "in", id: "email", type: "email", name: "email", autocomplete: "email", inputmode: "email", autocapitalize: "off", spellcheck: "false", maxlength: "254", placeholder: c.emailPlaceholder, "aria-required": "true", enterkeyhint: "send", "aria-describedby": "e1" });
      const cta = h("button", { class: "cta", type: "submit" }, [h("span", { class: "cta-t", text: c.cta }), icon("arrow")]);
      const hp = h("input", { class: "hp", type: "text", name: "website", tabindex: "-1", autocomplete: "off", "aria-hidden": "true" });
      f.shell = h("div", { class: "shell" }, [h("label", { class: "vh", for: "email", text: c.emailLabel }), h("div", { class: "field" }, [f.input]), cta]);
      const form = h("form", { class: "form", novalidate: true }, [h("div", { class: "lead" }, [f.shell, hp]), h("div", { class: "rest" }, this._ageBlock())]);
      f.input.addEventListener("input", () => { if (f.shell.classList.contains("bad")) this._clear("email"); });
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (this._busy) return;
        const done = busy(cta, c.sending);
        const r = await this._send(normEmail(f.input.value), hp.value, f.input);
        done();
        if (!r) return;
        Object.assign(this, { _tok: r.token, _status: r.status, _geo: r.geo });
        this._show(r.kind === "ok" ? "prefs" : "done");
      });
      return this._intro(c.headline, this._cc.body || c.body).concat(form);
    }
    _prefs() {
      const c = this._c, pre = arr(this._cc.preselect);
      const chips = h("div", { class: "chips", role: "group", "aria-label": c.prefsHead });
      for (const it of arr(cfg.interests)) {
        if (!it || !INTERESTS.includes(it.id)) continue;
        const b = h("button", { class: "chip", type: "button", "data-id": it.id, "aria-pressed": String(pre.includes(it.id)), text: it.label || it.id });
        b.addEventListener("click", () => b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")));
        chips.append(b);
      }
      const city = h("input", { class: "line", id: "city", type: "text", name: "city", autocomplete: "address-level2", autocapitalize: "words", list: "cities", maxlength: "60", placeholder: c.cityPlaceholder });
      const names = new Map();
      for (const n of [this._geo && this._geo.city].concat(arr(c.cities))) {
        const k = str(n, 60).trim();
        if (k && !names.has(k.toLowerCase())) names.set(k.toLowerCase(), h("option", { value: k }));
      }
      const cityBox = h("div", { class: "city" }, [h("label", { class: "lbl", for: "city", text: c.cityLabel }), city, h("datalist", { id: "cities" }, [...names.values()])]);
      const go = h("button", { class: "solid", type: "submit" }, [h("span", { class: "cta-t", text: c.prefsCta }), icon("arrow")]);
      const skip = h("button", { class: "text-btn", type: "button" }, [h("span", { class: "t", text: c.skip })]);
      const cityFirst = this._ctx === "local";
      const form = h("form", { class: "form", novalidate: true }, [
        h("div", { class: "lead" }, [cityFirst ? cityBox : chips]),
        h("div", { class: "rest" }, [cityFirst ? chips : cityBox, h("div", { class: "actions" }, [go, skip])]),
      ]);
      const save = async (skipped) => {
        if (this._busy) return;
        this._busy = true;
        const picks = skipped ? [] : Array.from(chips.querySelectorAll('[aria-pressed="true"]'), (b) => b.getAttribute("data-id"));
        const raw = skipped ? "" : city.value.trim().slice(0, 60);
        track(skipped ? "prefs_skip" : "prefs_ok", this._t(skipped ? {} : { n: picks.length }));
        if (!skipped) busy(go, c.sending);
        const body = { v: 1, token: this._tok, interests: picks, city: /^[\p{L} .'-]+$/u.test(raw) ? raw : "", skipped, placement: this._p, context: this._ctx, sid: sess.sid };
        if (isDry()) body.dryRun = true;
        const r = this._tok ? await post("/soulmega-preferences", body) : {};
        const ok = r.status === 200 && r.json && r.json.ok;
        // The address is already in, so a failed save never blocks the confirmation.
        if (!ok) track("err", this._t({ x: (r.json && r.json.error) || "unavailable" }));
        this._picked = !!ok && !skipped && (picks.length > 0 || !!body.city);
        this._busy = false;
        this._show("done");
      };
      form.addEventListener("submit", (e) => { e.preventDefault(); save(false); });
      skip.addEventListener("click", () => save(true));
      track("prefs_view", this._t());
      return this._intro(c.prefsHead, c.prefsSub).concat(form);
    }
    _done() {
      const c = this._c, sms = cfg.sms || {}, done = c.done || {};
      // "We've got your picks" only when picks were actually saved.
      const sub = (this._status === "updated" && this._picked && done.updatedPicks) || done[this._status] || done.subscribed || "";
      const parts = this._intro(c.doneHead, sub);
      // Both switches must agree: the SMS program lists the context, and the context allows SMS.
      const smsOn = !!sms.enabled && /^https:\/\//.test(str(sms.url, 500)) && arr(sms.contexts).includes(this._ctx) && this._cc.sms === true;
      if (smsOn) {
        const a = h("a", { class: "text-btn", href: sms.url, target: "_blank", rel: "noopener" }, [h("span", { class: "t", text: c.smsCta }), icon("arrow"), h("span", { class: "vh", text: " " + c.newTab })]);
        a.addEventListener("click", () => track("sms_click", this._t()));
        parts.push(h("div", { class: "lead sms" }, [h("p", { text: c.smsLine }), a]));
      }
      this._live.textContent = c.doneHead + " " + sub;
      // The flyout bows out once the confirmation has been seen. An SMS offer stays until closed.
      if (this._v === "flyout" && !smsOn) setTimeout(() => this._autoClose(), 4000 + dur("quick", 160));
      return parts;
    }
    _autoClose() {
      if (F.host !== this) return;
      let kb = false;
      try { kb = !!this.shadowRoot.activeElement && this.shadowRoot.activeElement.matches(":focus-visible"); } catch { /* no :focus-visible */ }
      // Someone reading by keyboard keeps the confirmation until focus moves on.
      if (kb) this._leave = true;
      else closeFlyout();
    }
  }

  /* ---- Flyout: eligibility, trigger, lifecycle ---- */
  const isMobile = () => (MOBILE ? MOBILE.matches : innerWidth < 768);
  // The site footer, home of the other signup. While any of it is on screen the
  // flyout neither appears nor stays in view: one invitation at a time, and the
  // footer links (the end of the page, which cannot scroll out from under a
  // fixed card) stay reachable.
  function footerEl() {
    let form = null;
    try { form = document.querySelector(cfg.footer.selector); } catch { /* no footer config */ }
    return form ? form.closest(".footer") || form.closest("footer") || form.closest(".form-block") || form : document.querySelector(".footer");
  }
  function footerInView() {
    const f = footerEl(), r = f && f.getBoundingClientRect();
    return !!r && r.height > 0 && r.top < innerHeight - 1 && r.bottom > 0;
  }
  // Conditions that will not clear during this pageview (or not without another tab).
  function hardBlock() {
    const fo = cfg.flyout || {};
    syncLocal();
    syncSess();
    if (killed) return "killed";
    if (!fo.enabled) return "disabled";
    if (arr(fo.excludePaths).some((s) => { const r = rx(s); return !!r && r.test(PATH); })) return "path";
    if (local.subscribed) return "subscribed";
    if (local.dismissedAt && Date.now() - local.dismissedAt < nn(fo.dismissDays, 30) * DAY) return "dismissed";
    if ((local.ignored || 0) >= num(fo.maxIgnored, 3)) return "ignored";
    return sess.shown ? "shown" : null;
  }
  // Conditions that clear on their own: the show waits for them.
  function softBlock() {
    const now = Date.now(), shown = (el) => !!el && el.offsetHeight > 0 && getComputedStyle(el).display !== "none";
    for (const el of document.querySelectorAll("sm-capture[variant=inline]")) if (el.shadowRoot && !el.hidden && visibleRatio(el) >= 0.3) return "inline-in-view";
    if (footerInView()) return "footer-in-view";
    const ae = document.activeElement;
    if (ae && ae !== document.body && !ae.closest("sm-capture") && (ae.isContentEditable || /^(TEXTAREA|SELECT)$/.test(ae.tagName) || (ae.tagName === "INPUT" && !/^(checkbox|radio|button|submit|reset|range|color|file|image|hidden)$/i.test(ae.type)))) return "focus";
    if (now - F.lastType < 8000) return "typing";
    if (document.querySelector(".moose-menu-button.w--open") || shown(document.querySelector(".w-nav-overlay")) || getComputedStyle(document.documentElement).overflow === "hidden") return "menu";
    if (shown(document.querySelector(".w-lightbox-backdrop"))) return "lightbox";
    return now - F.lastOut < 60000 ? "outbound" : null;
  }
  function startFlyout() {
    const act = () => { F.lastAct = Date.now(); };
    for (const t of ["scroll", "pointerdown", "pointermove", "keydown", "touchstart", "wheel"]) addEventListener(t, act, { passive: true, capture: true });
    document.addEventListener("keydown", (e) => { if (!(e.target.closest && e.target.closest("sm-capture"))) F.lastType = Date.now(); }, true);
    document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(OUTBOUND)) F.lastOut = Date.now(); }, true);
    if (PREVIEW) { setTimeout(showFlyout, 1000); return; }
    if (hardBlock()) return;
    const fo = cfg.flyout;
    const timer = setInterval(() => {
      // Engaged time only counts while the tab is visible and the person did something in the last 15s.
      if (document.visibilityState === "visible" && Date.now() - F.lastAct < 15000) F.engaged++;
      const se = document.scrollingElement || document.documentElement, max = se.scrollHeight - innerHeight;
      const depth = max > 0 ? scrollY / max : 0;
      if (F.engaged >= nn(fo.engagedSeconds, 35) || (depth >= nn(fo.scrollDepth, 0.5) && (Date.now() - T0) / 1000 >= nn(fo.scrollMinSeconds, 15))) {
        clearInterval(timer);
        attemptShow();
      }
    }, 1000);
  }
  async function attemptShow() {
    clearTimeout(F.retry);
    if (hardBlock()) return;
    if (softBlock()) { F.retry = setTimeout(attemptShow, 2000); return; }
    // The flyout can come long after load: honour a kill switch flipped since then.
    if (!(await stillEnabled())) { kill(); return; }
    if (hardBlock()) return;
    if (softBlock()) F.retry = setTimeout(attemptShow, 2000);
    else showFlyout();
  }
  // Re-reads config.json (revalidating, so at most the CDN's five minutes stale).
  // Anything but an explicit enabled:false counts as still on.
  let lastCheck = 0;
  async function stillEnabled() {
    const url = cfg.configUrl;
    if (!url || Date.now() - lastCheck < 30000) return true;
    lastCheck = Date.now();
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 1500);
    try {
      const r = await fetch(new URL(url, location.href).href, { credentials: "omit", cache: "no-cache", signal: ctl.signal });
      const j = r.ok ? await r.json() : null;
      return !(isObj(j) && j.enabled === false);
    } catch {
      return true;
    } finally {
      clearTimeout(t);
    }
  }
  function kill() {
    killed = true;
    clearTimeout(F.retry);
    closeFlyout();
    emitState();
  }
  function showFlyout() {
    if (killed || F.host || !document.body) return;
    F.host = mk("flyout", "flyout", CTX);
    F.touched = false;
    F.shown = true;
    sess.shown = Date.now();
    saveSess();
    document.body.append(F.host);
    emitState();
  }
  function closeFlyout() {
    const el = F.host;
    if (!el) return;
    F.host = null;
    if (el._imp && el._imp.t) { clearTimeout(el._imp.t); el._imp.t = 0; }
    // Focus inside goes back where it came from, so a keyboard user keeps their place.
    if (el.shadowRoot && el.shadowRoot.activeElement) {
      const back = el._back;
      if (back && back.isConnected) try { back.focus({ preventScroll: true }); } catch { /* not focusable any more */ }
    }
    if (el._out) el._out(() => el.remove()); else el.remove();
    emitState();
  }
  // Lift above the /radio player dock while it shows, and step aside (hidden and
  // inert) while the site footer is on screen, unless focus is inside the card.
  function watchPlace(el) {
    let dock = null, mo = null, ro = null;
    const upd = () => {
      if (!dock && (dock = document.querySelector(".r-dock"))) {
        mo = new MutationObserver(upd);
        mo.observe(dock, { attributes: true, attributeFilter: ["class"] });
        if (window.ResizeObserver) { ro = new ResizeObserver(upd); ro.observe(dock); }
      }
      const tall = dock && dock.classList.contains("is-shown") ? dock.offsetHeight : 0;
      if (tall) el.style.setProperty("--smc-lift", tall + 12 + "px"); else el.style.removeProperty("--smc-lift");
      el.toggleAttribute("data-lifted", !!tall);
      const away = footerInView() && !(el.shadowRoot && el.shadowRoot.activeElement);
      if (away !== !!el._away) {
        el._away = away;
        el.inert = away;
        if (el._card) el._card.classList.toggle("away", away);
      }
    };
    el._place = upd;
    upd();
    addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd);
    return () => {
      removeEventListener("scroll", upd);
      removeEventListener("resize", upd);
      if (mo) mo.disconnect();
      if (ro) ro.disconnect();
    };
  }
  // A show left untouched for the whole pageview is "ignored"; maxIgnored of those count as a dismissal.
  function noteIgnored() {
    syncLocal();
    if (!F.shown || F.touched || F.counted || local.subscribed) return;
    F.counted = true;
    local.ignored = (local.ignored || 0) + 1;
    if (local.ignored >= num(cfg.flyout && cfg.flyout.maxIgnored, 3)) Object.assign(local, { dismissedAt: Date.now(), ignored: 0 });
    saveLocal();
  }

  /* ---- Mounting ---- */
  function mk(variant, placement, context, layout, rule) {
    const el = document.createElement("sm-capture");
    el.setAttribute("variant", variant);
    el.setAttribute("placement", placement);
    el.setAttribute("context", context);
    if (layout === "wide" || layout === "compact") el.setAttribute("layout", layout);
    // rule:false in a placement drops the top hairline where the page already draws one.
    if (rule === false) el.setAttribute("rule", "none");
    if (EVENT) el.setAttribute("event", EVENT);
    return el;
  }
  function mountPlacements(retry) {
    let missed = false;
    for (const p of arr(cfg.placements)) {
      const m = p && p.enabled !== false && SLUG.test(p.id || "") && rx(p.match);
      if (!m || !m.test(PATH) || document.querySelector('sm-capture[placement="' + p.id + '"]')) continue;
      let all = [];
      try { all = document.querySelectorAll(p.selector); } catch { continue; }
      const target = p.pick === "last" ? all[all.length - 1] : all[0];
      if (!target) { missed = true; continue; }
      const pos = ["beforebegin", "afterend", "beforeend", "afterbegin"].includes(p.position) ? p.position : "afterend";
      target.insertAdjacentElement(pos, mk("inline", p.id, CONTEXTS.includes(p.context) ? p.context : CTX, p.layout, p.rule));
    }
    for (const d of document.querySelectorAll("[data-sm-cap]")) {
      const id = d.getAttribute("data-sm-cap"), ctx = d.getAttribute("data-context");
      if (d._smc || !SLUG.test(id || "")) continue;
      d._smc = true;
      d.append(mk("inline", id, CONTEXTS.includes(ctx) ? ctx : CTX));
    }
    // /radio and the events list are built by page script: look once more.
    if (missed && !retry) setTimeout(() => mountPlacements(true), 1500);
  }
  function enhanceFooter() {
    let form = null;
    try { form = cfg.footer && cfg.footer.enhance && document.querySelector(cfg.footer.selector); } catch { return; }
    if (!form || form._smc) return;
    form._smc = true;
    const extras = mk("footer-extras", "footer", CTX);
    form.insertAdjacentElement("afterend", extras);
    // Capture phase on the form itself, so Webflow's own handler never sends.
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (extras.isConnected) extras._footer(form);
    }, true);
  }

  /* ---- Boot ---- */
  function init() {
    if (killed) { booted = true; emitState(); return; }
    PATH = (cfg.lab && /^\//.test(cfg.path || "") ? cfg.path : location.pathname).replace(/(.)\/+$/, "$1").slice(0, 200) || "/";
    const route = arr(cfg.routes).find((r) => r && CONTEXTS.includes(r.context) && rx(r.match) && rx(r.match).test(PATH));
    CTX = route ? route.context : "home";
    const ev = (document.querySelector("[data-sm-event]") || { getAttribute: () => "" }).getAttribute("data-sm-event");
    EVENT = EVENT_SLUG.test(ev || "") ? ev : "";
    const q = new URLSearchParams(location.search);
    if (q.get("sm_cap") === "reset") resetStore();
    PREVIEW = q.get("sm_cap") === "preview";
    const l = store("localStorage", "smcap:v1");
    if (isObj(l)) local = Object.assign(local, l);
    const s = store("sessionStorage", "smcap:s");
    if (s && /^[a-z0-9]{16}$/.test(s.sid)) sess = Object.assign(sess, s);
    sess.pv = (sess.pv | 0) + 1;
    saveSess();
    if (q.get("sm_sub") === "1" || q.has("mc_eid")) {
      local.subscribed = Date.now();
      saveLocal();
      if (q.has("sm_sub")) {
        // Drop only sm_sub; every other parameter keeps its original bytes.
        const keep = location.search.slice(1).split("&").filter((kv) => {
          try { return kv && decodeURIComponent(kv.split("=")[0].replace(/\+/g, " ")) !== "sm_sub"; } catch { return true; }
        }).join("&");
        try { history.replaceState(history.state, "", location.pathname + (keep ? "?" + keep : "") + location.hash); } catch { /* sandboxed frame */ }
      }
    }
    ft = firstTouch();
    SRC = ft.src || "direct";
    track("pv");
    setInterval(flush, 5000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
    addEventListener("pagehide", () => { noteIgnored(); flush(); });
    // Another tab subscribed or dismissed, or Back restored this page from the cache.
    addEventListener("storage", (e) => { if (!e.key || /^smcap:/.test(e.key)) recheck(); });
    addEventListener("pageshow", (e) => { if (e.persisted) recheck(); });
    if (PATH === "/") {
      // The age gate: no UI. Note the moment someone walks through.
      document.addEventListener("click", (e) => {
        if (e.target.closest && e.target.closest('a[href="/home-enter"]')) { local.gate = Date.now(); saveLocal(); }
      }, true);
    } else {
      if (!local.subscribed || PREVIEW) mountPlacements(false);
      enhanceFooter();
      startFlyout();
    }
    booted = true;
    emitState();
  }
  // Re-read storage; a flyout still at step 1 leaves if this visitor has since subscribed or dismissed.
  function recheck() {
    const why = hardBlock();
    const h = F.host, step = h && h._root && h._root.getAttribute("data-step");
    if (h && !PREVIEW && step === "email" && (why === "subscribed" || why === "dismissed")) closeFlyout();
    emitState();
  }
  function resetStore() {
    for (const [a, k] of [["localStorage", "smcap:v1"], ["localStorage", "smcap:ft"], ["sessionStorage", "smcap:s"]]) store(a, k, null);
    local = { subscribed: 0, dismissedAt: 0, ignored: 0, gate: 0 };
    sess = { sid: rid(), shown: 0, pv: 0 };
  }

  const domReady = new Promise((r) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", r, { once: true }) : r()));
  const ready = Promise.all([loadConfig(), domReady]).then(() => {
    try { init(); } catch (err) { killed = booted = true; try { console.warn("sm-capture: init failed", err); } catch { /* no console */ } }
  });
  if (window.customElements && document.head.attachShadow && !customElements.get("sm-capture")) customElements.define("sm-capture", SmCapture);

  window.SoulMegaCapture = {
    version: VERSION,
    get config() { return cfg; },
    ready,
    open() { return ready.then(() => { if (PATH !== "/") showFlyout(); return state(); }); },
    close() { closeFlyout(); return state(); },
    reset() { resetStore(); saveSess(); emitState(); return state(); },
    state,
    mount(el, attrs) {
      const a = isObj(attrs) ? attrs : {};
      const node = mk(a.variant || "inline", a.placement || "inline", a.context || CTX, a.layout);
      for (const k of ["register", "event"]) if (typeof a[k] === "string") node.setAttribute(k, a[k]);
      (el && el.nodeType === 1 ? el : document.body).append(node);
      return node;
    },
    track(e, data) { track(e, data); },
  };
})();
