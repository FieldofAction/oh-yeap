// Markus is called from soulmega.com, so both of its endpoints share one
// origin allowlist.

const ALLOWED_ORIGINS = [
  /^https:\/\/(www\.)?soulmega\.com$/,
  /^https:\/\/[a-z0-9-]+\.webflow\.io$/,
  /^http:\/\/localhost(:\d+)?$/,
];

export function cors(req, res) {
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
