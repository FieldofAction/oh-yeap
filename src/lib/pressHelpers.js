// Shared helpers for Press tools (Nest Compositor, Nest Reel, future siblings).
//
// Visual constants resolve through the host site's CSS variables — chrome
// follows the active theme. Photo-derived colors (frameColor, etc.) are
// computed and applied per-tool to the canvas asset itself.

// ---------- visual constants ----------

export const PaperBg = "var(--bg)";
export const Ink = "var(--fg)";
export const Muted = "var(--fm)";
export const Hairline = "var(--bd)";
export const Surface = "var(--sf)";
export const labelStyle = {
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
};

// ---------- color helpers ----------

export const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
};

export const rgbToHex = (r, g, b) =>
  "#" +
  [r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("");

export const lerpRgb = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

export const toneShift = (rgb, { warmth = 0, lightness = 0 } = {}) => {
  let [r, g, b] = rgb;
  r += warmth * 18;
  b -= warmth * 18;
  r += lightness * 25;
  g += lightness * 25;
  b += lightness * 25;
  return [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))));
};

// ---------- dominant color extraction ----------
// Bucketed dominant-color extraction over raw ImageData. Two-pass filter:
// first prefer saturated mid-tones (real "color"), fall back to anything
// non-extreme. Returns a sensible warm beige if both passes fail (the field
// then tones via warmth/lightness sliders).

export const dominantFromImageData = (data) => {
  const tally = (filter) => {
    const buckets = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      if (!filter(r, g, b)) continue;
      const key = `${Math.round(r / 28)},${Math.round(g / 28)},${Math.round(b / 28)}`;
      if (!buckets[key]) buckets[key] = { count: 0, r: 0, g: 0, b: 0 };
      buckets[key].count++;
      buckets[key].r += r;
      buckets[key].g += g;
      buckets[key].b += b;
    }
    let best = null;
    for (const v of Object.values(buckets)) if (!best || v.count > best.count) best = v;
    return best;
  };

  let best = tally((r, g, b) => {
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    if (max - min < 22) return false;
    if (max < 35 || min > 225) return false;
    return true;
  });
  if (!best)
    best = tally((r, g, b) => {
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      return max > 25 && min < 235;
    });
  if (!best) return [200, 190, 175];
  return [
    Math.round(best.r / best.count),
    Math.round(best.g / best.count),
    Math.round(best.b / best.count),
  ];
};

export const extractDominantColor = (img) => {
  const canvas = document.createElement("canvas");
  const size = 80;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  return dominantFromImageData(data);
};

// Cross-photo dominant: composites center-cropped tiles of every photo onto
// one canvas, then runs the same bucket tally. Picks the strongest actual
// color across the set rather than averaging per-photo dominants (which
// produces muddy midpoints when photos sit on opposite sides of the wheel).
export const extractDominantFromImages = (images) => {
  if (!images.length) return [225, 215, 200];
  if (images.length === 1) return extractDominantColor(images[0]);
  const tile = 80;
  const composite = document.createElement("canvas");
  composite.width = tile * images.length;
  composite.height = tile;
  const ctx = composite.getContext("2d");
  images.forEach((img, i) => {
    const srcSize = Math.min(img.width, img.height);
    const sx = (img.width - srcSize) / 2;
    const sy = (img.height - srcSize) / 2;
    ctx.drawImage(img, sx, sy, srcSize, srcSize, i * tile, 0, tile, tile);
  });
  const { data } = ctx.getImageData(0, 0, composite.width, composite.height);
  return dominantFromImageData(data);
};

// ---------- photo loading ----------

export const extractNumberFromName = (filename) => {
  const base = (filename || "").replace(/\.[^.]+$/, "");
  const match = base.match(/(\d{1,5})/);
  return match ? match[1].padStart(3, "0") : base.slice(0, 8).toLowerCase();
};

// Load a File (from drop/upload) and downscale to maxDim. Extracts dominant
// color and pulls a number out of the filename for auto-credits.
export const loadAndDownscale = (file, maxDim = 1500) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            const url = URL.createObjectURL(blob);
            const finalImg = new Image();
            finalImg.onload = () => {
              const color = extractDominantColor(finalImg);
              resolve({
                url,
                image: finalImg,
                color,
                name: file.name,
                number: extractNumberFromName(file.name),
                contributor: "",
              });
            };
            finalImg.onerror = reject;
            finalImg.src = url;
          },
          "image/jpeg",
          0.88
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Load an image from a URL (e.g., a path in /public/media/posts/). Same
// downscale + color extraction as loadAndDownscale, but for images already
// served by the site rather than picked from the user's filesystem. Pass
// `meta` to attach the post number and contributor handle directly (skips
// the filename-digit heuristic).
export const loadFromUrl = (url, meta = {}, maxDim = 1500) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const finalImg = new Image();
          finalImg.onload = () => {
            const color = extractDominantColor(finalImg);
            // Number resolution:
            //   - explicit string in meta.n (including empty "") wins as-is,
            //     so unnumbered archives like NYC don't render as "№ 000"
            //   - explicit number gets zero-padded
            //   - null/undefined falls back to filename digit extraction
            const number =
              typeof meta.n === "string"
                ? meta.n
                : meta.n != null
                ? String(meta.n).padStart(3, "0")
                : extractNumberFromName(url);
            resolve({
              url: blobUrl,
              image: finalImg,
              color,
              name: url.split("/").pop(),
              number,
              contributor: meta.by || "",
            });
          };
          finalImg.onerror = reject;
          finalImg.src = blobUrl;
        },
        "image/jpeg",
        0.88
      );
    };
    img.onerror = reject;
    img.src = url;
  });

// ---------- canvas drawing ----------

// Center-crop and draw a photo as a square at (x, y) with given size.
export const drawPhotoSquare = (ctx, image, x, y, size) => {
  const srcSize = Math.min(image.width, image.height);
  const sx = (image.width - srcSize) / 2;
  const sy = (image.height - srcSize) / 2;
  ctx.drawImage(image, sx, sy, srcSize, srcSize, x, y, size, size);
};

// Cover-fit a photo into an arbitrary rectangle (any aspect). Center-crops
// the source to match the target aspect, scales to fill. Used by Title for
// full-bleed city photos and by Nested when a non-square layer holds a photo.
export const drawPhotoCover = (ctx, image, x, y, w, h) => {
  const targetAspect = w / h;
  const sourceAspect = image.width / image.height;
  let sx, sy, sw, sh;
  if (sourceAspect > targetAspect) {
    sh = image.height;
    sw = image.height * targetAspect;
    sx = (image.width - sw) / 2;
    sy = 0;
  } else {
    sw = image.width;
    sh = image.width / targetAspect;
    sx = 0;
    sy = (image.height - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
};

// ---------- layout positions ----------
// Returns an array of {x, y, size} for each photo slot in the given layout.
// Base sizes are tuned to feel "rested" — not filling the field. photoScale
// multiplies (range ~0.8 to 1.15 in compositor, ~0.6 to 1.1 in reel).
//
// Layouts:
//   single     — 1 photo centered
//   juxtapose  — 2 photos: side-by-side in 1:1/16:9, stacked in 9:16
//   synthesis  — 3 photos: horizontal in 1:1/16:9, vertical in 9:16
//   mark       — no photos (logo panel) — returns empty array

export const layoutPositions = (layout, aspect, photoScale = 1.0) => {
  const W = aspect === "16:9" ? 1920 : 1080;
  const H = aspect === "9:16" ? 1920 : aspect === "16:9" ? 1080 : 1080;
  // Vertical layouts stack photos top-to-bottom; landscape layouts (1:1
  // and 16:9) lay them out side-by-side.
  const isVertical = aspect === "9:16";

  if (layout === "single") {
    const base = aspect === "16:9" ? 820 : 720;
    const s = Math.round(base * photoScale);
    return [{ x: (W - s) / 2, y: (H - s) / 2, size: s }];
  }

  if (layout === "juxtapose") {
    if (!isVertical) {
      // 1:1 or 16:9 → side-by-side
      const base = aspect === "16:9" ? 600 : 410;
      const gapBase = aspect === "16:9" ? 60 : 40;
      const s = Math.round(base * photoScale);
      const gap = Math.round(gapBase * photoScale);
      const totalW = s * 2 + gap;
      const x1 = (W - totalW) / 2;
      const y = (H - s) / 2;
      return [
        { x: x1, y, size: s },
        { x: x1 + s + gap, y, size: s },
      ];
    }
    // 9:16 → stacked
    const base = 740;
    const s = Math.round(base * photoScale);
    const gap = Math.round(80 * photoScale);
    const totalH = s * 2 + gap;
    const x = (W - s) / 2;
    const y1 = (H - totalH) / 2;
    return [
      { x, y: y1, size: s },
      { x, y: y1 + s + gap, size: s },
    ];
  }

  if (layout === "synthesis") {
    if (!isVertical) {
      // 1:1 or 16:9 → horizontal triptych
      const base = aspect === "16:9" ? 380 : 280;
      const gapBase = aspect === "16:9" ? 50 : 40;
      const s = Math.round(base * photoScale);
      const gap = Math.round(gapBase * photoScale);
      const totalW = s * 3 + gap * 2;
      const x1 = (W - totalW) / 2;
      const y = (H - s) / 2;
      return [
        { x: x1, y, size: s },
        { x: x1 + s + gap, y, size: s },
        { x: x1 + (s + gap) * 2, y, size: s },
      ];
    }
    // 9:16 → vertical stack
    const base = 490;
    const s = Math.round(base * photoScale);
    const gap = Math.round(60 * photoScale);
    const totalH = s * 3 + gap * 2;
    const x = (W - s) / 2;
    const y1 = (H - totalH) / 2;
    return [
      { x, y: y1, size: s },
      { x, y: y1 + s + gap, size: s },
      { x, y: y1 + (s + gap) * 2, size: s },
    ];
  }

  return [];
};

// Photo counts per layout. Spread templates (monument, bleed, title, stack,
// nested, rings) are the asymmetric / type-driven family — see NestCompositor.
export const requiredFor = (layout) =>
  ({
    single: 1,
    juxtapose: 2,
    synthesis: 3,
    mark: 0,
    monument: 1,
    bleed: 1,
    title: 2,
    stack: 2,
    nested: 2,
    rings: 2,
  }[layout] ?? 1);

// Layouts that drive their own renderer rather than the position-array path.
// Monument: massive "NEST" overlay + small photo anchor + dominant field.
// Bleed: 50/50 split — photo full-bleed on one side, type+field on the other.
// Title: city photo full-bleed + architectural type + Patio Beach inset.
// Stack: two photos as discrete rectangles on the field, small nested over
// big, type inside small photo. Field stays visible — nothing full-bleed.
// Nested: three concentric squares — field (outer) → NYC (middle) →
// Patio Beach (inner). All centered. Russian-doll grammar; type lives
// inside the innermost (Patio Beach) photo.
// Rings: five concentric squares (canvas + 4 inner). Each ring picks
// from {color, NYC, Patio Beach}. Repetition allowed; depth is the move.
export const SPREAD_LAYOUTS = new Set(["monument", "bleed", "title", "stack", "nested", "rings"]);

// Build a flat pool of {path, n, by} from the Patio Beach MONTHS data
// structure (exported from src/components/PatioBeach.jsx). Filters out
// non-image extensions so videos in the archive don't slip in.
export const buildPatioBeachPool = (months) => {
  const out = [];
  Object.values(months).forEach((month) => {
    month.posts.forEach((post) => {
      post.i.forEach((imgPath) => {
        if (!/\.(jpe?g|png|webp)$/i.test(imgPath)) return;
        out.push({
          path: "/" + imgPath.replace(/^\//, ""),
          n: post.n,
          by: post.by || "",
        });
      });
    });
  });
  return out;
};
