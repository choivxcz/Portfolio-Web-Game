import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { profile } from "../data/profile";
import { useActiveSection } from "../hooks/useActiveSection";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { NavIcon } from "./NavIcons";
import { Sigil } from "./Sigil";

const links = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "achievements", label: "Achievements" },
  { id: "contact", label: "Contact" },
  { id: "reviews", label: "Reviews" },
];

export function Nav() {
  const active = useActiveSection(
    links.map((l) => l.id),
    { journey: "about" },
  );
  const progress = useScrollProgress();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Slide the diamond indicator under the active link.
  useLayoutEffect(() => {
    const place = () => {
      const a = listRef.current?.querySelector<HTMLAnchorElement>(`a[data-id="${active}"]`);
      if (!a || !listRef.current) return;
      const parent = listRef.current.getBoundingClientRect();
      const rect = a.getBoundingClientRect();
      setIndicator({ left: rect.left - parent.left, width: rect.width, ready: true });
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [active]);

  // Mobile menu: lock scroll, close on Escape.
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const explored = Math.round(progress * 100);

  return (
    <header className={`nav ${scrolled ? "nav--scrolled" : ""} ${open ? "nav--open" : ""}`}>
      <div className="nav-bar">
        <a className="nav-brand" href="#home" onClick={() => setOpen(false)}>
          <span className="nav-emblem" aria-hidden="true">
            <Sigil element="geo" size={26} ring={false} />
          </span>
          <span className="nav-brand-text">{profile.shortName}</span>
        </a>

        <nav aria-label="Primary" className="nav-links-wrap">
          <ul className="nav-links" ref={listRef}>
            {links.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  data-id={l.id}
                  aria-current={active === l.id ? "true" : undefined}
                  className={active === l.id ? "is-active" : undefined}
                >
                  <NavIcon name={l.id} />
                  <span>{l.label}</span>
                </a>
              </li>
            ))}
            <li
              className="nav-indicator"
              aria-hidden="true"
              style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width, opacity: indicator.ready ? 1 : 0 }}
            />
          </ul>
        </nav>

        <div className="nav-explored" title="How much of the page you've explored">
          <svg viewBox="0 0 36 36" width="30" height="30" aria-hidden="true">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.5" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#ecb349"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${(progress * 94.25).toFixed(2)} 94.25`}
              transform="rotate(-90 18 18)"
            />
          </svg>
          <span className="nav-explored-text">
            <span className="nav-explored-label">Exploration</span>
            <span className="nav-explored-value">{explored}%</span>
          </span>
        </div>

        <button
          ref={toggleRef}
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav aria-label="Mobile">
          <ul className="menu-tiles">
            {links.map((l, i) => (
              <li key={l.id} style={{ animationDelay: `${i * 0.04}s` }}>
                <a href={`#${l.id}`} aria-current={active === l.id ? "true" : undefined} onClick={() => setOpen(false)}>
                  <NavIcon name={l.id} size={34} />
                  <span>{l.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
