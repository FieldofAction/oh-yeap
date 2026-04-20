import { useRef } from "react";

const THRESHOLD = 50;
const MAX_TIME = 600;

// Returns touch handlers that invoke onNext on left-swipe and onPrev on
// right-swipe. Short taps and vertical drags pass through untouched so
// existing click-to-close and scroll behavior still work.
export default function useSwipeNav({ onNext, onPrev }) {
  const start = useRef(null);
  const onTouchStart = (e) => {
    const t = e.changedTouches[0];
    start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    if (!start.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    const dt = Date.now() - start.current.t;
    start.current = null;
    if (dt > MAX_TIME) return;
    if (Math.abs(dx) < THRESHOLD) return;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) onNext?.();
    else onPrev?.();
  };
  return { onTouchStart, onTouchEnd };
}
