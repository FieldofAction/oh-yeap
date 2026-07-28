import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Weighted, inertial page scroll (replaces native + CSS smooth-scroll), wired to
   GSAP so ScrollTrigger reveals read off the same scroll value.
   - Honours prefers-reduced-motion (bails, leaving native scroll).
   - Leaves internal scrollers marked [data-lenis-prevent] on native scroll.
   - Exposes the instance on window.__lenis for navigation resets. */
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

    // Drive Lenis off GSAP's ticker and update ScrollTrigger on every scroll,
    // so both share one clock and one scroll position.
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
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
