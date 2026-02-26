import React, { useState, useRef, useEffect, useCallback } from "react";

function detectProvider(url) {
  if (!url) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return "native";
  return null;
}

function extractYouTubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
  return m ? m[1] : null;
}

function extractVimeoId(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

export default function VideoEmbed({ url, poster, caption }) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const containerRef = useRef(null);
  const reduceMotion = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Lazy: only render iframe/video when visible in viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handlePlay = useCallback(() => {
    if (visible) setLoaded(true);
  }, [visible]);

  const provider = detectProvider(url);

  // Reduced motion: poster + link only
  if (reduceMotion.current) {
    return (
      <div className="ve-container" ref={containerRef}>
        <div className="ve-aspect">
          {poster && <img className="ve-poster" src={poster} alt="" />}
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="ve-link">
              Watch video ↗
            </a>
          )}
        </div>
        {caption && <div className="ve-caption">{caption}</div>}
      </div>
    );
  }

  return (
    <div className="ve-container" ref={containerRef}>
      <div className="ve-aspect">
        {/* Poster + play button */}
        {!loaded && (
          <>
            {poster && <img className="ve-poster" src={poster} alt="" />}
            {url && (
              <button className="ve-play" onClick={handlePlay} aria-label="Play video">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <polygon points="5,3 17,10 5,17" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Loaded: render provider-specific embed */}
        {loaded && provider === "youtube" && (
          <iframe
            src={`https://www.youtube.com/embed/${extractYouTubeId(url)}?autoplay=1&rel=0`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Video"
          />
        )}
        {loaded && provider === "vimeo" && (
          <iframe
            src={`https://player.vimeo.com/video/${extractVimeoId(url)}?autoplay=1`}
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Video"
          />
        )}
        {loaded && provider === "native" && (
          <video src={url} controls autoPlay preload="metadata" poster={poster || undefined} />
        )}
      </div>
      {caption && <div className="ve-caption">{caption}</div>}
    </div>
  );
}
