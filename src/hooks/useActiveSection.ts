import { useEffect, useState } from "react";

/**
 * Returns the id of the section currently under the upper third of the viewport.
 * `aliases` lets a sub-section (e.g. "journey") highlight a parent nav item ("about").
 */
export function useActiveSection(ids: string[], aliases: Record<string, string> = {}): string {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    let frame = 0;
    const all = [...ids, ...Object.keys(aliases)];
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.33;
      let current = ids[0];
      let best = -Infinity;
      for (const id of all) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= line && top > best) {
          best = top;
          current = aliases[id] ?? id;
        }
      }
      // At the very bottom of the page, the last section is active.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = ids[ids.length - 1];
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return active;
}
