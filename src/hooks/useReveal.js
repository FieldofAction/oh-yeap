import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Scroll-linked reveal. Elements marked [data-reveal] rise and fade as they
   enter the viewport, each triggered by its own position rather than a uniform
   on-mount fade. Neighbours that enter together are staggered by ScrollTrigger's
   batch. Honours reduced-motion (leaves everything visible).

   Pass a deps array (e.g. the current filter / item count) so the reveal
   re-binds when the list it targets changes. */
export default function useReveal(deps = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = gsap.utils.toArray("[data-reveal]").filter((el) => !el.dataset.revealed);
    if (!els.length) return;

    const batch = ScrollTrigger.batch(els, {
      start: "top 90%",
      once: true,
      onEnter: (targets) => {
        targets.forEach((el) => (el.dataset.revealed = "1"));
        gsap.to(targets, {
          autoAlpha: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.08,
          overwrite: true,
        });
      },
    });
    gsap.set(els, { autoAlpha: 0, y: 22 });
    ScrollTrigger.refresh();

    return () => batch.forEach((st) => st.kill());
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
