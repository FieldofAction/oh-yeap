import { useEffect, useRef } from "react";
import { DEV_MODE, setDevMode } from "../lib/devMode";

/**
 * Type `dev` anywhere on the site to toggle dev mode. See src/lib/devMode.js.
 *
 * A sequence rather than a chord: the site already spends its single keys on the
 * lenses (M, P, G, ?), and a bare D would hand every visitor the unfinished work
 * by accident. Three deliberate keystrokes inside a second and a bit will not
 * happen by mistake, and nothing in the browser competes for them.
 *
 * The toggle reloads the page, because DEV_MODE is resolved once per load.
 */

const SEQUENCE = "dev";
const IDLE_MS = 1200;

export default function useDevModeShortcut() {
  const buffer = useRef("");
  const lastAt = useRef(0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      const t = e.target;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;

      // Any pause longer than IDLE_MS starts the sequence over, so stray letters
      // picked up while reading never accumulate into a match.
      if (e.timeStamp - lastAt.current > IDLE_MS) buffer.current = "";
      lastAt.current = e.timeStamp;

      buffer.current = (buffer.current + e.key.toLowerCase()).slice(-SEQUENCE.length);
      if (buffer.current === SEQUENCE) {
        buffer.current = "";
        setDevMode(!DEV_MODE);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
