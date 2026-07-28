import { useEffect } from "react";
import Lenis from "lenis";

/* Weighted, inertial page scroll (replaces native + CSS smooth-scroll).
   - Honours prefers-reduced-motion (bails, leaving native scroll).
   - Leaves internal scrollers marked [data-lenis-prevent] on native scroll.
   - Exposes the instance on window.__lenis so navigation resets and, later,
     GSAP ScrollTrigger can drive off the same scroll value. */
export default function useSmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    window.__lenis = lenis;

    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      if (window.__lenis === lenis) window.__lenis = null;
    };
  }, []);
}

/* Jump to top through Lenis when present, else native. Used on view change. */
export function scrollTopNow() {
  if (typeof window === "undefined") return;
  if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}
