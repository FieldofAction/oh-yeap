import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Upload,
  Download,
  X,
  Square,
  Smartphone,
  Columns,
  LayoutGrid,
  Play,
  Pause,
  Video,
  FolderOpen,
  RotateCcw,
  ArrowLeft,
  Shuffle,
  Plus,
  Film,
} from "lucide-react";
import {
  PaperBg,
  Ink,
  Muted,
  Hairline,
  Surface,
  labelStyle,
  rgbToHex,
  toneShift,
  extractDominantFromImages,
  loadAndDownscale,
  loadFromUrl,
  drawPhotoSquare,
  layoutPositions,
  requiredFor,
  buildPatioBeachPool,
} from "../lib/pressHelpers";
import { MONTHS as PATIO_BEACH_MONTHS } from "./PatioBeach";

// Press · Nest Reel — color-shifting WebM maker for the Nest edition.
//
// Each beat shows N photos at the chosen layout's positions (Single = 1,
// Juxtapose = 2, Synthesis = 3). Both the photos and the field color
// hard-cut to the next group at every beat — no crossfade. The change of
// color IS the moment, percussive rather than smooth.

// ---------- frame render ----------

const renderReelFrame = (canvas, t, photos, params) => {
  if (!photos.length) return;
  const groupSize = requiredFor(params.layout);
  const groupCount = Math.floor(photos.length / groupSize);
  if (groupCount === 0) return;

  const W = 1080;
  const H = params.aspect === "1:1" ? 1080 : 1920;
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext("2d");

  const total = groupCount * params.secondsPerPhoto;
  const tNorm = ((t % total) + total) % total;
  const groupIdx = Math.floor(tNorm / params.secondsPerPhoto);
  const groupStart = groupIdx * groupSize;
  const groupPhotos = photos.slice(groupStart, groupStart + groupSize);

  // Field color — single photo uses its own dominant; multi-photo groups
  // use the precomputed cross-photo dominant from params.groupColors.
  const baseColor =
    params.groupColors && params.groupColors[groupIdx]
      ? params.groupColors[groupIdx]
      : groupPhotos[0].color;
  const fieldColor = toneShift(baseColor, {
    warmth: params.warmth,
    lightness: params.lightness,
  });

  ctx.fillStyle = `rgb(${fieldColor[0]}, ${fieldColor[1]}, ${fieldColor[2]})`;
  ctx.fillRect(0, 0, W, H);

  const positions = layoutPositions(params.layout, params.aspect, params.photoScale);
  const lum = fieldColor[0] * 0.299 + fieldColor[1] * 0.587 + fieldColor[2] * 0.114;
  const inkRGB = lum > 140 ? "38, 32, 26" : "245, 238, 225";

  positions.forEach((pos, i) => {
    const photo = groupPhotos[i];
    if (!photo) return;
    drawPhotoSquare(ctx, photo.image, pos.x, pos.y, pos.size);

    if (params.showCredits) {
      const num = photo.number || "";
      const ctb = (photo.contributor || params.defaultContributor || "").trim();
      if (num || ctb) {
        const captionFontSize = Math.max(11, Math.min(18, Math.round(pos.size / 28)));
        ctx.font = `400 ${captionFontSize}px "IBM Plex Mono", monospace`;
        ctx.fillStyle = `rgba(${inkRGB}, 0.78)`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const sep = num && ctb ? "  —  " : "";
        const text = `${num ? `№ ${num}` : ""}${sep}${ctb}`;
        ctx.fillText(text, pos.x + pos.size / 2, pos.y + pos.size + Math.max(14, captionFontSize * 0.9));
      }
    }
  });

  if (params.showCaption && params.caption) {
    ctx.fillStyle = `rgba(${inkRGB}, 0.85)`;
    const fontSize = params.aspect === "1:1" ? 18 : 22;
    ctx.font = `500 ${fontSize}px "IBM Plex Mono", monospace`;
    ctx.textBaseline = "middle";
    const text = params.caption.toUpperCase();
    const spacing = 3;
    const widths = text.split("").map((ch) => ctx.measureText(ch).width);
    const totalW = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
    const cx = W / 2;
    const cy = params.aspect === "1:1" ? H - 50 : H - 70;
    let x = cx - totalW / 2;
    ctx.textAlign = "left";
    for (let i = 0; i < text.length; i++) {
      ctx.fillText(text[i], x, cy);
      x += widths[i] + spacing;
    }
  }
};

// ---------- main ----------

const MAX_PHOTOS = 50;

export default function NestReel({ navigateTo }) {
  const [layout, setLayout] = useState("single");
  const [aspect, setAspect] = useState("1:1");
  const [photos, setPhotos] = useState([]);
  const [secondsPerPhoto, setSecondsPerPhoto] = useState(1.5);
  const [photoScale, setPhotoScale] = useState(0.85);
  const [warmth, setWarmth] = useState(0);
  const [lightness, setLightness] = useState(0);
  const [caption, setCaption] = useState("PATIO BEACH — NEST REEL");
  const [showCaption, setShowCaption] = useState(true);
  const [showCredits, setShowCredits] = useState(true);
  const [defaultContributor, setDefaultContributor] = useState("@patiobeach");
  const [playing, setPlaying] = useState(true);

  const [pool, setPool] = useState([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolProgress, setPoolProgress] = useState({ done: 0, total: 0 });
  const [shuffleLoading, setShuffleLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState({ done: 0, total: 0 });
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputMime, setOutputMime] = useState("video/webm");

  const canvasRef = useRef(null);
  const recordCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const animFrameRef = useRef(null);

  const archivePool = useMemo(() => buildPatioBeachPool(PATIO_BEACH_MONTHS), []);
  const usingArchive = pool.length === 0;
  const activePoolCount = usingArchive ? archivePool.length : pool.length;

  const groupSize = requiredFor(layout);
  const groupCount = Math.floor(photos.length / groupSize);
  const usedPhotoCount = groupCount * groupSize;

  // Precompute the field color for each beat. Single layout uses each
  // photo's own dominant; multi-photo groups use the cross-photo dominant
  // so the field is honest to all the photos in the group, not just the
  // first one.
  const groupColors = useMemo(() => {
    const out = [];
    for (let i = 0; i + groupSize <= photos.length; i += groupSize) {
      const group = photos.slice(i, i + groupSize);
      if (groupSize === 1) {
        out.push(group[0].color);
      } else {
        out.push(extractDominantFromImages(group.map((p) => p.image)));
      }
    }
    return out;
  }, [photos, groupSize]);

  const dimensions = aspect === "1:1" ? { w: 1080, h: 1080 } : { w: 1080, h: 1920 };
  const totalDuration = groupCount * secondsPerPhoto;

  useEffect(() => {
    if (document.querySelector("link[data-press-fonts]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap";
    link.setAttribute("data-press-fonts", "1");
    document.head.appendChild(link);
  }, []);

  // Live preview animation loop. Re-binds on any param change so the next
  // frame reflects current settings.
  useEffect(() => {
    if (!playing || !photos.length) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const start = performance.now();
    const params = {
      layout,
      aspect,
      secondsPerPhoto,
      photoScale,
      warmth,
      lightness,
      caption,
      showCaption,
      showCredits,
      defaultContributor,
      groupColors,
    };
    const loop = (now) => {
      const elapsed = (now - start) / 1000;
      if (canvasRef.current) renderReelFrame(canvasRef.current, elapsed, photos, params);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    photos,
    playing,
    layout,
    aspect,
    secondsPerPhoto,
    photoScale,
    warmth,
    lightness,
    caption,
    showCaption,
    showCredits,
    defaultContributor,
    groupColors,
  ]);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [outputUrl]);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const loaded = await Promise.all(files.map((f) => loadAndDownscale(f)));
    setPhotos((prev) => [...prev, ...loaded].slice(0, MAX_PHOTOS));
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

  const removePhoto = (idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx));
  const clearPhotos = () => {
    setPhotos([]);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl(null);
  };
  const clearPool = () => setPool([]);

  // Pull N random items from the active source (archive or custom folder).
  // For archive items we lazy-load the image data here.
  const sampleFromActive = async (count) => {
    if (activePoolCount === 0 || count <= 0) return [];
    if (usingArchive) {
      const picked = [...archivePool].sort(() => Math.random() - 0.5).slice(0, count);
      return Promise.all(picked.map((p) => loadFromUrl(p.path, { n: p.n, by: p.by })));
    }
    return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  };

  const loadRandomReel = async (count) => {
    setShuffleLoading(true);
    try {
      const loaded = await sampleFromActive(count);
      setPhotos(loaded);
    } finally {
      setShuffleLoading(false);
    }
  };

  const addRandom = async (count) => {
    const room = MAX_PHOTOS - photos.length;
    const need = Math.min(count, room);
    if (need <= 0) return;
    setShuffleLoading(true);
    try {
      const loaded = await sampleFromActive(need);
      setPhotos((prev) => [...prev, ...loaded].slice(0, MAX_PHOTOS));
    } finally {
      setShuffleLoading(false);
    }
  };

  // Render to WebM via MediaRecorder. Records the offscreen canvas in
  // wall-clock time — a 75-second reel takes 75 seconds to render. The
  // tradeoff is no library dependency. Codec preference: VP9 → VP8 → fallback.
  const renderToVideo = async () => {
    if (!photos.length) return;
    setRecording(true);
    setRecordProgress({ done: 0, total: totalDuration });

    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl(null);
    }

    const canvas = recordCanvasRef.current;
    const W = 1080;
    const H = aspect === "1:1" ? 1080 : 1920;
    canvas.width = W;
    canvas.height = H;

    const params = {
      layout,
      aspect,
      secondsPerPhoto,
      photoScale,
      warmth,
      lightness,
      caption,
      showCaption,
      showCredits,
      defaultContributor,
      groupColors,
    };

    // Paint first frame so the stream has something to capture immediately.
    renderReelFrame(canvas, 0, photos, params);

    const stream = canvas.captureStream(30);
    const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    const supported = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "video/webm";
    setOutputMime(supported.split(";")[0]);
    const recorder = new MediaRecorder(stream, {
      mimeType: supported,
      videoBitsPerSecond: 5_000_000,
    });
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: supported.split(";")[0] });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setRecording(false);
    };

    recorder.start(100);

    const start = performance.now();
    const loop = (now) => {
      const elapsed = (now - start) / 1000;
      if (elapsed >= totalDuration) {
        renderReelFrame(canvas, totalDuration - 0.001, photos, params);
        setTimeout(() => {
          if (recorder.state !== "inactive") recorder.stop();
        }, 150);
        return;
      }
      renderReelFrame(canvas, elapsed, photos, params);
      setRecordProgress({ done: elapsed, total: totalDuration });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  const downloadVideo = () => {
    if (!outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    const ext = outputMime.includes("webm") ? "webm" : "mp4";
    const aspectName = aspect === "1:1" ? "1x1" : "9x16";
    a.download = `nest_reel_${aspectName}.${ext}`;
    a.click();
  };

  // ---------- shared style fragments ----------

  const sectionLabel = { ...labelStyle, color: Muted };

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

  const recPctDone = totalDuration > 0 ? Math.min(1, recordProgress.done / totalDuration) : 0;

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
        .nr-serif { font-family: "Playfair Display", Georgia, serif; }
        .nr-mono { font-family: "IBM Plex Mono", monospace; }
        .nr-photo-thumb { position: relative; aspect-ratio: 1 / 1; }
        .nr-photo-thumb .nr-photo-delete { opacity: 0; transition: opacity 0.15s ease; }
        .nr-photo-thumb:hover .nr-photo-delete { opacity: 1; }
        .nr-range { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; }
        .nr-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; background: ${Ink}; border-radius: 50%; cursor: pointer; }
        .nr-range::-webkit-slider-runnable-track { height: 1px; background: ${Hairline}; }
        .nr-range::-moz-range-thumb { width: 14px; height: 14px; background: ${Ink}; border: none; border-radius: 50%; cursor: pointer; }
        .nr-range::-moz-range-track { height: 1px; background: ${Hairline}; }
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
              className="nr-serif"
              style={{ fontSize: 24, letterSpacing: "-0.02em", fontWeight: 500 }}
            >
              Nest <span style={{ fontStyle: "italic", color: Muted }}>reel</span>
            </span>
            <span style={{ ...labelStyle, color: Muted }}>
              Patio Beach × Field of Action
            </span>
          </div>
          <div style={{ ...labelStyle, color: Muted }}>
            {dimensions.w} × {dimensions.h} · {photos.length}/{MAX_PHOTOS} photos · {groupCount} beat{groupCount === 1 ? "" : "s"} · {totalDuration.toFixed(1)}s
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          padding: 32,
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 32,
        }}
      >
        {/* Left column */}
        <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: 32 }}>
          {/* I — Layout */}
          <section>
            <div style={{ ...sectionLabel, marginBottom: 12 }}>I — Layout</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { id: "single", label: "Single", n: "I", icon: Square, desc: "1 photo" },
                { id: "juxtapose", label: "Juxtapose", n: "II", icon: Columns, desc: "2 photos" },
                { id: "synthesis", label: "Synthesis", n: "III", icon: LayoutGrid, desc: "3 photos" },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = layout === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLayout(opt.id)}
                    style={aspectBtn(active)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Icon size={16} strokeWidth={1.5} />
                      <span style={{ ...labelStyle, opacity: 0.6 }}>{opt.n}</span>
                    </div>
                    <div className="nr-serif" style={{ fontSize: 14, fontWeight: 500 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { id: "1:1", label: "Square", dims: "1080 × 1080", icon: Square },
                { id: "9:16", label: "Vertical", dims: "1080 × 1920", icon: Smartphone },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = aspect === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setAspect(opt.id)} style={aspectBtn(active)}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Icon size={16} strokeWidth={1.5} />
                      <span style={{ ...labelStyle, opacity: 0.6 }}>{opt.id}</span>
                    </div>
                    <div className="nr-serif" style={{ fontSize: 14, fontWeight: 500 }}>
                      {opt.label}
                    </div>
                    <div style={{ ...labelStyle, marginTop: 4, opacity: 0.6 }}>{opt.dims}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* III — Source */}
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
                III — Source · {photos.length}/{MAX_PHOTOS} active
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

            {/* Active source indicator (archive or custom folder) */}
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
              }}
            >
              <FolderOpen size={18} strokeWidth={1.5} />
              <div style={{ flex: 1 }}>
                <div className="nr-serif" style={{ fontSize: 14, fontWeight: 500 }}>
                  {poolLoading
                    ? `Loading ${poolProgress.done}/${poolProgress.total}…`
                    : usingArchive
                    ? `Patio Beach archive · ${archivePool.length} posts`
                    : `Custom folder · ${pool.length} photos`}
                </div>
                <div style={{ ...labelStyle, marginTop: 4, opacity: 0.6 }}>
                  {usingArchive ? "auto-connected" : "shuffle uses this folder"}
                </div>
              </div>
            </div>

            {/* Reel actions */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 8,
              }}
            >
              <button
                type="button"
                onClick={() => loadRandomReel(12)}
                disabled={shuffleLoading || activePoolCount === 0}
                style={{
                  padding: "8px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  border: `1px solid ${Hairline}`,
                  color: Ink,
                  background: "transparent",
                  cursor: shuffleLoading ? "default" : "pointer",
                  fontFamily: "inherit",
                  fontSize: 12,
                  opacity: shuffleLoading || activePoolCount === 0 ? 0.5 : 1,
                  transition: "all 0.15s ease",
                }}
                title="Replace reel with 12 random"
              >
                <Shuffle size={13} strokeWidth={1.5} />
                <span>{shuffleLoading ? "Loading…" : "Reel of 12"}</span>
              </button>
              <button
                type="button"
                onClick={() => addRandom(6)}
                disabled={shuffleLoading || activePoolCount === 0 || photos.length >= MAX_PHOTOS}
                style={{
                  padding: "8px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  border: `1px solid ${Hairline}`,
                  color: Ink,
                  background: "transparent",
                  cursor: shuffleLoading ? "default" : "pointer",
                  fontFamily: "inherit",
                  fontSize: 12,
                  opacity:
                    shuffleLoading || activePoolCount === 0 || photos.length >= MAX_PHOTOS
                      ? 0.5
                      : 1,
                  transition: "all 0.15s ease",
                }}
                title="Append 6 more random"
              >
                <Plus size={13} strokeWidth={1.5} />
                <span>Add 6</span>
              </button>
            </div>

            {/* Manual upload + folder picker */}
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
                padding: 16,
                marginTop: 12,
                textAlign: "center",
                border: `1px dashed ${dragOver ? Ink : Hairline}`,
                backgroundColor: dragOver ? Surface : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <Upload
                size={16}
                strokeWidth={1.5}
                style={{ color: Muted, display: "block", margin: "0 auto 6px" }}
              />
              <div className="nr-serif" style={{ fontSize: 13, fontWeight: 500 }}>
                Drop photos
              </div>
              <div style={{ ...labelStyle, marginTop: 2, color: Muted }}>
                manual append
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />

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
            {!usingArchive && (
              <button
                type="button"
                onClick={clearPool}
                style={{
                  ...labelStyle,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6,
                  marginLeft: 12,
                  background: "transparent",
                  border: "none",
                  color: Muted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                <X size={11} /> Switch back to archive
              </button>
            )}
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

            {/* Photo strip */}
            {photos.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: 4,
                  marginTop: 12,
                }}
              >
                {photos.map((p, i) => (
                  <div key={i} className="nr-photo-thumb">
                    <img
                      src={p.url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="nr-photo-delete"
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        padding: 2,
                        backgroundColor: Ink,
                        color: PaperBg,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <X size={10} />
                    </button>
                    <div
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        width: 8,
                        height: 8,
                        backgroundColor: rgbToHex(...p.color),
                        border: "1px solid rgba(255,255,255,0.6)",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* IV — Pace */}
          <section>
            <div style={{ ...sectionLabel, marginBottom: 12 }}>IV — Pace</div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={sectionLabel}>Seconds per photo</span>
                <span className="nr-mono" style={{ fontSize: 12, color: Muted }}>
                  {secondsPerPhoto.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={secondsPerPhoto}
                onChange={(e) => setSecondsPerPhoto(parseFloat(e.target.value))}
                className="nr-range"
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <span className="nr-mono" style={{ fontSize: 9, color: Muted }}>
                  snappy
                </span>
                <span className="nr-mono" style={{ fontSize: 9, color: Muted }}>
                  contemplative
                </span>
              </div>
            </div>
            <div style={{ ...labelStyle, marginTop: 12, color: Muted }}>
              Photo and field color hard-cut together at each boundary
            </div>
          </section>

          {/* V — Composition */}
          <section>
            <div style={{ ...sectionLabel, marginBottom: 12 }}>V — Composition</div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={sectionLabel}>Photo scale · nesting</span>
                <span className="nr-mono" style={{ fontSize: 12, color: Muted }}>
                  {photoScale.toFixed(2)}×
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.1"
                step="0.01"
                value={photoScale}
                onChange={(e) => setPhotoScale(parseFloat(e.target.value))}
                className="nr-range"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
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
                  <span className="nr-mono" style={{ fontSize: 12, color: Muted }}>
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
                  className="nr-range"
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
                  <span className="nr-mono" style={{ fontSize: 12, color: Muted }}>
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
                  className="nr-range"
                />
              </div>
            </div>
          </section>

          {/* VI — Type */}
          <section>
            <div style={{ ...sectionLabel, marginBottom: 12 }}>VI — Type</div>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={sectionLabel}>Reel caption</span>
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
                    Each frame shows № + contributor of its photo
                  </div>
                </>
              )}
            </div>
          </section>

          {/* VI — Render */}
          <section>
            <button
              type="button"
              onClick={renderToVideo}
              disabled={recording || groupCount < 2}
              style={{
                width: "100%",
                padding: "16px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: Ink,
                color: PaperBg,
                border: "none",
                cursor: recording ? "default" : "pointer",
                fontFamily: "inherit",
                opacity: recording || groupCount < 2 ? 0.4 : 1,
                transition: "opacity 0.15s ease",
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                <Video size={18} strokeWidth={1.5} />
                <span className="nr-serif" style={{ fontSize: 16, fontWeight: 500 }}>
                  {recording
                    ? `Recording · ${recordProgress.done.toFixed(1)}/${totalDuration.toFixed(1)}s`
                    : "Render reel"}
                </span>
              </div>
              <span style={{ ...labelStyle, opacity: 0.6 }}>
                {recording ? `${Math.round(recPctDone * 100)}%` : `~${totalDuration.toFixed(0)}s`}
              </span>
            </button>
            {groupCount < 2 && (
              <div
                style={{
                  ...labelStyle,
                  marginTop: 8,
                  textAlign: "center",
                  color: Muted,
                }}
              >
                {2 * groupSize - photos.length} more photo
                {2 * groupSize - photos.length === 1 ? "" : "s"} required for a 2-beat reel
              </div>
            )}
            {recording && (
              <div
                style={{
                  marginTop: 8,
                  height: 2,
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
                    width: `${recPctDone * 100}%`,
                    transition: "width 0.15s linear",
                  }}
                />
              </div>
            )}
            {recording && (
              <div style={{ ...labelStyle, marginTop: 6, color: Muted, textAlign: "center" }}>
                Real-time recording — keep this tab in focus
              </div>
            )}
          </section>
        </div>

        {/* Right column — preview / output */}
        <div style={{ gridColumn: "span 8" }}>
          <div style={{ position: "sticky", top: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                <div style={sectionLabel}>Preview</div>
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  disabled={!photos.length}
                  style={{
                    ...labelStyle,
                    padding: "4px 8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    border: `1px solid ${Hairline}`,
                    backgroundColor: "transparent",
                    color: photos.length ? Ink : Muted,
                    cursor: photos.length ? "pointer" : "default",
                    fontFamily: "inherit",
                    opacity: photos.length ? 1 : 0.5,
                  }}
                >
                  {playing ? <Pause size={11} /> : <Play size={11} />}
                  {playing ? "Pause" : "Play"}
                </button>
              </div>
              <div className="nr-mono" style={{ ...labelStyle, color: Muted }}>
                {layout.toUpperCase()} · {aspect} · {groupCount} beat{groupCount === 1 ? "" : "s"} · {totalDuration.toFixed(1)}s loop{usedPhotoCount < photos.length ? ` · ${photos.length - usedPhotoCount} unused` : ""}
              </div>
            </div>

            {/* Live preview canvas */}
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
              {photos.length === 0 ? (
                <div style={{ textAlign: "center", color: Muted }}>
                  <Film
                    size={28}
                    strokeWidth={1.5}
                    style={{ display: "block", margin: "0 auto 12px" }}
                  />
                  <div className="nr-serif" style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>
                    Build a reel
                  </div>
                  <div style={{ fontSize: 12, maxWidth: 280, margin: "0 auto" }}>
                    Hit "Reel of 12" to grab a random sequence from the Patio Beach archive.
                  </div>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                    height: "auto",
                    width: aspect === "1:1" ? 600 : 380,
                    display: "block",
                    boxShadow: "0 20px 60px rgba(42, 38, 32, 0.15)",
                  }}
                />
              )}
            </div>

            {/* Output video */}
            {outputUrl && (
              <div style={{ marginTop: 24 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div style={sectionLabel}>Output · {outputMime.split("/")[1]}</div>
                  <button
                    type="button"
                    onClick={downloadVideo}
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
                    }}
                  >
                    <Download size={12} strokeWidth={1.5} />
                    <span style={{ fontSize: 12 }}>Download reel</span>
                  </button>
                </div>
                <div
                  style={{
                    padding: 24,
                    backgroundColor: Surface,
                    border: `1px solid ${Hairline}`,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <video
                    src={outputUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      maxWidth: "100%",
                      maxHeight: "60vh",
                      width: aspect === "1:1" ? 480 : 320,
                      display: "block",
                      boxShadow: "0 20px 60px rgba(42, 38, 32, 0.15)",
                    }}
                  />
                </div>
                <div style={{ ...labelStyle, marginTop: 8, color: Muted, textAlign: "center" }}>
                  WebM plays on most platforms; for Instagram in-feed convert to MP4 externally
                </div>
              </div>
            )}

            {/* Hidden recording canvas — used by MediaRecorder. Kept off-screen
                because driving captureStream from the visible canvas while it's
                also under the live-preview rAF loop would cause conflicts. */}
            <canvas
              ref={recordCanvasRef}
              style={{ position: "absolute", left: -9999, top: -9999, width: 1, height: 1 }}
            />

            <div style={{ ...labelStyle, marginTop: 24, color: Muted }}>
              Field of Action · Press · Nest Reel
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
