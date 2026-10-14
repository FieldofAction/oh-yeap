import { useEffect, useRef, useState } from "react";

// Shared by the public and Studio drawers, regardless of their menu structure.
export default function useNavigationDrawer() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const drawer = drawerRef.current;
    const toggle = toggleRef.current;
    const previousOverflow = document.body.style.overflow;
    const links = () => [...drawer.querySelectorAll("a[href], button:not([disabled])")];
    document.body.style.overflow = "hidden";
    links()[0]?.focus();

    const close = () => setMobileOpen(false);
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key !== "Tab") return;
      const items = links();
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    drawer.addEventListener("keydown", onKeyDown);
    window.addEventListener("popstate", close);
    window.addEventListener("hashchange", close);
    return () => {
      drawer.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("popstate", close);
      window.removeEventListener("hashchange", close);
      document.body.style.overflow = previousOverflow;
      toggle?.focus();
    };
  }, [mobileOpen]);

  return { mobileOpen, setMobileOpen, toggleRef, drawerRef };
}
