import { useRef, useState } from "react";

const COMMIT_RATIO = 0.22;   // swipe past 22% of width to commit
const VELOCITY_COMMIT = 0.5; // px/ms — fast flick commits earlier
const AXIS_LOCK = 10;        // px before locking to x or y axis
const FLY_MS = 200;          // committed: exit animation
const ENTER_MS = 300;        // committed: new content slide-in
const SPRING_MS = 280;       // not committed: spring back

const CURVE_OUT = "cubic-bezier(0.32, 0.72, 0.32, 1)";
const CURVE_IN  = "cubic-bezier(0.22, 1, 0.36, 1)";

// Returns:
//   bind  — touch handlers to spread on the outer overlay
//   style — transform/opacity/transition to spread on the sliding content
// Slide tracks the finger live, springs back on short swipes, and on a
// committed swipe glides out → new content enters from the opposite edge.
export default function useSwipeNav({ onNext, onPrev, canNext = true, canPrev = true }) {
  const [dragX, setDragX] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | drag | fly | reset | enter | spring
  const start = useRef(null);
  const axis = useRef(null);

  const width = typeof window !== "undefined" ? window.innerWidth : 1;

  const onTouchStart = (e) => {
    const t = e.changedTouches[0];
    start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    axis.current = null;
    setPhase("drag");
    setDragX(0);
  };

  const onTouchMove = (e) => {
    if (!start.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    if (!axis.current) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (axis.current !== "x") return;
    // Light elastic resistance when swiping beyond a committable distance
    // in the direction that has no neighbor.
    const blocked = (dx < 0 && !canNext) || (dx > 0 && !canPrev);
    setDragX(blocked ? dx * 0.25 : dx);
  };

  const onTouchEnd = (e) => {
    if (!start.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.current.x;
    const dt = Date.now() - start.current.t;
    const committed =
      axis.current === "x" &&
      (Math.abs(dx) > width * COMMIT_RATIO ||
        Math.abs(dx) / Math.max(dt, 1) > VELOCITY_COMMIT);
    const direction = dx < 0 ? -1 : 1;
    const canCommit = direction === -1 ? canNext : canPrev;
    start.current = null;
    axis.current = null;

    if (committed && canCommit) {
      setPhase("fly");
      setDragX(direction * width);
      setTimeout(() => {
        if (direction === -1) onNext?.();
        else onPrev?.();
        // Jump to opposite side without transition so new content can
        // slide in from there.
        setPhase("reset");
        setDragX(-direction * width);
        setTimeout(() => {
          setPhase("enter");
          setDragX(0);
        }, 20);
        setTimeout(() => setPhase("idle"), ENTER_MS + 40);
      }, FLY_MS);
    } else {
      setPhase("spring");
      setDragX(0);
      setTimeout(() => setPhase("idle"), SPRING_MS);
    }
  };

  const opacity =
    phase === "fly"
      ? Math.max(0, 1 - Math.abs(dragX) / width)
      : phase === "reset"
      ? 0
      : phase === "enter"
      ? 1
      : phase === "drag"
      ? Math.max(0.55, 1 - Math.abs(dragX) / (width * 1.8))
      : 1;

  const transition =
    phase === "drag" || phase === "reset"
      ? "none"
      : phase === "fly"
      ? `transform ${FLY_MS}ms ${CURVE_OUT}, opacity ${FLY_MS}ms ease-out`
      : phase === "enter"
      ? `transform ${ENTER_MS}ms ${CURVE_IN}, opacity ${ENTER_MS}ms ease-out`
      : `transform ${SPRING_MS}ms ${CURVE_IN}, opacity ${SPRING_MS}ms ease-out`;

  return {
    bind: { onTouchStart, onTouchMove, onTouchEnd },
    style: {
      transform: `translate3d(${dragX}px, 0, 0)`,
      opacity,
      transition,
      willChange: "transform, opacity",
    },
  };
}
