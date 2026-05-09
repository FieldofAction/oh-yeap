import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Upload,
  Download,
  X,
  Square,
  Columns,
  LayoutGrid,
  Type,
  RotateCcw,
  Image as ImageIcon,
  FolderOpen,
  Shuffle,
  Grid3x3,
  ArrowLeft,
  Star,
  Play,
  Pause,
  Video,
} from "lucide-react";
import {
  PaperBg,
  Ink,
  Muted,
  Hairline,
  Surface,
  labelStyle,
  hexToRgb,
  rgbToHex,
  toneShift,
  extractDominantColor,
  extractDominantFromImages,
  loadAndDownscale,
  loadFromUrl,
  drawPhotoSquare,
  drawPhotoCover,
  layoutPositions,
  requiredFor,
  SPREAD_LAYOUTS,
  buildPatioBeachPool,
} from "../lib/pressHelpers";
import { MONTHS as PATIO_BEACH_MONTHS } from "./PatioBeach";
import { NYC_ARCHIVE } from "../data/nycArchive";

// Press · Nest Compositor — social asset generator for the Nest edition.
// Photo source defaults to the bundled Patio Beach archive (auto-connected
// from the same repo). Manual photo upload and external folder pool are
// available as alternative sources for non-archive work.

// ---------- spread template renderers ----------
// Spread layouts are the asymmetric / type-driven family — type acts as
// architecture, photos as anchors. Each template owns its own composition
// rules; the field color comes from the photo's dominant (same logic as
// other layouts) so it can still pick up the source's character.

// Mark scale lookup — applies to every layout that renders a "NEST" mark.
// Each layout still owns its own base size; this multiplier sits on top.
// "large" allows type to crop or bleed past edges per layout's own clamp.
const MARK_SCALE_MULT = { small: 0.7, medium: 1.0, large: 1.4 };
const markScaleMult = (params) => MARK_SCALE_MULT[params.markScale || "medium"];

// Mark anchor — 3×3 grid resolving to (x, y, halign, valign) for canvas
// positioning of the NEST type. Used by Nested to express Daniel's panel
// grammar (top-center monumental, bottom cropping, corner tag, etc.).
//   TL  TC  TR
//   ML  MC  MR
//   BL  BC  BR
const markAnchor = (position, W, H, margin = 60) => {
  let x, y, halign, valign;
  const c = (position || "MC").toUpperCase();
  if (c[1] === "L") { x = margin; halign = "left"; }
  else if (c[1] === "R") { x = W - margin; halign = "right"; }
  else { x = W / 2; halign = "center"; }
  if (c[0] === "T") { y = margin; valign = "top"; }
  else if (c[0] === "B") { y = H - margin; valign = "bottom"; }
  else { y = H / 2; valign = "middle"; }
  return { x, y, halign, valign };
};

// Caption (subtext) canvas-level positioning — the 4 named positions resolve
// to (x, y, align) tuples per the user's choice. All layouts paint their
// caption through this helper so the position parameter is consistent.
const captionAnchor = (position, W, H) => {
  const margin = 50;
  switch (position) {
    case "top-center":
      return { x: W / 2, y: margin + 10, align: "center" };
    case "upper-right":
      return { x: W - margin - 10, y: margin + 10, align: "right" };
    case "lower-left":
      return { x: margin + 10, y: H - margin, align: "left" };
    case "bottom-center":
    default:
      return { x: W / 2, y: H - margin, align: "center" };
  }
};

// Helper: paint a small caption on the canvas in tracked uppercase Plex Mono.
const paintCaption = (ctx, text, x, y, fontSize, inkRGB, opacity = 0.85, align = "left", spacing = 3) => {
  ctx.fillStyle = `rgba(${inkRGB}, ${opacity})`;
  ctx.font = `500 ${fontSize}px "IBM Plex Mono", monospace`;
  ctx.textBaseline = "middle";
  const t = text.toUpperCase();
  const widths = t.split("").map((ch) => ctx.measureText(ch).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + spacing * (t.length - 1);
  let cursor = align === "left" ? x : align === "right" ? x - totalW : x - totalW / 2;
  ctx.textAlign = "left";
  for (let i = 0; i < t.length; i++) {
    ctx.fillText(t[i], cursor, y);
    cursor += widths[i] + spacing;
  }
};

// Monument: dominant field, massive Playfair "NEST" centered (cropped at edges
// at large sizes), small photo anchored low-center as the focal break. Captures
// the Panic Room scalar inversion — biggest possible type framing the smallest
// possible subject.
const renderMonument = (ctx, params, W, H, inkRGB) => {
  const { photos, photoScale, markText, caption, showCaption, showCredits, defaultContributor } = params;
  const photo = photos[0];

  // Big NEST mark — readable but monumental, with a deliberate crop on the
  // outer glyphs (Panic Room scalar inversion). Drawn only when the user
  // toggle markEnabled is on.
  if (params.markEnabled !== false) {
    ctx.fillStyle = `rgb(${inkRGB})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let markSize = Math.round(W * 0.62 * markScaleMult(params));
    ctx.font = `700 ${markSize}px "Playfair Display", serif`;
    const text = (markText || "NEST").toUpperCase();
    const measured = ctx.measureText(text).width;
    const maxAllowed = W * (params.markScale === "large" ? 1.30 : 1.13);
    if (measured > maxAllowed) {
      markSize = Math.round(markSize * (maxAllowed / measured));
      ctx.font = `700 ${markSize}px "Playfair Display", serif`;
    }
    const markCy = params.aspect === "9:16" ? H * 0.40 : H * 0.42;
    ctx.fillText(text, W / 2, markCy);
  }

  // Small photo anchor, low-center
  if (photo) {
    const photoBase = params.aspect === "9:16" ? 360 : 280;
    const size = Math.round(photoBase * photoScale);
    const px = (W - size) / 2;
    const py = params.aspect === "9:16" ? H - size - 160 : H - size - 110;
    drawPhotoSquare(ctx, photo.image, px, py, size);

    if (showCredits) {
      const num = photo.number || "";
      const ctb = (photo.contributor || defaultContributor || "").trim();
      if (num || ctb) {
        const fs = Math.max(11, Math.min(16, Math.round(size / 24)));
        ctx.font = `400 ${fs}px "IBM Plex Mono", monospace`;
        ctx.fillStyle = `rgba(${inkRGB}, 0.78)`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const sep = num && ctb ? "  —  " : "";
        ctx.fillText(`${num ? `№ ${num}` : ""}${sep}${ctb}`, W / 2, py + size + 12);
      }
    }
  } else {
    const photoBase = params.aspect === "9:16" ? 360 : 280;
    const size = Math.round(photoBase * photoScale);
    const px = (W - size) / 2;
    const py = params.aspect === "9:16" ? H - size - 160 : H - size - 110;
    ctx.strokeStyle = `rgba(${inkRGB}, 0.3)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(px, py, size, size);
    ctx.setLineDash([]);
  }

  // Caption — respects user-chosen position
  if (showCaption && caption) {
    const fs = params.aspect === "9:16" ? 14 : 12;
    const anchor = captionAnchor(params.captionPosition, W, H);
    paintCaption(ctx, caption, anchor.x, anchor.y, fs, inkRGB, 0.78, anchor.align, 2);
  }
};

// Bleed: 50/50 split — photo full-bleed on one half, type+field on the other.
// 1:1 → photo-left, field-right. 9:16 → photo-top, field-bottom. Type lives
// in the field area as a structural element (Playfair 500, large but not
// monumental), with a small caption beneath it.
const renderBleed = (ctx, params, W, H, inkRGB, frameColor) => {
  const { photos, markText, caption, showCaption, showCredits, defaultContributor } = params;
  const photo = photos[0];
  // Vertical aspect (9:16) splits top/bottom; landscape (1:1, 16:9) split L/R.
  const isVertical = params.aspect === "9:16";

  const photoX = 0;
  const photoY = 0;
  const photoW = isVertical ? W : W / 2;
  const photoH = isVertical ? H / 2 : H;

  if (photo) {
    const srcSize = Math.min(photo.image.width, photo.image.height);
    const sx = (photo.image.width - srcSize) / 2;
    const sy = (photo.image.height - srcSize) / 2;
    // For non-square crop: scale the source to fill the half. We use cover-fit:
    // crop more aggressively so the half-rect is fully filled.
    const targetAspect = photoW / photoH;
    const sourceAspect = 1; // we centered to square already; use source as if square
    let drawSx, drawSy, drawSw, drawSh;
    if (targetAspect > sourceAspect) {
      drawSw = srcSize;
      drawSh = srcSize / targetAspect;
      drawSx = sx;
      drawSy = sy + (srcSize - drawSh) / 2;
    } else {
      drawSh = srcSize;
      drawSw = srcSize * targetAspect;
      drawSx = sx + (srcSize - drawSw) / 2;
      drawSy = sy;
    }
    ctx.drawImage(photo.image, drawSx, drawSy, drawSw, drawSh, photoX, photoY, photoW, photoH);
  } else {
    ctx.fillStyle = `rgba(${inkRGB}, 0.06)`;
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.strokeStyle = `rgba(${inkRGB}, 0.25)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(photoX + 8, photoY + 8, photoW - 16, photoH - 16);
    ctx.setLineDash([]);
  }

  // Type block in the field side
  ctx.fillStyle = `rgb(${inkRGB})`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const fieldX = isVertical ? 0 : W / 2;
  const fieldY = isVertical ? H / 2 : 0;
  const fieldW = isVertical ? W : W / 2;
  const fieldH = isVertical ? H / 2 : H;

  // NEST mark — Playfair 500. Drawn only when markEnabled toggle is on.
  const padding = isVertical ? 80 : 60;
  const markX = fieldX + padding;
  if (params.markEnabled !== false) {
    const baseMarkProp = isVertical ? 0.18 : 0.32;
    let markSize = Math.round(fieldW * baseMarkProp * markScaleMult(params));
    ctx.font = `700 ${markSize}px "Playfair Display", serif`;
    const markY = fieldY + fieldH * 0.55;
    ctx.fillText((markText || "NEST").toUpperCase(), markX, markY);
  }

  // Caption — respects user-chosen position (canvas-level)
  if (showCaption && caption) {
    const captionFs = isVertical ? 15 : 13;
    const anchor = captionAnchor(params.captionPosition, W, H);
    paintCaption(
      ctx,
      caption,
      anchor.x,
      anchor.y,
      captionFs,
      inkRGB,
      0.78,
      anchor.align,
      2
    );
  }

  // Photo credit (number + contributor) in the field corner
  if (showCredits && photo) {
    const num = photo.number || "";
    const ctb = (photo.contributor || defaultContributor || "").trim();
    if (num || ctb) {
      const fs = isVertical ? 13 : 11;
      ctx.font = `400 ${fs}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = `rgba(${inkRGB}, 0.7)`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      const sep = num && ctb ? "  —  " : "";
      ctx.fillText(
        `${num ? `№ ${num}` : ""}${sep}${ctb}`,
        markX,
        fieldY + fieldH - padding
      );
    }
  }
};

// Title: city photo full-bleed (cover-fit) + architectural Playfair type at
// scale, lower-third, off-white with soft shadow + Patio Beach photo as a
// small inset "punctuation". This is the Panic Room titles register — type
// embedded in the urban environment, scalar inversion: monumental credit
// against the smallest possible subject.
const renderTitle = (ctx, params, W, H, inkRGB) => {
  const { photos, markText, caption, showCaption, showCredits, defaultContributor } = params;
  const cityPhoto = photos[0];
  const detailPhoto = photos[1];

  // Background — city full-bleed (cover-fit, center-crop)
  if (cityPhoto) {
    drawPhotoCover(ctx, cityPhoto.image, 0, 0, W, H);
  } else {
    ctx.strokeStyle = `rgba(${inkRGB}, 0.3)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(${inkRGB}, 0.45)`;
    ctx.font = `400 14px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CITY PHOTO · slot 1", W / 2, H / 2);
  }

  // Bottom darkening gradient — gives the type a quiet stage to land on
  // without obscuring the architecture above
  const gradStart = params.aspect === "9:16" ? H * 0.42 : H * 0.40;
  const grad = ctx.createLinearGradient(0, gradStart, 0, H);
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Architectural NEST type — Playfair 500. Drawn with `overlay` blend
  // mode so the letter strokes interact with the photo's tones. Drawn
  // only when markEnabled toggle is on.
  if (params.markEnabled !== false) {
    let markSize = Math.round(W * 0.62 * markScaleMult(params));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${markSize}px "Playfair Display", serif`;
    const text = (markText || "NEST").toUpperCase();
    const measured = ctx.measureText(text).width;
    const maxAllowed = W * (params.markScale === "large" ? 1.30 : 1.13);
    if (measured > maxAllowed) {
      markSize = Math.round(markSize * (maxAllowed / measured));
      ctx.font = `700 ${markSize}px "Playfair Display", serif`;
    }
    const markCy = params.aspect === "9:16" ? H * 0.62 : H * 0.66;
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.fillText(text, W / 2, markCy);
    ctx.restore();
  }

  // Patio Beach inset — small square in bottom-left, the punctuation that
  // ties the architectural credit back to the actual edition subject.
  const insetSize = params.aspect === "9:16" ? 220 : 180;
  const insetX = 60;
  const insetY = H - insetSize - (params.aspect === "9:16" ? 130 : 80);
  if (detailPhoto) {
    drawPhotoSquare(ctx, detailPhoto.image, insetX, insetY, insetSize);

    if (showCredits) {
      const num = detailPhoto.number || "";
      const ctb = (detailPhoto.contributor || defaultContributor || "").trim();
      if (num || ctb) {
        const fs = 11;
        ctx.font = `400 ${fs}px "IBM Plex Mono", monospace`;
        ctx.fillStyle = "rgba(245, 240, 230, 0.88)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const sep = num && ctb ? "  —  " : "";
        ctx.fillText(`${num ? `№ ${num}` : ""}${sep}${ctb}`, insetX, insetY + insetSize + 8);
        ctx.shadowBlur = 0;
      }
    }
  } else {
    ctx.strokeStyle = "rgba(245, 240, 230, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(insetX, insetY, insetSize, insetSize);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(245, 240, 230, 0.6)";
    ctx.font = `400 11px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PATIO BEACH", insetX + insetSize / 2, insetY + insetSize / 2 - 7);
    ctx.fillText("slot 2", insetX + insetSize / 2, insetY + insetSize / 2 + 7);
  }

  // Caption — respects user-chosen position (canvas-level)
  if (showCaption && caption) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    const anchor = captionAnchor(params.captionPosition, W, H);
    paintCaption(ctx, caption, anchor.x, anchor.y, 12, "245, 240, 230", 0.88, anchor.align, 2);
    ctx.shadowBlur = 0;
  }
};

// Stack: editorial-collage layering grammar. Field stays visible (photo-
// derived color from cross-photo dominant of both photos). Big photo
// rectangle offset on the field; small photo rectangle nested overlapping
// the big photo's lower-right area. "NEST" type lives INSIDE the small
// photo, sized to fit. Caption tucks under the type within the small photo.
// Nothing full-bleed — the field IS the structural ground.
const renderStack = (ctx, params, W, H, inkRGB) => {
  const { photos, markText, caption, showCaption, showCredits, defaultContributor } = params;
  const bigPhoto = photos[0];
  const smallPhoto = photos[1];
  // Vertical (9:16) sizes the rectangles relative to width so they fill
  // the narrow canvas; landscape (1:1, 16:9) sizes relative to height
  // since height is the constraining dimension.
  const isVertical = params.aspect === "9:16";
  const isCinematic = params.aspect === "16:9";

  // Big photo rectangle — offset toward upper-left so the field shows
  // generously at the bottom-right where the smaller photo will land.
  const bigSize = isVertical ? Math.round(W * 0.65) : Math.round(H * 0.55);
  const bigX = isCinematic ? Math.round(W * 0.18) : Math.round(W * 0.13);
  const bigY = isVertical ? Math.round(H * 0.20) : Math.round(H * 0.18);

  if (bigPhoto) {
    drawPhotoSquare(ctx, bigPhoto.image, bigX, bigY, bigSize);
  } else {
    ctx.strokeStyle = `rgba(${inkRGB}, 0.35)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(bigX, bigY, bigSize, bigSize);
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(${inkRGB}, 0.45)`;
    ctx.font = `400 13px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CITY · slot 1", bigX + bigSize / 2, bigY + bigSize / 2);
  }

  // Small photo rectangle — nested overlapping the big photo's lower-right.
  // Extends past the big photo to the right and bottom so the layering is
  // legible (you can see this is a discrete rectangle on top of the other,
  // not part of it).
  const smallSize = isVertical ? Math.round(W * 0.40) : Math.round(H * 0.32);
  const smallX = bigX + Math.round(bigSize * 0.55);
  const smallY = bigY + Math.round(bigSize * 0.55);

  if (smallPhoto) {
    drawPhotoSquare(ctx, smallPhoto.image, smallX, smallY, smallSize);
  } else {
    ctx.strokeStyle = `rgba(${inkRGB}, 0.4)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(smallX, smallY, smallSize, smallSize);
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(${inkRGB}, 0.5)`;
    ctx.font = `400 12px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DETAIL · slot 2", smallX + smallSize / 2, smallY + smallSize / 2);
  }

  // "NEST" type — drawn only when markEnabled toggle is on. Small/medium
  // stay inside the small photo; large bleeds past the small photo's
  // edges into the field.
  if (params.markEnabled !== false) {
    const text = (markText || "NEST").toUpperCase();
    const scale = params.markScale || "medium";
    const baseProp = scale === "large" ? 0.65 : scale === "small" ? 0.30 : 0.42;
    let markSize = Math.round(smallSize * baseProp);
    ctx.font = `700 ${markSize}px "Playfair Display", serif`;
    if (scale !== "large") {
      const innerPadding = Math.round(smallSize * 0.08);
      const targetWidth = smallSize - innerPadding * 2;
      const measured = ctx.measureText(text).width;
      if (measured > targetWidth) {
        markSize = Math.round(markSize * (targetWidth / measured));
        ctx.font = `700 ${markSize}px "Playfair Display", serif`;
      }
    }
    if (scale === "large") {
      const measured = ctx.measureText(text).width;
      const maxBleed = smallSize * 1.6;
      if (measured > maxBleed) {
        markSize = Math.round(markSize * (maxBleed / measured));
        ctx.font = `700 ${markSize}px "Playfair Display", serif`;
      }
    }
    ctx.fillStyle = "rgba(245, 240, 230, 0.96)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, smallX + smallSize / 2, smallY + smallSize * 0.42);
  }

  // Caption — respects user-chosen position (canvas-level, with shadow so
  // it reads against either field or photos depending on where it lands).
  if (showCaption && caption) {
    const fs = isVertical ? 13 : 11;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    const anchor = captionAnchor(params.captionPosition, W, H);
    // Use a contrast-friendly color that works on either field or photo
    const lum = 100; // assume dark-ish; light type with shadow
    paintCaption(ctx, caption, anchor.x, anchor.y, fs, "245, 240, 230", 0.88, anchor.align, 2);
    ctx.shadowBlur = 0;
  }

  // Per-photo credits (if enabled) for the small photo, just outside the
  // small photo's bottom edge in the field area.
  if (showCredits && smallPhoto) {
    const num = smallPhoto.number || "";
    const ctb = (smallPhoto.contributor || defaultContributor || "").trim();
    if (num || ctb) {
      const fs = 11;
      ctx.font = `400 ${fs}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = `rgba(${inkRGB}, 0.78)`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const sep = num && ctb ? "  —  " : "";
      ctx.fillText(
        `${num ? `№ ${num}` : ""}${sep}${ctb}`,
        smallX,
        smallY + smallSize + 12
      );
    }
  }
};

// Rings: five concentric squares (canvas + 4 inner). Each ring picks
// content from {color, NYC, Patio Beach}. Repetition allowed — depth is
// the move. Sizes progress outward at fixed proportions of the smaller
// canvas dimension. Type lives in the innermost ring by default (with
// the same 3×3 markPosition grid available).
const renderRings = (ctx, params, W, H, inkRGB) => {
  const {
    photos,
    frameColor,
    markText,
    caption,
    showCaption,
    showCredits,
    defaultContributor,
    ringContent,
  } = params;
  const layers = ringContent || ["color", "nyc", "patio", "nyc", "color"];
  const nycPhoto = photos[0];
  const pbPhoto = photos[1];

  const photoForContent = (content) => {
    if (content === "nyc") return nycPhoto;
    if (content === "patio") return pbPhoto;
    return null;
  };

  // Five rings sized as proportions of min(W, H). Outer is the canvas
  // itself; each subsequent ring shrinks inward.
  const minDim = Math.min(W, H);
  const RING_PROPORTIONS = [1.0, 0.78, 0.58, 0.38, 0.20];

  // Outer ring (canvas-fill)
  if (layers[0] !== "color") {
    const outerPhoto = photoForContent(layers[0]);
    if (outerPhoto) drawPhotoCover(ctx, outerPhoto.image, 0, 0, W, H);
  }

  // Inner rings 1-4 (decreasing size, all centered)
  for (let i = 1; i < 5; i++) {
    const size = Math.round(minDim * RING_PROPORTIONS[i]);
    const x = (W - size) / 2;
    const y = (H - size) / 2;
    const content = layers[i];
    if (content === "color") {
      ctx.fillStyle = `rgb(${frameColor[0]}, ${frameColor[1]}, ${frameColor[2]})`;
      ctx.fillRect(x, y, size, size);
    } else {
      const photo = photoForContent(content);
      if (photo) {
        drawPhotoSquare(ctx, photo.image, x, y, size);
      } else {
        // Placeholder dashed rect when photo missing for that content type
        ctx.strokeStyle = `rgba(${inkRGB}, 0.4)`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(x, y, size, size);
        ctx.setLineDash([]);
      }
    }
  }

  // Innermost ring dimensions for type sizing reference
  const innerSize = Math.round(minDim * RING_PROPORTIONS[4]);
  // Use ring 1 as the analogue of "middle" for large-mark cap
  const middleSize = Math.round(minDim * RING_PROPORTIONS[1]);
  const innerX = (W - innerSize) / 2;
  const innerY = (H - innerSize) / 2;

  // "NEST" type — same parametric system as Nested. Honors markEnabled
  // user toggle and showMark beat-cycle flicker.
  const markIsVisible = params.markEnabled !== false && params.showMark !== false;
  if (markIsVisible) {
    const text = (markText || "NEST").toUpperCase();
    const scale = params.markScale || "medium";
    const pos = (params.markPosition || "MC").toUpperCase();
    const isCenter = pos === "MC";

    let markSize;
    if (isCenter) {
      const baseProp = scale === "large" ? 0.62 : scale === "small" ? 0.30 : 0.42;
      markSize = Math.round(innerSize * baseProp);
    } else {
      const baseProp = scale === "large" ? 0.55 : scale === "small" ? 0.18 : 0.34;
      markSize = Math.round(W * baseProp);
    }
    ctx.font = `700 ${markSize}px "Playfair Display", serif`;
    const measured = ctx.measureText(text).width;

    if (isCenter && scale !== "large") {
      const innerPadding = Math.round(innerSize * 0.08);
      const targetWidth = innerSize - innerPadding * 2;
      if (measured > targetWidth) {
        markSize = Math.round(markSize * (targetWidth / measured));
        ctx.font = `700 ${markSize}px "Playfair Display", serif`;
      }
    } else if (isCenter && scale === "large") {
      const maxBleed = middleSize * 0.95;
      if (measured > maxBleed) {
        markSize = Math.round(markSize * (maxBleed / measured));
        ctx.font = `700 ${markSize}px "Playfair Display", serif`;
      }
    } else {
      const maxAllowed = scale === "large" ? W * 1.20 : W * 0.86;
      if (measured > maxAllowed) {
        markSize = Math.round(markSize * (maxAllowed / measured));
        ctx.font = `700 ${markSize}px "Playfair Display", serif`;
      }
    }

    const anchor = markAnchor(pos, W, H);
    ctx.fillStyle = "rgba(245, 240, 230, 0.96)";
    ctx.textAlign = anchor.halign;
    ctx.textBaseline = anchor.valign;
    ctx.fillText(text, anchor.x, anchor.y);
  }

  // Caption — canvas-anchored
  if (showCaption && caption) {
    const fs = 12;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    const captionA = captionAnchor(params.captionPosition, W, H);
    paintCaption(ctx, caption, captionA.x, captionA.y, fs, "245, 240, 230", 0.88, captionA.align, 2);
    ctx.shadowBlur = 0;
  }

  // Per-photo credit for Patio Beach photo (if it appears in any ring)
  if (showCredits && pbPhoto && layers.includes("patio")) {
    const num = pbPhoto.number || "";
    const ctb = (pbPhoto.contributor || defaultContributor || "").trim();
    if (num || ctb) {
      const fs = 11;
      ctx.font = `400 ${fs}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = "rgba(245, 240, 230, 0.85)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const sep = num && ctb ? "  —  " : "";
      ctx.fillText(`${num ? `№ ${num}` : ""}${sep}${ctb}`, innerX + innerSize / 2, innerY + innerSize + 12);
      ctx.shadowBlur = 0;
    }
  }
};

// Nested: three concentric square containers. Each container's content is
// parametric — picks from {color, NYC, Patio Beach} with the constraint
// that all three layers must have different content. Default grammar is
// outer=color, middle=NYC, inner=Patio Beach.
//
// Source slots: photos[0] = NYC, photos[1] = Patio Beach. Render reads
// containerContent[layer] to decide what to draw at each layer.
const renderNested = (ctx, params, W, H, inkRGB) => {
  const {
    photos,
    frameColor,
    markText,
    caption,
    showCaption,
    showCredits,
    defaultContributor,
    containerContent,
  } = params;
  const layers = containerContent || ["color", "nyc", "patio"];
  const nycPhoto = photos[0];
  const pbPhoto = photos[1];

  const photoForContent = (content) => {
    if (content === "nyc") return nycPhoto;
    if (content === "patio") return pbPhoto;
    return null;
  };
  const labelForContent = (content) =>
    content === "nyc" ? "NYC · slot 1" : content === "patio" ? "PATIO BEACH · slot 2" : "COLOR";

  // Three concentric squares sized by the smaller canvas dimension so they
  // stay proportional across all three aspects. Middle and inner sizes are
  // parametric — discrete S/M/L presets per Daniel's panel grammar (panels
  // ranged from ~50%–80% middle, ~16%–42% inner).
  const minDim = Math.min(W, H);
  const MIDDLE_PROPS = { small: 0.50, medium: 0.66, large: 0.82 };
  const INNER_PROPS = { small: 0.18, medium: 0.30, large: 0.44 };
  const middleSize = Math.round(
    minDim * (MIDDLE_PROPS[params.nestedMiddleSize || "medium"] ?? 0.66)
  );
  const innerSize = Math.round(
    minDim * (INNER_PROPS[params.nestedInnerSize || "medium"] ?? 0.30)
  );

  const middleX = (W - middleSize) / 2;
  const middleY = (H - middleSize) / 2;
  const innerX = (W - innerSize) / 2;
  const innerY = (H - innerSize) / 2;

  // Outer layer (canvas-fill): if a photo, cover-fit to canvas; if color,
  // the field paint already covers (no-op).
  if (layers[0] !== "color") {
    const outerPhoto = photoForContent(layers[0]);
    if (outerPhoto) {
      drawPhotoCover(ctx, outerPhoto.image, 0, 0, W, H);
    }
  }

  // Middle layer — square at center
  const middleContent = layers[1];
  const middlePhoto = photoForContent(middleContent);
  if (middleContent === "color") {
    ctx.fillStyle = `rgb(${frameColor[0]}, ${frameColor[1]}, ${frameColor[2]})`;
    ctx.fillRect(middleX, middleY, middleSize, middleSize);
  } else if (middlePhoto) {
    drawPhotoSquare(ctx, middlePhoto.image, middleX, middleY, middleSize);
  } else {
    ctx.strokeStyle = `rgba(${inkRGB}, 0.35)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(middleX, middleY, middleSize, middleSize);
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(${inkRGB}, 0.45)`;
    ctx.font = `400 13px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelForContent(middleContent), middleX + middleSize / 2, middleY + middleSize / 2 - 30);
  }

  // Inner layer — smaller square at center
  const innerContent = layers[2];
  const innerPhoto = photoForContent(innerContent);
  if (innerContent === "color") {
    ctx.fillStyle = `rgb(${frameColor[0]}, ${frameColor[1]}, ${frameColor[2]})`;
    ctx.fillRect(innerX, innerY, innerSize, innerSize);
  } else if (innerPhoto) {
    drawPhotoSquare(ctx, innerPhoto.image, innerX, innerY, innerSize);
  } else {
    ctx.strokeStyle = `rgba(${inkRGB}, 0.5)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(innerX, innerY, innerSize, innerSize);
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(${inkRGB}, 0.55)`;
    ctx.font = `400 12px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelForContent(innerContent), innerX + innerSize / 2, innerY + innerSize / 2);
  }

  // "NEST" type — anchored to a 3×3 grid (markPosition) and sized by
  // markScale. Drawn only when params.showMark !== false (Beat machine
  // cycles this on/off so the logo flickers periodically). When
  // showMark is undefined (live preview, batch render), defaults to
  // visible — so non-beat-driven renders look the same as before.
  const markIsVisible = params.markEnabled !== false && params.showMark !== false;
  if (markIsVisible) {
    const text = (markText || "NEST").toUpperCase();
    const scale = params.markScale || "medium";
    const pos = (params.markPosition || "MC").toUpperCase();
    const isCenter = pos === "MC";

    let markSize;
    if (isCenter) {
      const baseProp = scale === "large" ? 0.62 : scale === "small" ? 0.30 : 0.42;
      markSize = Math.round(innerSize * baseProp);
    } else {
      const baseProp = scale === "large" ? 0.55 : scale === "small" ? 0.18 : 0.34;
      markSize = Math.round(W * baseProp);
    }
    ctx.font = `700 ${markSize}px "Playfair Display", serif`;
    const measured = ctx.measureText(text).width;

    if (isCenter && scale !== "large") {
      const innerPadding = Math.round(innerSize * 0.08);
      const targetWidth = innerSize - innerPadding * 2;
      if (measured > targetWidth) {
        markSize = Math.round(markSize * (targetWidth / measured));
        ctx.font = `700 ${markSize}px "Playfair Display", serif`;
      }
    } else if (isCenter && scale === "large") {
      const maxBleed = middleSize * 0.95;
      if (measured > maxBleed) {
        markSize = Math.round(markSize * (maxBleed / measured));
        ctx.font = `700 ${markSize}px "Playfair Display", serif`;
      }
    } else {
      const maxAllowed = scale === "large" ? W * 1.20 : W * 0.86;
      if (measured > maxAllowed) {
        markSize = Math.round(markSize * (maxAllowed / measured));
        ctx.font = `700 ${markSize}px "Playfair Display", serif`;
      }
    }

    const anchor = markAnchor(pos, W, H);
    ctx.fillStyle = "rgba(245, 240, 230, 0.96)";
    ctx.textAlign = anchor.halign;
    ctx.textBaseline = anchor.valign;
    ctx.fillText(text, anchor.x, anchor.y);
  }

  // Caption — respects user-chosen position (canvas-level, with shadow)
  if (showCaption && caption) {
    const fs = 12;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    const anchor = captionAnchor(params.captionPosition, W, H);
    paintCaption(ctx, caption, anchor.x, anchor.y, fs, "245, 240, 230", 0.88, anchor.align, 2);
    ctx.shadowBlur = 0;
  }

  // Per-photo credit for the Patio Beach photo (always credited when used,
  // regardless of which layer it occupies). Anchored just below the inner
  // photo so it lands in the NYC ring or against the field — somewhere
  // visible without competing with the type.
  if (showCredits && pbPhoto && layers.includes("patio")) {
    const num = pbPhoto.number || "";
    const ctb = (pbPhoto.contributor || defaultContributor || "").trim();
    if (num || ctb) {
      const fs = 11;
      ctx.font = `400 ${fs}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = "rgba(245, 240, 230, 0.85)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const sep = num && ctb ? "  —  " : "";
      ctx.fillText(
        `${num ? `№ ${num}` : ""}${sep}${ctb}`,
        innerX + innerSize / 2,
        innerY + innerSize + 12
      );
      ctx.shadowBlur = 0;
    }
  }
};

// ---------- pure render ----------

const renderToCanvas = (canvas, params) => {
  const {
    layout,
    aspect,
    photos,
    frameColor,
    photoScale,
    caption,
    showCaption,
    showCredits,
    defaultContributor,
    markText,
    markSubtext,
    logoImage,
  } = params;

  // Aspect dimensions:
  //   1:1   → 1080 × 1080 (square)
  //   9:16  → 1080 × 1920 (vertical)
  //   16:9  → 1920 × 1080 (cinematic / Panic Room frame)
  const W = aspect === "16:9" ? 1920 : 1080;
  const H = aspect === "9:16" ? 1920 : aspect === "16:9" ? 1080 : 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = `rgb(${frameColor[0]}, ${frameColor[1]}, ${frameColor[2]})`;
  ctx.fillRect(0, 0, W, H);

  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = 200;
  grainCanvas.height = 200;
  const gctx = grainCanvas.getContext("2d");
  const gimg = gctx.createImageData(200, 200);
  for (let i = 0; i < gimg.data.length; i += 4) {
    const v = Math.random() * 255;
    gimg.data[i] = v;
    gimg.data[i + 1] = v;
    gimg.data[i + 2] = v;
    gimg.data[i + 3] = 255 * 0.02;
  }
  gctx.putImageData(gimg, 0, 0);
  ctx.fillStyle = ctx.createPattern(grainCanvas, "repeat");
  ctx.fillRect(0, 0, W, H);

  const lum = frameColor[0] * 0.299 + frameColor[1] * 0.587 + frameColor[2] * 0.114;
  const inkRGB = lum > 140 ? "38, 32, 26" : "245, 238, 225";

  // Spread layouts own their own composition. Branch early.
  if (SPREAD_LAYOUTS.has(layout)) {
    if (layout === "monument") renderMonument(ctx, params, W, H, inkRGB);
    else if (layout === "bleed") renderBleed(ctx, params, W, H, inkRGB, frameColor);
    else if (layout === "title") renderTitle(ctx, params, W, H, inkRGB);
    else if (layout === "stack") renderStack(ctx, params, W, H, inkRGB);
    else if (layout === "nested") renderNested(ctx, params, W, H, inkRGB);
    else if (layout === "rings") renderRings(ctx, params, W, H, inkRGB);
    return;
  }

  if (layout !== "mark") {
    const positions = layoutPositions(layout, aspect, photoScale);
    const need = requiredFor(layout);
    const usable = photos.slice(0, need);
    positions.forEach((pos, i) => {
      if (usable[i]) {
        drawPhotoSquare(ctx, usable[i].image, pos.x, pos.y, pos.size);

        if (showCredits) {
          const photo = usable[i];
          const num = photo.number || "";
          const ctb = (photo.contributor || defaultContributor || "").trim();
          if (num || ctb) {
            const captionFontSize = Math.max(11, Math.min(18, Math.round(pos.size / 28)));
            ctx.font = `400 ${captionFontSize}px "IBM Plex Mono", monospace`;
            ctx.fillStyle = `rgba(${inkRGB}, 0.78)`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            const sep = num && ctb ? "  —  " : "";
            const text = `${num ? `№ ${num}` : ""}${sep}${ctb}`;
            ctx.fillText(
              text,
              pos.x + pos.size / 2,
              pos.y + pos.size + Math.max(14, captionFontSize * 0.9)
            );
          }
        }
      } else {
        ctx.strokeStyle = `rgba(60, 50, 40, 0.2)`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(pos.x, pos.y, pos.size, pos.size);
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(60, 50, 40, 0.4)`;
        ctx.font = `12px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`SLOT ${i + 1}`, pos.x + pos.size / 2, pos.y + pos.size / 2);
      }
    });
  }

  if (layout === "mark" && params.markEnabled !== false) {
    ctx.fillStyle = `rgb(${inkRGB})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cx = W / 2;
    const cy = H / 2;

    if (logoImage) {
      const maxW = W * 0.6;
      const scale = Math.min(maxW / logoImage.width, (H * 0.4) / logoImage.height);
      const lw = logoImage.width * scale;
      const lh = logoImage.height * scale;
      ctx.drawImage(logoImage, cx - lw / 2, cy - lh / 2 - 30, lw, lh);
      if (markSubtext) {
        ctx.font = `400 22px "IBM Plex Mono", monospace`;
        ctx.fillText(markSubtext.toUpperCase(), cx, cy + lh / 2 + 30);
      }
    } else {
      const baseMarkSize = aspect === "1:1" ? 220 : 260;
      const markSize = Math.round(baseMarkSize * markScaleMult(params));
      ctx.font = `700 ${markSize}px "Playfair Display", serif`;
      ctx.fillText(markText, cx, cy - 20);
      if (markSubtext) {
        ctx.font = `400 24px "IBM Plex Mono", monospace`;
        const text = markSubtext.toUpperCase();
        const spacing = 4;
        const widths = text.split("").map((ch) => ctx.measureText(ch).width);
        const totalW = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
        let x = cx - totalW / 2;
        for (let i = 0; i < text.length; i++) {
          ctx.textAlign = "left";
          ctx.fillText(text[i], x, cy + markSize * 0.5);
          x += widths[i] + spacing;
        }
      }
    }
  }

  if (showCaption && layout !== "mark" && caption) {
    const fontSize = aspect === "1:1" ? 18 : 22;
    const anchor = captionAnchor(params.captionPosition, W, H);
    paintCaption(ctx, caption, anchor.x, anchor.y, fontSize, inkRGB, 0.85, anchor.align, 3);
  }
};

// ---------- main ----------

// Error boundary wrapping the Compositor so a crash surfaces as a visible
// message with the stack instead of unmounting the whole tree (black screen).
class NestCompositorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error("[NestCompositor crash]", error, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      const stack = (this.state.error?.stack || "").toString();
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: 32,
            backgroundColor: "var(--bg)",
            color: "var(--fg)",
            fontFamily: '"IBM Plex Mono", monospace',
          }}
        >
          <div
            style={{
              maxWidth: 800,
              margin: "40px auto",
              padding: 24,
              border: "1px solid #c2675c",
              backgroundColor: "rgba(232, 90, 79, 0.08)",
              color: "#a04a40",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
              Nest Compositor crashed
            </div>
            <div style={{ fontSize: 13, marginBottom: 12 }}>
              <strong>Message:</strong> {String(this.state.error?.message || this.state.error)}
            </div>
            <pre
              style={{
                fontSize: 11,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                background: "rgba(0,0,0,0.04)",
                padding: 12,
                maxHeight: 360,
                overflow: "auto",
              }}
            >
              {stack}
            </pre>
            <pre
              style={{
                fontSize: 11,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                marginTop: 12,
                background: "rgba(0,0,0,0.04)",
                padding: 12,
                maxHeight: 240,
                overflow: "auto",
              }}
            >
              {this.state.info?.componentStack || ""}
            </pre>
            <button
              type="button"
              onClick={() => this.setState({ error: null, info: null })}
              style={{
                marginTop: 16,
                padding: "8px 16px",
                background: "#a04a40",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Try to recover
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function NestCompositorInner({ navigateTo }) {
  const [layout, setLayout] = useState("single");
  const [aspect, setAspect] = useState("1:1");
  const [photos, setPhotos] = useState([]);
  const [pool, setPool] = useState([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolProgress, setPoolProgress] = useState({ done: 0, total: 0 });

  const [photoScale, setPhotoScale] = useState(0.85);

  const [autoFrame, setAutoFrame] = useState(true);
  const [manualFrame, setManualFrame] = useState("#e8dcc8");
  const [warmth, setWarmth] = useState(0);
  const [lightness, setLightness] = useState(0);
  const [caption, setCaption] = useState("PATIO BEACH — NEST 01");
  const [showCaption, setShowCaption] = useState(true);

  const [showCredits, setShowCredits] = useState(false);
  const [defaultContributor, setDefaultContributor] = useState("@patiobeach");

  const [markText, setMarkText] = useState("NEST");
  const [markSubtext, setMarkSubtext] = useState("Edition 01");
  // Mark scale parametric: small/medium/large. Each layout maps these to
  // its own pixel sizes. Large allows type to crop or bleed past edges.
  const [markScale, setMarkScale] = useState("medium");
  // Caption (subtext line) position — one of 4 canvas positions.
  const [captionPosition, setCaptionPosition] = useState("bottom-center");
  // Nested layout: per-layer content. Each entry is "color" | "nyc" | "patio".
  // Constraint: all three must be distinct. Default mirrors the original
  // grammar — color outer, NYC middle, Patio Beach inner.
  const [containerContent, setContainerContent] = useState(["color", "nyc", "patio"]);
  // Rings layout: 5 concentric squares (canvas outer + 4 inner). Each
  // ring picks from {color, nyc, patio}. Repetition allowed — depth is
  // the move, not strict distinctness. Default is a symmetric pattern.
  const [ringContent, setRingContent] = useState(["color", "nyc", "patio", "nyc", "color"]);
  // Nested layout: where the NEST mark sits on a 3×3 anchor grid.
  //   TL  TC  TR
  //   ML  MC  MR
  //   BL  BC  BR
  // MC is "inside the inner photo" (default). Other positions anchor to
  // canvas margins, scaled by markScale for Daniel's grammar variations.
  const [markPosition, setMarkPosition] = useState("MC");
  // Nested layout: parametric proportions for the middle and inner squares.
  // Each is a discrete S/M/L preset relative to the canvas's smaller
  // dimension. Default M/M reproduces the original 0.66 / 0.30 sizing.
  const [nestedMiddleSize, setNestedMiddleSize] = useState("medium");
  const [nestedInnerSize, setNestedInnerSize] = useState("medium");

  // Beat machine — audio-reactive randomization of compositor parameters.
  // Each detected beat triggers fresh photos + a new permutation of the
  // parametric controls, producing wide visual variation in time with the
  // music. Recording captures canvas + audio output to a single WebM.
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioName, setAudioName] = useState("");
  const [audioSourceMode, setAudioSourceMode] = useState("file"); // "file" | "stream"
  const [streamPreset, setStreamPreset] = useState("nts1");
  const [customStreamUrl, setCustomStreamUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatThreshold, setBeatThreshold] = useState(0.18);
  const [beatCooldown, setBeatCooldown] = useState(220); // ms between triggers
  const [beatCount, setBeatCount] = useState(0);
  const [currentRms, setCurrentRms] = useState(0); // live amplitude for RMS bar
  const [isRecording, setIsRecording] = useState(false);
  const [outputVideoUrl, setOutputVideoUrl] = useState(null);
  const [outputMime, setOutputMime] = useState("video/webm");
  const [audioError, setAudioError] = useState(null);
  // Tempo mode — fires triggerVariation at a fixed BPM regardless of audio
  // source. Useful for streams where CORS blocks Web Audio analysis (you
  // hear the music, but the analyser sees zeros so beats can't auto-fire).
  const [tempoMode, setTempoMode] = useState(false);
  const [bpm, setBpm] = useState(120);

  // Stream presets — NTS and Lot Radio public stream URLs. CORS may or may
  // not be permissive on these; the RMS indicator below tells you whether
  // Web Audio is actually getting data after Play.
  const STREAM_PRESETS = {
    nts1: { label: "NTS 1", url: "https://stream-relay-geo.ntslive.net/stream" },
    nts2: { label: "NTS 2", url: "https://stream-relay-geo.ntslive.net/stream2" },
    lot: { label: "Lot Radio", url: "https://lottube.lotradio.com/lotradio_a" },
    custom: { label: "Custom", url: "" },
  };

  const audioRef = useRef(null);
  const audioInputRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const audioDestRef = useRef(null);
  const beatRafRef = useRef(null);
  const lastBeatTimeRef = useRef(0);
  const triggeringRef = useRef(false);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const tempoIntervalRef = useRef(null);
  const bpmRef = useRef(bpm);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Refs to current values used inside the beat detection rAF loop. Avoids
  // re-binding the loop on every state change.
  const beatThresholdRef = useRef(beatThreshold);
  const beatCooldownRef = useRef(beatCooldown);
  useEffect(() => {
    beatThresholdRef.current = beatThreshold;
  }, [beatThreshold]);
  useEffect(() => {
    beatCooldownRef.current = beatCooldown;
  }, [beatCooldown]);
  // Setter that auto-swaps to keep all three layers distinct: when the user
  // picks a value already used elsewhere, the conflicting layer takes over
  // the previous value of the layer being changed.
  const setLayerContent = (layerIdx, newVal) => {
    setContainerContent((prev) => {
      const next = [...prev];
      const old = next[layerIdx];
      if (old === newVal) return prev;
      const otherIdx = next.findIndex((v, i) => i !== layerIdx && v === newVal);
      if (otherIdx >= 0) next[otherIdx] = old;
      next[layerIdx] = newVal;
      return next;
    });
  };
  // Set a single ring's content. No distinctness constraint (allows
  // repeats so adjacent or alternating rings can share content).
  const setRingAt = (idx, val) => {
    setRingContent((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };
  // Randomize the 5 ring contents, ensuring no two ADJACENT rings have
  // the same content (visual distinction between layers). Repetition
  // across non-adjacent rings is allowed.
  const randomizeRingContent = () => {
    const types = ["color", "nyc", "patio"];
    const next = [];
    for (let i = 0; i < 5; i++) {
      const choices = types.filter((t) => t !== next[i - 1]);
      next.push(choices[Math.floor(Math.random() * choices.length)]);
    }
    setRingContent(next);
  };

  // Pick a random permutation of [color, nyc, patio] across the three
  // layers — guaranteed to differ from the current permutation so every
  // click changes the composition.
  const randomizeContainerContent = () => {
    const PERMS = [
      ["color", "nyc", "patio"],
      ["color", "patio", "nyc"],
      ["nyc", "color", "patio"],
      ["nyc", "patio", "color"],
      ["patio", "color", "nyc"],
      ["patio", "nyc", "color"],
    ];
    setContainerContent((prev) => {
      const currentKey = prev.join(",");
      const others = PERMS.filter((p) => p.join(",") !== currentKey);
      return others[Math.floor(Math.random() * others.length)];
    });
  };
  const [logoImage, setLogoImage] = useState(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [view, setView] = useState("single");
  const [batchSize, setBatchSize] = useState(6);
  const [batchVariants, setBatchVariants] = useState([]);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [favoriteIdx, setFavoriteIdx] = useState(new Set());

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const dimensions =
    aspect === "9:16"
      ? { w: 1080, h: 1920 }
      : aspect === "16:9"
      ? { w: 1920, h: 1080 }
      : { w: 1080, h: 1080 };
  const requiredPhotos = requiredFor(layout);

  useEffect(() => {
    if (document.querySelector("link[data-press-fonts]")) {
      document.fonts.ready.then(() => setFontsReady(true));
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap";
    link.setAttribute("data-press-fonts", "1");
    document.head.appendChild(link);
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const loaded = await Promise.all(files.map((f) => loadAndDownscale(f)));
    setPhotos((prev) => [...prev, ...loaded].slice(0, 4));
  };

  const handleFolder = async (fileList) => {
    const files = Array.from(fileList).filter(
      (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name)
    );
    if (!files.length) return;
    setPoolLoading(true);
    setPoolProgress({ done: 0, total: files.length });
    const loaded = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const item = await loadAndDownscale(files[i]);
        loaded.push(item);
      } catch (e) {
        /* skip */
      }
      setPoolProgress({ done: i + 1, total: files.length });
    }
    setPool(loaded);
    setPoolLoading(false);
  };

  const handleLogoFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => setLogoImage(img);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx));
  const updatePhotoMeta = (idx, key, value) => {
    setPhotos((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));
  };
  const clearPhotos = () => {
    setPhotos([]);
    setLogoImage(null);
  };
  const clearPool = () => {
    setPool([]);
    setBatchVariants([]);
  };

  // Two bundled archives — Patio Beach (street documentary, 549 posts) and
  // NYC (Daniel's NY captures, 29 photos). Custom folder pool overrides when
  // set. Otherwise archiveKind picks which bundled pool drives shuffle/batch.
  const patioBeachPool = useMemo(() => buildPatioBeachPool(PATIO_BEACH_MONTHS), []);
  const nycPool = useMemo(() => NYC_ARCHIVE.slice(), []);
  const [archiveKind, setArchiveKind] = useState("patio-beach"); // "patio-beach" | "nyc" | "mixed"
  const archivePool = useMemo(() => {
    if (archiveKind === "nyc") return nycPool;
    if (archiveKind === "mixed") return [...patioBeachPool, ...nycPool];
    return patioBeachPool;
  }, [archiveKind, patioBeachPool, nycPool]);
  const usingArchive = pool.length === 0;
  const activePoolCount = usingArchive ? archivePool.length : pool.length;
  const ARCHIVE_LABELS = {
    "patio-beach": "Patio Beach archive",
    "nyc": "NYC archive",
    "mixed": "Patio Beach + NYC",
  };

  // Build the slot-by-slot source list for a single shuffle/variant. Honors
  // Daniel's rule: under "Mixed" archive, slot 0 = NYC, rest = Patio Beach
  // (so multi-photo compositions always carry one of each register). Title
  // forces this regardless of archive selection. Single archives sample
  // uniformly from one pool.
  const pickSlotSources = (need) => {
    if (need === 0) return [];
    if (layout === "title" || layout === "nested" || layout === "rings") {
      // Title, Nested, and Rings all force NYC + Patio Beach — slot 0 is the
      // city/architectural ground, slot 1 the discarded subject. Rings then
      // assigns these to its concentric layers per `ringContent`.
      if (nycPool.length === 0 || patioBeachPool.length === 0) return null;
      return [
        nycPool[Math.floor(Math.random() * nycPool.length)],
        patioBeachPool[Math.floor(Math.random() * patioBeachPool.length)],
      ];
    }
    if (archiveKind === "mixed" && need >= 2) {
      // Mixed for 2+ photos: slot 0 = NYC, slots 1+ = Patio Beach
      if (nycPool.length === 0 || patioBeachPool.length === 0) return null;
      const nycPick = nycPool[Math.floor(Math.random() * nycPool.length)];
      const pbPicks = [...patioBeachPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, need - 1);
      return [nycPick, ...pbPicks];
    }
    // Single-archive path (or Mixed with need=1): shuffle from active pool
    return [...archivePool].sort(() => Math.random() - 0.5).slice(0, need);
  };

  const [shuffleLoading, setShuffleLoading] = useState(false);
  const shuffleFromPool = async () => {
    const need = Math.max(requiredPhotos, 1);

    if (usingArchive) {
      const picks = pickSlotSources(need);
      if (!picks || picks.length === 0) return;
      setShuffleLoading(true);
      try {
        const loaded = await Promise.all(
          picks.map((p) => loadFromUrl(p.path, { n: p.n, by: p.by }))
        );
        setPhotos(loaded);
      } finally {
        setShuffleLoading(false);
      }
    } else {
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, need);
      setPhotos(shuffled);
    }
  };

  // Beat-driven variation.
  //
  // EVERY BEAT: photo shuffle + container content rotation. These keep the
  // visual rhythm tight in time with the music.
  //
  // EVERY 5-6 BEATS (random): the NEST mark itself — position, scale,
  // and the nested geometry (middle/inner sizes). Throttled so the type
  // and structural composition feel more stable, only re-flexing
  // periodically. Per Daniel's note: "every 5 or 6 frames, enough for it
  // to feel random."
  const MARK_POSITIONS = ["TL", "TC", "TR", "ML", "MC", "MR", "BL", "BC", "BR"];
  const MARK_SCALES = ["small", "medium", "large"];
  const NESTED_SIZES = ["small", "medium", "large"];
  const beatsUntilMarkRef = useRef(0);
  // Logo visibility — two layers of control:
  //
  // 1. markEnabled (user toggle, default ON) — hard switch. When OFF, the
  //    NEST mark never renders, regardless of beat machine state.
  // 2. showMark (beat-machine cycle, default ON) — flickers true/false
  //    during beat playback (1-2 ON, 3-5 OFF). Stays true otherwise so
  //    static preview and batch render always show the logo.
  //
  // Effective visibility in render = markEnabled && showMark.
  const [markEnabled, setMarkEnabled] = useState(true);
  const [showMark, setShowMark] = useState(true);
  const markVisibleRef = useRef(true);
  const markPhaseLeftRef = useRef(0); // beats remaining in current phase
  const triggerVariation = () => {
    // Always: rotate container content (which slot is color/NYC/PB)
    if (layout === "nested") {
      randomizeContainerContent();
    } else if (layout === "rings") {
      randomizeRingContent();
    }

    if (layout === "nested" || layout === "rings") {
      // Logo visibility cycling: ON 1-2 beats / OFF 3-5 beats. When the
      // logo turns ON, randomize position + scale + (nested only) sizes
      // for a fresh placement. When OFF, render skips the NEST text.
      markPhaseLeftRef.current -= 1;
      if (markPhaseLeftRef.current <= 0) {
        const nowVisible = !markVisibleRef.current;
        markVisibleRef.current = nowVisible;
        setShowMark(nowVisible);
        if (nowVisible) {
          markPhaseLeftRef.current = 1 + Math.floor(Math.random() * 2); // 1-2 ON
          setMarkScale(MARK_SCALES[Math.floor(Math.random() * MARK_SCALES.length)]);
          setMarkPosition(MARK_POSITIONS[Math.floor(Math.random() * MARK_POSITIONS.length)]);
          if (layout === "nested") {
            // Pick middle + inner size pair, excluding the thin-ring combo
            // (small middle + large inner produces a ~6% sliver around
            // the inner photo that doesn't read as nested).
            let m, i;
            do {
              m = NESTED_SIZES[Math.floor(Math.random() * NESTED_SIZES.length)];
              i = NESTED_SIZES[Math.floor(Math.random() * NESTED_SIZES.length)];
            } while (m === "small" && i === "large");
            setNestedMiddleSize(m);
            setNestedInnerSize(i);
          }
        } else {
          markPhaseLeftRef.current = 3 + Math.floor(Math.random() * 3); // 3-5 OFF
        }
      }
    } else {
      // Non-Nested layouts keep the previous throttle behavior:
      // mark always renders, position/scale change every 5-6 beats.
      if (beatsUntilMarkRef.current <= 0) {
        setMarkScale(MARK_SCALES[Math.floor(Math.random() * MARK_SCALES.length)]);
        beatsUntilMarkRef.current = 4 + Math.floor(Math.random() * 2);
      } else {
        beatsUntilMarkRef.current -= 1;
      }
    }

    // Always: async photo shuffle (skip if still loading from previous)
    if (!triggeringRef.current) {
      triggeringRef.current = true;
      shuffleFromPool().finally(() => {
        triggeringRef.current = false;
      });
    }
    setBeatCount((c) => c + 1);
  };

  // Lazy-build the audio graph (AudioContext + Analyser + element source).
  // Browsers require a user gesture before AudioContext resumes — call this
  // from a click handler. Wrapped in try/catch so a Web Audio failure (e.g.,
  // already-bound source, unsupported codec) surfaces as an in-UI error
  // instead of crashing the React tree.
  const ensureAudioGraph = async () => {
    if (!audioRef.current) {
      setAudioError("Audio element not ready — try again in a moment");
      return null;
    }
    try {
      if (!audioCtxRef.current) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) throw new Error("Web Audio API not supported in this browser");
        const ctx = new Ctor();
        const source = ctx.createMediaElementSource(audioRef.current);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.4;
        const dest = ctx.createMediaStreamDestination();
        source.connect(analyser);
        analyser.connect(ctx.destination);
        analyser.connect(dest);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceNodeRef.current = source;
        audioDestRef.current = dest;
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      setAudioError(null);
      return audioCtxRef.current;
    } catch (e) {
      const msg = e?.message || String(e);
      console.error("[Beat machine] audio graph error:", e);
      setAudioError(msg);
      return null;
    }
  };

  const startBeatLoop = () => {
    if (!analyserRef.current) return;
    const buf = new Uint8Array(analyserRef.current.fftSize);
    let lastRmsPush = 0;
    const loop = () => {
      if (!analyserRef.current) return;
      try {
        analyserRef.current.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const now = performance.now();
        // Throttle RMS state updates to ~10 Hz so React doesn't re-render 60×/sec
        if (now - lastRmsPush > 100) {
          lastRmsPush = now;
          setCurrentRms(rms);
        }
        if (
          rms > beatThresholdRef.current &&
          now - lastBeatTimeRef.current > beatCooldownRef.current
        ) {
          lastBeatTimeRef.current = now;
          triggerVariation();
        }
      } catch (e) {
        // Defensive — never let the rAF loop crash the React tree
        console.error("[Beat machine] loop error:", e);
      }
      beatRafRef.current = requestAnimationFrame(loop);
    };
    beatRafRef.current = requestAnimationFrame(loop);
  };

  const stopBeatLoop = () => {
    if (beatRafRef.current) cancelAnimationFrame(beatRafRef.current);
    beatRafRef.current = null;
  };

  // Tempo loop — fires triggerVariation at the user-set BPM regardless of
  // audio analysis. Used as a fallback when streams don't permit CORS for
  // Web Audio, or as a tempo-driven mode independent of any audio.
  const startTempoLoop = () => {
    stopTempoLoop();
    const intervalMs = (60 / Math.max(20, Math.min(240, bpmRef.current))) * 1000;
    tempoIntervalRef.current = setInterval(() => {
      try {
        triggerVariation();
      } catch (e) {
        console.error("[Beat machine] tempo trigger error:", e);
      }
    }, intervalMs);
  };
  const stopTempoLoop = () => {
    if (tempoIntervalRef.current) {
      clearInterval(tempoIntervalRef.current);
      tempoIntervalRef.current = null;
    }
  };
  // If BPM changes mid-play, restart the interval to apply
  useEffect(() => {
    if (tempoMode && tempoIntervalRef.current) {
      startTempoLoop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm]);

  const handleAudioFile = (file) => {
    try {
      if (!file) return;
      if (audioUrl && audioUrl.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioName(file.name);
      setBeatCount(0);
      setCurrentRms(0);
      setAudioError(null);
    } catch (e) {
      console.error("[Beat machine] file load error:", e);
      setAudioError(e?.message || String(e));
    }
  };

  // Apply a stream URL to the audio element. Sets crossOrigin and src;
  // browser will start buffering. Surface clear errors via onError event
  // (audio element) — most likely cause of failure is CORS or 404.
  const applyStream = (presetKey, customUrl) => {
    try {
      const preset = STREAM_PRESETS[presetKey];
      if (!preset) return;
      const url = presetKey === "custom" ? (customUrl || "").trim() : preset.url;
      if (!url) {
        setAudioError("Enter a custom stream URL");
        return;
      }
      // Clear any previous file blob URL
      if (audioUrl && audioUrl.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
      // If audio is currently playing, stop it before swapping source
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        stopBeatLoop();
      }
      setAudioUrl(url);
      setAudioName(presetKey === "custom" ? "Custom stream" : preset.label);
      setBeatCount(0);
      setCurrentRms(0);
      setAudioError(null);
    } catch (e) {
      console.error("[Beat machine] stream load error:", e);
      setAudioError(e?.message || String(e));
    }
  };

  // Switch source mode and clear current audio
  const switchSourceMode = (mode) => {
    if (mode === audioSourceMode) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      stopBeatLoop();
    }
    if (audioUrl && audioUrl.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioName("");
    setBeatCount(0);
    setCurrentRms(0);
    setAudioError(null);
    setAudioSourceMode(mode);
  };

  const handleAudioElementError = () => {
    const el = audioRef.current;
    const code = el?.error?.code;
    const codeMap = {
      1: "MEDIA_ERR_ABORTED — playback was aborted",
      2: "MEDIA_ERR_NETWORK — network error fetching the audio",
      3: "MEDIA_ERR_DECODE — could not decode the audio",
      4: "MEDIA_ERR_SRC_NOT_SUPPORTED — source unsupported (often CORS or 404)",
    };
    setAudioError(codeMap[code] || `Audio element error (code ${code})`);
    setIsPlaying(false);
    stopBeatLoop();
  };

  const onPlayPause = async () => {
    // Tempo mode without audio is allowed — fires triggers at fixed BPM
    if (tempoMode && !audioUrl) {
      if (isPlaying) {
        setIsPlaying(false);
        stopTempoLoop();
      } else {
        setIsPlaying(true);
        startTempoLoop();
      }
      return;
    }
    if (!audioRef.current) {
      setAudioError("Audio element not ready");
      return;
    }
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        stopBeatLoop();
        stopTempoLoop();
        // Reset mark visibility to ON when paused so static preview after
        // pause shows the logo (rather than holding a "mid-cycle off" state)
        markVisibleRef.current = true;
        setShowMark(true);
        markPhaseLeftRef.current = 0;
      } else {
        const ctx = await ensureAudioGraph();
        if (!ctx) return;
        await audioRef.current.play();
        setIsPlaying(true);
        if (tempoMode) {
          // Tempo drives triggers; no audio analysis loop
          startTempoLoop();
        } else {
          startBeatLoop();
        }
      }
    } catch (e) {
      console.error("[Beat machine] play error:", e);
      setAudioError(e?.message || String(e));
      setIsPlaying(false);
    }
  };

  const onAudioEnded = () => {
    setIsPlaying(false);
    stopBeatLoop();
    stopTempoLoop();
    if (isRecording) onStopRecording();
  };

  const onStartRecording = () => {
    if (!canvasRef.current || !audioDestRef.current) return;
    if (outputVideoUrl) {
      URL.revokeObjectURL(outputVideoUrl);
      setOutputVideoUrl(null);
    }
    const videoStream = canvasRef.current.captureStream(30);
    const audioTracks = audioDestRef.current.stream.getAudioTracks();
    const combined = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioTracks,
    ]);
    const mimeCandidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    const supported =
      mimeCandidates.find((t) => MediaRecorder.isTypeSupported(t)) || "video/webm";
    setOutputMime(supported.split(";")[0]);
    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(combined, {
      mimeType: supported,
      // 15 Mbps — gives the encoder headroom for the rapid full-frame
      // changes that happen on every beat. At 5 Mbps VP9 produced visible
      // artifacts during transitions.
      videoBitsPerSecond: 15_000_000,
    });
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: supported.split(";")[0] });
      const url = URL.createObjectURL(blob);
      setOutputVideoUrl(url);
    };
    recorder.start(200);
    recorderRef.current = recorder;
    setIsRecording(true);
  };

  const onStopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const downloadBeatVideo = () => {
    if (!outputVideoUrl) return;
    const a = document.createElement("a");
    a.href = outputVideoUrl;
    const ext = outputMime.includes("webm") ? "webm" : "mp4";
    a.download = `nest_beatmachine.${ext}`;
    a.click();
  };

  // Cleanup: stop loops + revoke URLs on unmount
  useEffect(() => {
    return () => {
      stopBeatLoop();
      stopTempoLoop();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (audioUrl && audioUrl.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
      if (outputVideoUrl) URL.revokeObjectURL(outputVideoUrl);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const photoColorBase = useMemo(() => {
    if (!photos.length) return [232, 220, 200];
    const used = photos.slice(0, requiredPhotos || 1);
    return extractDominantFromImages(used.map((p) => p.image));
  }, [photos, requiredPhotos]);

  const frameColor = (() => {
    const base = autoFrame ? photoColorBase : hexToRgb(manualFrame);
    return toneShift(base, { warmth, lightness });
  })();

  const renderParams = {
    layout,
    aspect,
    photos,
    frameColor,
    photoScale,
    caption,
    showCaption,
    showCredits,
    defaultContributor,
    markText,
    markSubtext,
    markScale,
    captionPosition,
    containerContent,
    ringContent,
    markPosition,
    nestedMiddleSize,
    nestedInnerSize,
    showMark,
    markEnabled,
    logoImage,
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderToCanvas(canvas, renderParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify({
      layout,
      aspect,
      frameColor,
      photoScale,
      caption,
      showCaption,
      showCredits,
      defaultContributor,
      markText,
      markSubtext,
      markScale,
      captionPosition,
      containerContent,
      ringContent,
      markPosition,
      nestedMiddleSize,
      nestedInnerSize,
      showMark,
      markEnabled,
    }),
    photos,
    logoImage,
  ]);

  useEffect(() => {
    if (view === "single") render();
  }, [render, fontsReady, view]);

  const generateBatch = async () => {
    if (activePoolCount === 0) return;
    setBatchGenerating(true);
    setFavoriteIdx(new Set());
    const need = requiredFor(layout);
    const variants = [];

    for (let i = 0; i < batchSize; i++) {
      let picked;
      if (need === 0) {
        picked = [];
      } else if (usingArchive) {
        // Same Mixed-aware pairing logic as shuffle (1 NYC + rest PB).
        const picks = pickSlotSources(need);
        if (!picks) {
          continue;
        }
        picked = await Promise.all(
          picks.map((p) => loadFromUrl(p.path, { n: p.n, by: p.by }))
        );
      } else {
        picked = [...pool].sort(() => Math.random() - 0.5).slice(0, need);
      }
      const offCanvas = document.createElement("canvas");
      const fc = autoFrame
        ? picked.length
          ? extractDominantFromImages(picked.map((p) => p.image))
          : [232, 220, 200]
        : hexToRgb(manualFrame);
      const adjusted = toneShift(fc, { warmth, lightness });

      renderToCanvas(offCanvas, {
        ...renderParams,
        photos: picked,
        frameColor: adjusted,
      });

      const dataUrl = offCanvas.toDataURL("image/png");
      variants.push({ id: `${Date.now()}-${i}`, photos: picked, frameColor: adjusted, dataUrl });
      await new Promise((r) => setTimeout(r, 16));
    }

    setBatchVariants(variants);
    setView("batch");
    setBatchGenerating(false);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const aspectName = aspect === "1:1" ? "1x1" : "9x16";
      a.download = `nest_${layout}_${aspectName}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const downloadVariant = (variant, idx) => {
    const a = document.createElement("a");
    a.href = variant.dataUrl;
    const aspectName = aspect === "1:1" ? "1x1" : "9x16";
    a.download = `nest_${layout}_${aspectName}_${String(idx + 1).padStart(2, "0")}.png`;
    a.click();
  };

  const downloadSelected = async () => {
    const indices =
      favoriteIdx.size > 0
        ? [...favoriteIdx].sort((a, b) => a - b)
        : batchVariants.map((_, i) => i);
    for (const idx of indices) {
      downloadVariant(batchVariants[idx], idx);
      await new Promise((r) => setTimeout(r, 200));
    }
  };

  const toggleFavorite = (idx) => {
    setFavoriteIdx((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // ---------- shared style fragments ----------

  const sectionLabel = { ...labelStyle, color: Muted };

  const tabBtn = (active) => ({
    textAlign: "left",
    padding: 16,
    border: `1px solid ${active ? Ink : Hairline}`,
    backgroundColor: active ? Ink : "transparent",
    color: active ? PaperBg : Ink,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s ease",
  });

  const aspectBtn = (active) => ({
    textAlign: "left",
    padding: 12,
    border: `1px solid ${active ? Ink : Hairline}`,
    backgroundColor: active ? Ink : "transparent",
    color: active ? PaperBg : Ink,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s ease",
  });

  const inputBase = {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: "transparent",
    border: `1px solid ${Hairline}`,
    color: Ink,
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 12,
    boxSizing: "border-box",
  };

  const toggleBtn = (on) => ({
    ...labelStyle,
    padding: "4px 8px",
    backgroundColor: on ? Ink : "transparent",
    color: on ? PaperBg : Muted,
    border: `1px solid ${on ? Ink : Hairline}`,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  // ---------- render ----------

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: PaperBg,
        color: Ink,
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <style>{`
        .nc-serif { font-family: "Playfair Display", Georgia, serif; }
        .nc-mono { font-family: "IBM Plex Mono", monospace; }
        .nc-photo-thumb { position: relative; aspect-ratio: 1 / 1; }
        .nc-photo-thumb .nc-photo-delete { opacity: 0; transition: opacity 0.15s ease; }
        .nc-photo-thumb:hover .nc-photo-delete { opacity: 1; }
        .nc-range { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; }
        .nc-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; background: ${Ink}; border-radius: 50%; cursor: pointer; }
        .nc-range::-webkit-slider-runnable-track { height: 1px; background: ${Hairline}; }
        .nc-range::-moz-range-thumb { width: 14px; height: 14px; background: ${Ink}; border: none; border-radius: 50%; cursor: pointer; }
        .nc-range::-moz-range-track { height: 1px; background: ${Hairline}; }
      `}</style>

      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${Hairline}` }}>
        <div
          style={{
            maxWidth: 1600,
            margin: "0 auto",
            padding: "20px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            {navigateTo && (
              <button
                type="button"
                onClick={() => navigateTo("press")}
                style={{
                  ...labelStyle,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "transparent",
                  border: "none",
                  color: Muted,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                <ArrowLeft size={11} strokeWidth={1.5} /> Press
              </button>
            )}
            <span
              className="nc-serif"
              style={{ fontSize: 24, letterSpacing: "-0.02em", fontWeight: 500 }}
            >
              Nest{" "}
              <span style={{ fontStyle: "italic", color: Muted }}>compositor</span>
            </span>
            <span style={{ ...labelStyle, color: Muted }}>
              Patio Beach × Field of Action
            </span>
          </div>
          <div style={{ ...labelStyle, color: Muted }}>
            {dimensions.w} × {dimensions.h} · scale {photoScale.toFixed(2)} · {usingArchive ? `archive ${archivePool.length}` : `folder ${pool.length}`}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          padding: "32px",
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 32,
        }}
      >
        {/* Left column — controls */}
        <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: 32 }}>
          {/* I — Layout */}
          <section>
            <div style={{ ...sectionLabel, marginBottom: 12 }}>I — Layout</div>
            <div style={{ ...labelStyle, color: Muted, marginBottom: 8 }}>Centered</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                { id: "single", label: "Single", n: "I", icon: Square, desc: "1 photo" },
                { id: "juxtapose", label: "Juxtapose", n: "II", icon: Columns, desc: "2 photos" },
                { id: "synthesis", label: "Synthesis", n: "III", icon: LayoutGrid, desc: "3 photos" },
                { id: "mark", label: "Mark", n: "IV", icon: Type, desc: "logo panel" },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = layout === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLayout(opt.id)}
                    style={tabBtn(active)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <Icon size={18} strokeWidth={1.5} />
                      <span style={{ ...labelStyle, opacity: 0.6 }}>{opt.n}</span>
                    </div>
                    <div className="nc-serif" style={{ fontSize: 16, fontWeight: 500 }}>
                      {opt.label}
                    </div>
                    <div style={{ ...labelStyle, marginTop: 4, opacity: 0.6 }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ ...labelStyle, color: Muted, marginBottom: 8 }}>Spread · asymmetric</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { id: "monument", label: "Monument", n: "V", icon: Type, desc: "huge type · anchor" },
                { id: "bleed", label: "Bleed", n: "VI", icon: Columns, desc: "50/50 split" },
                { id: "title", label: "Title", n: "VII", icon: LayoutGrid, desc: "city · type · inset" },
                { id: "stack", label: "Stack", n: "VIII", icon: Square, desc: "nested rectangles" },
                { id: "nested", label: "Nested", n: "IX", icon: Square, desc: "3 concentric squares" },
                { id: "rings", label: "Rings", n: "X", icon: Square, desc: "5 concentric squares" },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = layout === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLayout(opt.id)}
                    style={tabBtn(active)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <Icon size={18} strokeWidth={1.5} />
                      <span style={{ ...labelStyle, opacity: 0.6 }}>{opt.n}</span>
                    </div>
                    <div className="nc-serif" style={{ fontSize: 16, fontWeight: 500 }}>
                      {opt.label}
                    </div>
                    <div style={{ ...labelStyle, marginTop: 4, opacity: 0.6 }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* II — Aspect */}
          <section>
            <div style={{ ...sectionLabel, marginBottom: 12 }}>II — Aspect</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { id: "1:1", label: "Square", dims: "1080 × 1080" },
                { id: "9:16", label: "Vertical", dims: "1080 × 1920" },
                { id: "16:9", label: "Cinematic", dims: "1920 × 1080" },
              ].map((opt) => {
                const active = aspect === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAspect(opt.id)}
                    style={aspectBtn(active)}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="nc-serif" style={{ fontSize: 14, fontWeight: 500 }}>
                        {opt.label}
                      </span>
                      <span style={{ ...labelStyle, opacity: 0.6 }}>{opt.id}</span>
                    </div>
                    <div style={{ ...labelStyle, marginTop: 4, opacity: 0.6 }}>{opt.dims}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* III — Source (photo layouts) */}
          {layout !== "mark" && (
            <section>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={sectionLabel}>
                  III — Source · {photos.length}/{requiredPhotos} active
                </div>
                {photos.length > 0 && (
                  <button
                    type="button"
                    onClick={clearPhotos}
                    style={{
                      ...labelStyle,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: Muted,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      padding: 0,
                    }}
                  >
                    <RotateCcw size={11} /> clear
                  </button>
                )}
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                style={{
                  cursor: "pointer",
                  padding: 24,
                  textAlign: "center",
                  border: `1px dashed ${dragOver ? Ink : Hairline}`,
                  backgroundColor: dragOver ? Surface : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <Upload size={18} strokeWidth={1.5} style={{ color: Muted, display: "block", margin: "0 auto 8px" }} />
                <div className="nc-serif" style={{ fontSize: 14, fontWeight: 500 }}>
                  Drop specific photos
                </div>
                <div style={{ ...labelStyle, marginTop: 4, color: Muted }}>manual selection</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0" }}>
                <div style={{ flex: 1, height: 1, backgroundColor: Hairline }} />
                <span style={{ ...labelStyle, color: Muted }}>OR</span>
                <div style={{ flex: 1, height: 1, backgroundColor: Hairline }} />
              </div>

              {/* Active source — bundled archive (Patio Beach / NYC / Mixed)
                  by default; custom folder takes over when one is loaded. */}
              <div
                style={{
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: `1px solid ${Ink}`,
                  backgroundColor: Ink,
                  color: PaperBg,
                  opacity: poolLoading ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                <FolderOpen size={18} strokeWidth={1.5} />
                <div style={{ flex: 1 }}>
                  <div className="nc-serif" style={{ fontSize: 14, fontWeight: 500 }}>
                    {poolLoading
                      ? `Loading ${poolProgress.done}/${poolProgress.total}…`
                      : usingArchive
                      ? `${ARCHIVE_LABELS[archiveKind]} · ${archivePool.length} ${
                          archiveKind === "nyc" ? "photos" : "posts"
                        }`
                      : `Custom folder · ${pool.length} photos`}
                  </div>
                  <div style={{ ...labelStyle, marginTop: 4, opacity: 0.6 }}>
                    {usingArchive
                      ? "auto-connected · drives shuffle + batch"
                      : "shuffle + batch use this folder"}
                  </div>
                </div>
              </div>

              {/* Archive selector — only meaningful when using a bundled
                  archive (custom folder overrides). */}
              {usingArchive && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 4,
                    marginTop: 8,
                  }}
                >
                  {[
                    { id: "patio-beach", label: "Patio Beach" },
                    { id: "nyc", label: "NYC" },
                    { id: "mixed", label: "Mixed" },
                  ].map((opt) => {
                    const active = archiveKind === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setArchiveKind(opt.id)}
                        style={{
                          ...labelStyle,
                          padding: "6px 8px",
                          backgroundColor: active ? Ink : "transparent",
                          color: active ? PaperBg : Muted,
                          border: `1px solid ${active ? Ink : Hairline}`,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textAlign: "center",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Always-available shuffle (works against the active source) */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={shuffleFromPool}
                  disabled={shuffleLoading || activePoolCount === 0}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    border: `1px solid ${Hairline}`,
                    color: Ink,
                    background: "transparent",
                    cursor: shuffleLoading ? "default" : "pointer",
                    fontFamily: "inherit",
                    fontSize: 12,
                    opacity: shuffleLoading || activePoolCount === 0 ? 0.5 : 1,
                    transition: "all 0.15s ease",
                  }}
                >
                  <Shuffle size={14} strokeWidth={1.5} />
                  <span>{shuffleLoading ? "Loading…" : "Shuffle"}</span>
                </button>
                {!usingArchive && (
                  <button
                    type="button"
                    onClick={clearPool}
                    style={{
                      padding: "8px 12px",
                      border: `1px solid ${Hairline}`,
                      color: Muted,
                      background: "transparent",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    title="Switch back to archive"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Secondary: external folder picker as alternative source */}
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={poolLoading}
                style={{
                  ...labelStyle,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 12,
                  background: "transparent",
                  border: "none",
                  color: Muted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                <FolderOpen size={11} />
                {usingArchive ? "Use external folder instead" : "Switch folder"}
              </button>
              <input
                ref={folderInputRef}
                type="file"
                accept="image/*"
                webkitdirectory=""
                directory=""
                multiple
                hidden
                onChange={(e) => handleFolder(e.target.files)}
              />

              {photos.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  {photos.map((p, i) => (
                    <div key={i} className="nc-photo-thumb">
                      <img
                        src={p.url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="nc-photo-delete"
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          padding: 4,
                          backgroundColor: Ink,
                          color: PaperBg,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <X size={12} />
                      </button>
                      {i < requiredPhotos && (
                        <div
                          style={{
                            ...labelStyle,
                            position: "absolute",
                            bottom: 4,
                            left: 4,
                            padding: "0 4px",
                            backgroundColor: Ink,
                            color: PaperBg,
                            fontSize: 9,
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </div>
                      )}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 4,
                          right: 4,
                          width: 12,
                          height: 12,
                          backgroundColor: rgbToHex(...p.color),
                          border: "1px solid rgba(255,255,255,0.6)",
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {showCredits && photos.length > 0 && photos.slice(0, requiredPhotos).length > 0 && (
                <div style={{ marginTop: 12, padding: 12, border: `1px solid ${Hairline}` }}>
                  <div style={{ ...sectionLabel, marginBottom: 8 }}>Active credits</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {photos.slice(0, requiredPhotos).map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="nc-mono" style={{ fontSize: 10, width: 24, color: Muted }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <input
                          value={p.number || ""}
                          onChange={(e) => updatePhotoMeta(i, "number", e.target.value)}
                          placeholder="№"
                          style={{ ...inputBase, width: 80, padding: "4px 8px" }}
                        />
                        <input
                          value={p.contributor || ""}
                          onChange={(e) => updatePhotoMeta(i, "contributor", e.target.value)}
                          placeholder={defaultContributor || "contributor"}
                          style={{ ...inputBase, flex: 1, padding: "4px 8px" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* III — Mark (mark layout only) */}
          {layout === "mark" && (
            <section>
              <div style={{ ...sectionLabel, marginBottom: 12 }}>III — Mark</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* NEST logo on/off — hard switch */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={sectionLabel}>NEST logo</span>
                  <button
                    type="button"
                    onClick={() => setMarkEnabled(!markEnabled)}
                    style={{
                      ...labelStyle,
                      padding: "4px 8px",
                      backgroundColor: markEnabled ? Ink : "transparent",
                      color: markEnabled ? PaperBg : Muted,
                      border: `1px solid ${markEnabled ? Ink : Hairline}`,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {markEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <div>
                  <div style={{ ...sectionLabel, marginBottom: 4 }}>Primary</div>
                  <input
                    value={markText}
                    onChange={(e) => setMarkText(e.target.value)}
                    disabled={!!logoImage}
                    style={{
                      ...inputBase,
                      fontFamily: '"Playfair Display", serif',
                      fontSize: 16,
                      fontWeight: 500,
                    }}
                  />
                </div>
                <div>
                  <div style={{ ...sectionLabel, marginBottom: 4 }}>Subtext</div>
                  <input
                    value={markSubtext}
                    onChange={(e) => setMarkSubtext(e.target.value)}
                    style={{ ...inputBase, fontSize: 14 }}
                  />
                </div>
                <div>
                  <div style={{ ...sectionLabel, marginBottom: 6 }}>Mark scale</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                    {[
                      { id: "small", label: "S" },
                      { id: "medium", label: "M" },
                      { id: "large", label: "L · bleed" },
                    ].map((opt) => {
                      const active = markScale === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setMarkScale(opt.id)}
                          style={{
                            ...labelStyle,
                            padding: "6px 8px",
                            backgroundColor: active ? Ink : "transparent",
                            color: active ? PaperBg : Muted,
                            border: `1px solid ${active ? Ink : Hairline}`,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            textAlign: "center",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ ...sectionLabel, marginBottom: 4 }}>Optional logo file</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        textAlign: "left",
                        fontSize: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        border: `1px solid ${Hairline}`,
                        color: logoImage ? Ink : Muted,
                        background: "transparent",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <ImageIcon size={14} />
                      {logoImage ? "Logo loaded" : "Upload mark image"}
                    </button>
                    {logoImage && (
                      <button
                        type="button"
                        onClick={() => setLogoImage(null)}
                        style={{
                          padding: "8px 12px",
                          border: `1px solid ${Hairline}`,
                          color: Muted,
                          background: "transparent",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleLogoFile(e.target.files[0])}
                  />
                </div>
                <div>
                  <div style={{ ...sectionLabel, marginBottom: 4 }}>
                    Optional color reference photo
                  </div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      cursor: "pointer",
                      padding: 12,
                      textAlign: "center",
                      fontSize: 12,
                      border: `1px dashed ${Hairline}`,
                      color: Muted,
                    }}
                  >
                    {photos[0] ? "Photo drives field color" : "Drop a photo to drive field color"}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  {photos[0] && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 8,
                        padding: 8,
                        border: `1px solid ${Hairline}`,
                      }}
                    >
                      <img
                        src={photos[0].url}
                        style={{ width: 32, height: 32, objectFit: "cover" }}
                        alt=""
                      />
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          backgroundColor: rgbToHex(...photos[0].color),
                          border: `1px solid ${Hairline}`,
                        }}
                      />
                      <span
                        className="nc-mono"
                        style={{ fontSize: 12, marginLeft: "auto", color: Muted }}
                      >
                        {rgbToHex(...photos[0].color).toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePhoto(0)}
                        style={{
                          color: Muted,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* IV — Composition (frame + scale) */}
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={sectionLabel}>IV — Composition</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <button type="button" onClick={() => setAutoFrame(true)} style={toggleBtn(autoFrame)}>
                  AUTO
                </button>
                <button type="button" onClick={() => setAutoFrame(false)} style={toggleBtn(!autoFrame)}>
                  MANUAL
                </button>
              </div>
            </div>

            {layout !== "mark" && (
              <div
                style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${Hairline}` }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={sectionLabel}>Photo scale · nesting</span>
                  <span className="nc-mono" style={{ fontSize: 12, color: Muted }}>
                    {photoScale.toFixed(2)}×
                  </span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.15"
                  step="0.01"
                  value={photoScale}
                  onChange={(e) => setPhotoScale(parseFloat(e.target.value))}
                  className="nc-range"
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <span className="nc-mono" style={{ fontSize: 9, color: Muted }}>
                    more rest
                  </span>
                  <span className="nc-mono" style={{ fontSize: 9, color: Muted }}>
                    tighter
                  </span>
                </div>
              </div>
            )}

            {/* Nested layout — per-layer content selector. Each container
                picks from {color, NYC, Patio Beach}; the swap helper keeps
                all three layers distinct. The Randomize button picks a
                fresh permutation different from the current one. */}
            {layout === "nested" && (
              <div
                style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${Hairline}` }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={sectionLabel}>Nested content</span>
                  <button
                    type="button"
                    onClick={randomizeContainerContent}
                    style={{
                      ...labelStyle,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      backgroundColor: Ink,
                      color: PaperBg,
                      border: `1px solid ${Ink}`,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    title="Pick a different valid permutation"
                  >
                    <Shuffle size={11} strokeWidth={1.5} />
                    Randomize
                  </button>
                </div>
                {[
                  { idx: 0, name: "Outer (canvas)" },
                  { idx: 1, name: "Middle" },
                  { idx: 2, name: "Inner" },
                ].map((layer) => (
                  <div key={layer.idx} style={{ marginBottom: 8 }}>
                    <div className="nc-mono" style={{ fontSize: 10, color: Muted, marginBottom: 4 }}>
                      {layer.name}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                      {[
                        { id: "color", label: "Color" },
                        { id: "nyc", label: "NYC" },
                        { id: "patio", label: "Patio" },
                      ].map((opt) => {
                        const active = containerContent[layer.idx] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setLayerContent(layer.idx, opt.id)}
                            style={{
                              ...labelStyle,
                              padding: "5px 6px",
                              backgroundColor: active ? Ink : "transparent",
                              color: active ? PaperBg : Muted,
                              border: `1px solid ${active ? Ink : Hairline}`,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              textAlign: "center",
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ ...labelStyle, marginTop: 6, color: Muted }}>
                  Picking a duplicate auto-swaps to keep all three distinct
                </div>

                {/* Container proportions — middle + inner sizes (S/M/L each) */}
                <div style={{ ...sectionLabel, marginTop: 16, marginBottom: 6 }}>
                  Middle size
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                  {[
                    { id: "small", label: "S" },
                    { id: "medium", label: "M" },
                    { id: "large", label: "L" },
                  ].map((opt) => {
                    const active = nestedMiddleSize === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNestedMiddleSize(opt.id)}
                        style={{
                          ...labelStyle,
                          padding: "6px 8px",
                          backgroundColor: active ? Ink : "transparent",
                          color: active ? PaperBg : Muted,
                          border: `1px solid ${active ? Ink : Hairline}`,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textAlign: "center",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ ...sectionLabel, marginTop: 12, marginBottom: 6 }}>
                  Inner size
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                  {[
                    { id: "small", label: "S" },
                    { id: "medium", label: "M" },
                    { id: "large", label: "L" },
                  ].map((opt) => {
                    const active = nestedInnerSize === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNestedInnerSize(opt.id)}
                        style={{
                          ...labelStyle,
                          padding: "6px 8px",
                          backgroundColor: active ? Ink : "transparent",
                          color: active ? PaperBg : Muted,
                          border: `1px solid ${active ? Ink : Hairline}`,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textAlign: "center",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rings layout — 5 concentric squares, each picks {color, NYC,
                Patio Beach}. No distinctness constraint (repetition across
                non-adjacent rings is fine — depth is the move). Randomize
                avoids adjacent repeats so layers stay legible. */}
            {layout === "rings" && (
              <div
                style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${Hairline}` }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={sectionLabel}>Rings content</span>
                  <button
                    type="button"
                    onClick={randomizeRingContent}
                    style={{
                      ...labelStyle,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      backgroundColor: Ink,
                      color: PaperBg,
                      border: `1px solid ${Ink}`,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    title="Pick a fresh pattern (no adjacent repeats)"
                  >
                    <Shuffle size={11} strokeWidth={1.5} />
                    Randomize
                  </button>
                </div>
                {[
                  { idx: 0, name: "Outer (canvas)" },
                  { idx: 1, name: "Ring 2" },
                  { idx: 2, name: "Ring 3" },
                  { idx: 3, name: "Ring 4" },
                  { idx: 4, name: "Inner" },
                ].map((layer) => (
                  <div key={layer.idx} style={{ marginBottom: 8 }}>
                    <div className="nc-mono" style={{ fontSize: 10, color: Muted, marginBottom: 4 }}>
                      {layer.name}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                      {[
                        { id: "color", label: "Color" },
                        { id: "nyc", label: "NYC" },
                        { id: "patio", label: "Patio" },
                      ].map((opt) => {
                        const active = ringContent[layer.idx] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setRingAt(layer.idx, opt.id)}
                            style={{
                              ...labelStyle,
                              padding: "5px 6px",
                              backgroundColor: active ? Ink : "transparent",
                              color: active ? PaperBg : Muted,
                              border: `1px solid ${active ? Ink : Hairline}`,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              textAlign: "center",
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: rgbToHex(...frameColor),
                  border: `1px solid ${Hairline}`,
                }}
              />
              <div style={{ flex: 1 }}>
                {autoFrame ? (
                  <div style={{ fontSize: 12, color: Muted }}>
                    <span className="nc-mono">{rgbToHex(...frameColor).toUpperCase()}</span>
                    <span style={{ marginLeft: 8 }}>extracted from {photos.length || 0}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={manualFrame}
                    onChange={(e) => setManualFrame(e.target.value)}
                    style={{ ...inputBase, padding: "4px 8px" }}
                  />
                )}
              </div>
              {!autoFrame && (
                <input
                  type="color"
                  value={manualFrame}
                  onChange={(e) => setManualFrame(e.target.value)}
                  style={{
                    width: 40,
                    height: 40,
                    cursor: "pointer",
                    border: `1px solid ${Hairline}`,
                    padding: 0,
                    background: "transparent",
                  }}
                />
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={sectionLabel}>Warmth</span>
                  <span className="nc-mono" style={{ fontSize: 12, color: Muted }}>
                    {warmth > 0 ? "+" : ""}
                    {warmth}
                  </span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="1"
                  value={warmth}
                  onChange={(e) => setWarmth(parseInt(e.target.value))}
                  className="nc-range"
                />
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={sectionLabel}>Lightness</span>
                  <span className="nc-mono" style={{ fontSize: 12, color: Muted }}>
                    {lightness > 0 ? "+" : ""}
                    {lightness}
                  </span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="1"
                  value={lightness}
                  onChange={(e) => setLightness(parseInt(e.target.value))}
                  className="nc-range"
                />
              </div>
            </div>
          </section>

          {/* V — Type (caption + credits + mark for spread layouts) */}
          {layout !== "mark" && (
            <section>
              <div style={{ ...sectionLabel, marginBottom: 12 }}>V — Type</div>

              {/* Mark text + scale — only for spread layouts that render a
                  "NEST" headline as a structural element of the composition. */}
              {SPREAD_LAYOUTS.has(layout) && (
                <div
                  style={{
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottom: `1px solid ${Hairline}`,
                  }}
                >
                  {/* NEST logo on/off — hard switch. When OFF, every renderer
                      skips drawing the mark regardless of beat machine state. */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <span style={sectionLabel}>NEST logo</span>
                    <button
                      type="button"
                      onClick={() => setMarkEnabled(!markEnabled)}
                      style={{
                        ...labelStyle,
                        padding: "4px 8px",
                        backgroundColor: markEnabled ? Ink : "transparent",
                        color: markEnabled ? PaperBg : Muted,
                        border: `1px solid ${markEnabled ? Ink : Hairline}`,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {markEnabled ? "ON" : "OFF"}
                    </button>
                  </div>
                  <div style={{ ...sectionLabel, marginBottom: 4 }}>Mark text</div>
                  <input
                    value={markText}
                    onChange={(e) => setMarkText(e.target.value)}
                    placeholder="NEST"
                    style={{
                      ...inputBase,
                      fontFamily: '"Playfair Display", serif',
                      fontSize: 16,
                      fontWeight: 500,
                    }}
                  />

                  <div style={{ ...sectionLabel, marginTop: 12, marginBottom: 6 }}>
                    Mark scale
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                    {[
                      { id: "small", label: "S" },
                      { id: "medium", label: "M" },
                      { id: "large", label: "L · bleed" },
                    ].map((opt) => {
                      const active = markScale === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setMarkScale(opt.id)}
                          style={{
                            ...labelStyle,
                            padding: "6px 8px",
                            backgroundColor: active ? Ink : "transparent",
                            color: active ? PaperBg : Muted,
                            border: `1px solid ${active ? Ink : Hairline}`,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            textAlign: "center",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mark position — 3×3 anchor grid (Nested only). MC = inside
                      inner photo (default). Other cells anchor type to canvas
                      margins for top/bottom/corner placement variations. */}
                  {layout === "nested" && (
                    <>
                      <div style={{ ...sectionLabel, marginTop: 12, marginBottom: 6 }}>
                        Mark position
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                        {["TL", "TC", "TR", "ML", "MC", "MR", "BL", "BC", "BR"].map((pos) => {
                          const active = markPosition === pos;
                          return (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => setMarkPosition(pos)}
                              style={{
                                ...labelStyle,
                                padding: "8px 6px",
                                backgroundColor: active ? Ink : "transparent",
                                color: active ? PaperBg : Muted,
                                border: `1px solid ${active ? Ink : Hairline}`,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                textAlign: "center",
                              }}
                              title={pos === "MC" ? "Inside inner photo" : `Canvas anchor: ${pos}`}
                            >
                              {pos}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={sectionLabel}>Asset caption</span>
                  <button
                    type="button"
                    onClick={() => setShowCaption(!showCaption)}
                    style={toggleBtn(showCaption)}
                  >
                    {showCaption ? "ON" : "OFF"}
                  </button>
                </div>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={!showCaption}
                  style={{
                    ...inputBase,
                    color: showCaption ? Ink : Muted,
                    opacity: showCaption ? 1 : 0.5,
                  }}
                />

                {showCaption && (
                  <>
                    <div style={{ ...sectionLabel, marginTop: 10, marginBottom: 6 }}>
                      Caption position
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      {[
                        { id: "bottom-center", label: "Bottom center" },
                        { id: "top-center", label: "Top center" },
                        { id: "upper-right", label: "Upper right" },
                        { id: "lower-left", label: "Lower left" },
                      ].map((opt) => {
                        const active = captionPosition === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setCaptionPosition(opt.id)}
                            style={{
                              ...labelStyle,
                              padding: "6px 8px",
                              backgroundColor: active ? Ink : "transparent",
                              color: active ? PaperBg : Muted,
                              border: `1px solid ${active ? Ink : Hairline}`,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              textAlign: "center",
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div style={{ paddingTop: 16, borderTop: `1px solid ${Hairline}` }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={sectionLabel}>Photo credits</span>
                  <button
                    type="button"
                    onClick={() => setShowCredits(!showCredits)}
                    style={toggleBtn(showCredits)}
                  >
                    {showCredits ? "ON" : "OFF"}
                  </button>
                </div>
                {showCredits && (
                  <>
                    <div style={{ ...sectionLabel, marginBottom: 4 }}>Default contributor</div>
                    <input
                      value={defaultContributor}
                      onChange={(e) => setDefaultContributor(e.target.value)}
                      placeholder="@patiobeach"
                      style={inputBase}
                    />
                    <div style={{ ...sectionLabel, marginTop: 8 }}>
                      № auto-extracted from filename · per-photo overrides above
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* VI — Batch (always available since archive is auto-connected) */}
          {layout !== "mark" && (
            <section>
              <div style={{ ...sectionLabel, marginBottom: 12 }}>VI — Batch</div>
              <div style={{ padding: 16, border: `1px solid ${Hairline}` }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <span className="nc-serif" style={{ fontSize: 14, fontWeight: 500 }}>
                    Generate variations
                  </span>
                  <span style={{ ...labelStyle, color: Muted }}>contact sheet</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span style={sectionLabel}>Count</span>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={batchSize}
                    onChange={(e) =>
                      setBatchSize(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))
                    }
                    style={{
                      ...inputBase,
                      width: 64,
                      padding: "4px 8px",
                      textAlign: "center",
                      fontSize: 14,
                    }}
                  />
                  <span style={{ ...labelStyle, color: Muted }}>
                    · random sampling from {activePoolCount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={generateBatch}
                  disabled={batchGenerating || activePoolCount < requiredPhotos}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: Ink,
                    color: PaperBg,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    opacity: batchGenerating || activePoolCount < requiredPhotos ? 0.4 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  <Grid3x3 size={14} strokeWidth={1.5} />
                  <span style={{ fontSize: 12 }}>
                    {batchGenerating ? "Generating…" : `Generate ${batchSize} variations`}
                  </span>
                </button>
              </div>
            </section>
          )}

          {/* VII — Beat machine (audio-reactive parameter randomizer) */}
          <section>
            <div style={{ ...sectionLabel, marginBottom: 12 }}>VII — Beat machine</div>
            <div style={{ padding: 16, border: `1px solid ${Hairline}` }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span className="nc-serif" style={{ fontSize: 14, fontWeight: 500 }}>
                  Play the compositor to a beat
                </span>
              </div>

              {/* Source mode — file vs stream */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
                {[
                  { id: "file", label: "File" },
                  { id: "stream", label: "Stream" },
                ].map((opt) => {
                  const active = audioSourceMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => switchSourceMode(opt.id)}
                      style={{
                        ...labelStyle,
                        padding: "6px 8px",
                        backgroundColor: active ? Ink : "transparent",
                        color: active ? PaperBg : Muted,
                        border: `1px solid ${active ? Ink : Hairline}`,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "center",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Stream presets — only when stream mode is active */}
              {audioSourceMode === "stream" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, marginBottom: 8 }}>
                    {Object.entries(STREAM_PRESETS).map(([key, p]) => {
                      const active = streamPreset === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setStreamPreset(key)}
                          style={{
                            ...labelStyle,
                            padding: "6px 4px",
                            backgroundColor: active ? Ink : "transparent",
                            color: active ? PaperBg : Muted,
                            border: `1px solid ${active ? Ink : Hairline}`,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            textAlign: "center",
                            fontSize: 9,
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  {streamPreset === "custom" && (
                    <input
                      value={customStreamUrl}
                      onChange={(e) => setCustomStreamUrl(e.target.value)}
                      placeholder="https://example.com/stream"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        backgroundColor: "transparent",
                        border: `1px solid ${Hairline}`,
                        color: Ink,
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: 11,
                        boxSizing: "border-box",
                        marginBottom: 8,
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => applyStream(streamPreset, customStreamUrl)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      border: `1px solid ${Ink}`,
                      backgroundColor: "transparent",
                      color: Ink,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 12,
                    }}
                  >
                    Load stream
                  </button>
                </>
              )}

              {/* File picker — only when file mode is active and no audio loaded */}
              {audioSourceMode === "file" && !audioUrl ? (
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 12,
                    border: `1px dashed ${Hairline}`,
                    background: "transparent",
                    color: Ink,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  <Upload size={14} strokeWidth={1.5} />
                  <span className="nc-serif" style={{ fontSize: 13, fontWeight: 500 }}>
                    Pick a song
                  </span>
                  <span style={{ ...labelStyle, color: Muted, marginLeft: "auto" }}>
                    mp3, m4a, wav
                  </span>
                </button>
              ) : audioUrl ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 12,
                    border: `1px solid ${Hairline}`,
                    backgroundColor: Surface,
                  }}
                >
                  <Video size={14} strokeWidth={1.5} style={{ color: Muted }} />
                  <span style={{ flex: 1, fontSize: 12, color: Ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {audioName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlaying) onPlayPause();
                      if (audioUrl && audioUrl.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
                      setAudioUrl(null);
                      setAudioName("");
                      setBeatCount(0);
                      setCurrentRms(0);
                    }}
                    style={{ background: "transparent", border: "none", color: Muted, cursor: "pointer" }}
                    title="Remove audio"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : null}

              {/* Hidden file input — always present so the ref is stable
                  whether or not a song is currently loaded. */}
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handleAudioFile(file);
                  // Reset value so picking the same file again still fires onChange
                  e.target.value = "";
                }}
              />

              {/* Audio element — always mounted so ref attaches before play.
                  crossOrigin is conditional: "anonymous" for files (works
                  for blob URLs, enables Web Audio analysis), but null for
                  streams (otherwise the CORS preflight blocks loading on
                  servers like NTS/Lot that don't return CORS headers). */}
              <audio
                ref={audioRef}
                src={audioUrl || undefined}
                crossOrigin={audioSourceMode === "file" ? "anonymous" : null}
                onEnded={onAudioEnded}
                onError={handleAudioElementError}
                style={{ display: "none" }}
                preload="auto"
              />

              {/* Tempo mode — fixed-BPM trigger source. Use this as a
                  fallback when streams block CORS (audio plays but
                  analyser sees zeros), or as a tempo-driven mode that
                  needs no audio at all. */}
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: `1px solid ${Hairline}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span style={sectionLabel}>Tempo mode</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !tempoMode;
                      setTempoMode(next);
                      if (isPlaying) {
                        if (next) {
                          stopBeatLoop();
                          startTempoLoop();
                        } else {
                          stopTempoLoop();
                          if (audioRef.current && !audioRef.current.paused) startBeatLoop();
                        }
                      }
                    }}
                    style={{
                      ...labelStyle,
                      padding: "4px 8px",
                      backgroundColor: tempoMode ? Ink : "transparent",
                      color: tempoMode ? PaperBg : Muted,
                      border: `1px solid ${tempoMode ? Ink : Hairline}`,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {tempoMode ? "ON" : "OFF"}
                  </button>
                </div>
                {tempoMode && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={sectionLabel}>BPM</span>
                      <span className="nc-mono" style={{ fontSize: 11, color: Muted }}>
                        {bpm}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="200"
                      step="1"
                      value={bpm}
                      onChange={(e) => setBpm(parseInt(e.target.value))}
                      className="nc-range"
                    />
                    <div style={{ ...labelStyle, marginTop: 4, color: Muted }}>
                      Variations fire every {(60 / bpm).toFixed(2)}s · works with or without audio
                    </div>
                  </>
                )}
              </div>

              {/* Surface any audio errors here instead of crashing the tree */}
              {audioError && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 10,
                    border: `1px solid #c2675c`,
                    backgroundColor: "rgba(232, 90, 79, 0.08)",
                    color: "#a04a40",
                    fontSize: 11,
                    fontFamily: '"IBM Plex Mono", monospace',
                    lineHeight: 1.4,
                  }}
                >
                  <strong>Audio error:</strong> {audioError}
                </div>
              )}

              {/* Play / Pause + Beat counter */}
              {(audioUrl || tempoMode) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <button
                    type="button"
                    onClick={onPlayPause}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      backgroundColor: Ink,
                      color: PaperBg,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {isPlaying ? <Pause size={14} strokeWidth={1.5} /> : <Play size={14} strokeWidth={1.5} />}
                    <span style={{ fontSize: 12 }}>{isPlaying ? "Pause" : "Play"}</span>
                  </button>
                  <div
                    style={{
                      ...labelStyle,
                      padding: "10px 12px",
                      color: Muted,
                      border: `1px solid ${Hairline}`,
                      minWidth: 70,
                      textAlign: "center",
                    }}
                    title="Beats triggered so far"
                  >
                    {beatCount} ♪
                  </div>
                </div>
              )}

              {/* RMS level bar — shows whether Web Audio is actually
                  receiving data. Flat bar while audio plays = CORS blocked
                  Web Audio analysis (audio still plays via speakers).
                  Pulsing bar = analyser working, beats will fire. */}
              {audioUrl && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={sectionLabel}>Audio level</span>
                    <span className="nc-mono" style={{ fontSize: 10, color: Muted }}>
                      {(currentRms * 100).toFixed(0)}
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 6,
                      backgroundColor: Hairline,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: Ink,
                        width: `${Math.min(100, currentRms * 200)}%`,
                        transition: "width 0.08s linear",
                      }}
                    />
                  </div>
                  {isPlaying && currentRms < 0.005 && (
                    <div style={{ ...labelStyle, marginTop: 6, color: "#a04a40" }}>
                      Bar flat — likely CORS-blocked. Audio plays but beats can't fire.
                    </div>
                  )}
                </div>
              )}

              {/* Beat sensitivity (audio-driven mode only) */}
              {audioUrl && !tempoMode && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={sectionLabel}>Sensitivity</span>
                    <span className="nc-mono" style={{ fontSize: 11, color: Muted }}>
                      {beatThreshold.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.50"
                    step="0.01"
                    value={beatThreshold}
                    onChange={(e) => setBeatThreshold(parseFloat(e.target.value))}
                    className="nc-range"
                  />
                  <div style={{ ...labelStyle, marginTop: 4, color: Muted }}>
                    Lower = fires more often · higher = only on louder transients
                  </div>
                </div>
              )}

              {/* Cooldown (audio-driven mode only) */}
              {audioUrl && !tempoMode && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={sectionLabel}>Min interval</span>
                    <span className="nc-mono" style={{ fontSize: 11, color: Muted }}>
                      {beatCooldown}ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="800"
                    step="20"
                    value={beatCooldown}
                    onChange={(e) => setBeatCooldown(parseInt(e.target.value))}
                    className="nc-range"
                  />
                </div>
              )}

              {/* Record toggle */}
              {audioUrl && (
                <div style={{ marginTop: 12 }}>
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={onStartRecording}
                      disabled={!isPlaying}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        border: `1px solid ${Hairline}`,
                        color: Ink,
                        background: "transparent",
                        cursor: isPlaying ? "pointer" : "default",
                        fontFamily: "inherit",
                        opacity: isPlaying ? 1 : 0.5,
                      }}
                      title={isPlaying ? "Start recording the sequence" : "Press Play first"}
                    >
                      <Video size={13} strokeWidth={1.5} />
                      <span style={{ fontSize: 12 }}>Record sequence</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onStopRecording}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        backgroundColor: Ink,
                        color: PaperBg,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "#e85a4f",
                        }}
                      />
                      <span style={{ fontSize: 12 }}>Stop recording</span>
                    </button>
                  )}
                </div>
              )}

              {/* Output video */}
              {outputVideoUrl && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: `1px solid ${Hairline}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={sectionLabel}>Output · {outputMime.split("/")[1]}</span>
                    <button
                      type="button"
                      onClick={downloadBeatVideo}
                      style={{
                        ...labelStyle,
                        padding: "5px 10px",
                        backgroundColor: Ink,
                        color: PaperBg,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Download size={11} strokeWidth={1.5} /> Download
                    </button>
                  </div>
                  <video
                    src={outputVideoUrl}
                    controls
                    loop
                    playsInline
                    style={{ width: "100%", display: "block", border: `1px solid ${Hairline}` }}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Export */}
          {view === "single" && (
            <section>
              <button
                type="button"
                onClick={handleDownload}
                disabled={layout !== "mark" && photos.length < requiredPhotos}
                style={{
                  width: "100%",
                  padding: "16px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: Ink,
                  color: PaperBg,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  opacity: layout !== "mark" && photos.length < requiredPhotos ? 0.3 : 1,
                  transition: "opacity 0.15s ease",
                }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                  <Download size={18} strokeWidth={1.5} />
                  <span className="nc-serif" style={{ fontSize: 16, fontWeight: 500 }}>
                    Export PNG
                  </span>
                </div>
                <span style={{ ...labelStyle, opacity: 0.6 }}>
                  {dimensions.w}×{dimensions.h}
                </span>
              </button>
              {layout !== "mark" && photos.length < requiredPhotos && (
                <div
                  style={{
                    ...labelStyle,
                    marginTop: 8,
                    textAlign: "center",
                    color: Muted,
                  }}
                >
                  {requiredPhotos - photos.length} more required
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right column — preview / batch */}
        <div style={{ gridColumn: "span 8" }}>
          <div style={{ position: "sticky", top: 32 }}>
            {view === "single" && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <div style={sectionLabel}>Preview</div>
                  <div className="nc-mono" style={{ ...labelStyle, color: Muted }}>
                    {layout.toUpperCase()} · {aspect} · {rgbToHex(...frameColor).toUpperCase()} ·{" "}
                    {photoScale.toFixed(2)}×
                  </div>
                </div>
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 32,
                    backgroundColor: Surface,
                    border: `1px solid ${Hairline}`,
                    minHeight: 600,
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "70vh",
                      height: "auto",
                      width: aspect === "1:1" ? 600 : aspect === "9:16" ? 380 : 720,
                      display: "block",
                      boxShadow: "0 20px 60px rgba(42, 38, 32, 0.15)",
                    }}
                  />
                </div>
              </>
            )}

            {view === "batch" && batchVariants.length > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setView("single")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: Muted,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        padding: 0,
                      }}
                    >
                      <ArrowLeft size={12} /> back to single
                    </button>
                    <span style={sectionLabel}>
                      Contact sheet · {batchVariants.length} variations
                    </span>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    {favoriteIdx.size > 0 && (
                      <span className="nc-mono" style={{ ...labelStyle, color: Muted }}>
                        {favoriteIdx.size} selected
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={downloadSelected}
                      style={{
                        padding: "8px 12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        backgroundColor: Ink,
                        color: PaperBg,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Download size={12} strokeWidth={1.5} />
                      <span style={{ fontSize: 12 }}>
                        {favoriteIdx.size > 0
                          ? `Download selected (${favoriteIdx.size})`
                          : "Download all"}
                      </span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    width: "100%",
                    padding: 24,
                    backgroundColor: Surface,
                    border: `1px solid ${Hairline}`,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gap: 16,
                      gridTemplateColumns: `repeat(${aspect === "1:1" ? 3 : 4}, 1fr)`,
                    }}
                  >
                    {batchVariants.map((v, i) => {
                      const isFav = favoriteIdx.has(i);
                      return (
                        <div key={v.id} style={{ position: "relative" }}>
                          <img
                            src={v.dataUrl}
                            alt={`Variant ${i + 1}`}
                            style={{
                              width: "100%",
                              height: "auto",
                              display: "block",
                              cursor: "pointer",
                              boxShadow: isFav
                                ? `0 0 0 3px ${Ink}, 0 12px 30px rgba(42, 38, 32, 0.2)`
                                : "0 8px 24px rgba(42, 38, 32, 0.1)",
                              transition: "box-shadow 0.15s ease",
                            }}
                            onClick={() => downloadVariant(v, i)}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(i);
                            }}
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              padding: 6,
                              backgroundColor: isFav ? Ink : Surface,
                              color: isFav ? PaperBg : Ink,
                              border: "none",
                              cursor: "pointer",
                              opacity: isFav ? 1 : 0.6,
                              transition: "opacity 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.opacity = isFav ? 1 : 0.6)
                            }
                          >
                            <Star size={12} strokeWidth={1.5} fill={isFav ? PaperBg : "none"} />
                          </button>
                          <div
                            className="nc-mono"
                            style={{
                              ...labelStyle,
                              marginTop: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              color: Muted,
                            }}
                          >
                            <span>{String(i + 1).padStart(2, "0")}</span>
                            <span>{rgbToHex(...v.frameColor).toUpperCase()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    ...labelStyle,
                    marginTop: 16,
                    textAlign: "center",
                    color: Muted,
                  }}
                >
                  Click any variation to download · star to mark for selective batch · selection
                  over volume
                </div>
              </>
            )}

            <div style={{ ...labelStyle, marginTop: 16, color: Muted }}>
              Field of Action · Press · Nest Compositor
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default export — wraps the inner component in the error boundary so any
// render/effect crash surfaces as a visible stack trace instead of a black
// screen. Recovery is one click ("Try to recover") for transient bugs.
export default function NestCompositor(props) {
  return (
    <NestCompositorErrorBoundary>
      <NestCompositorInner {...props} />
    </NestCompositorErrorBoundary>
  );
}
