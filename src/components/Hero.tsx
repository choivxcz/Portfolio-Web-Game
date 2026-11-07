import { useEffect, useRef } from "react";
import { profile } from "../data/profile";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { HeroScene } from "./HeroScene";
import { Particles } from "./Particles";
import { CompassIcon } from "./Icons";
import { Sparkle } from "./Ornament";

const SEED_COLORS = ["#ffffff", "#fff4c9", "#e4f6ff"];

/** Location banner: a fine rule with diamond ends, like a region name popping up. */
function LocationRule() {
  return (
    <svg className="location-rule" viewBox="0 0 120 10" aria-hidden="true" fill="none">
      <path d="M0 5h104" stroke="currentColor" strokeOpacity=".8" />
      <path d="M106 5l4-4 4 4-4 4z" fill="currentColor" />
      <circle cx="118" cy="5" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Parallax: write scroll + pointer offsets to CSS variables; layers read them.
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) {
      el?.style.setProperty("--sy", "0");
      el?.style.setProperty("--px", "0");
      el?.style.setProperty("--py", "0");
      return;
    }
    let frame = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      const sy = Math.min(window.scrollY, el.offsetHeight);
      el.style.setProperty("--sy", sy.toFixed(1));
      el.style.setProperty("--px", cx.toFixed(3));
      el.style.setProperty("--py", cy.toFixed(3));
      frame = Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(loop);
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      kick();
    };
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    kick();
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("pointermove", onPointer);
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <section id="home" className="hero" ref={ref} aria-labelledby="hero-title">
      <div className="hero-sky" aria-hidden="true" />
      <HeroScene />
      <div className="hero-rays" aria-hidden="true" />
      <Particles density={3.5} colors={SEED_COLORS} drift={0.35} className="hero-particles" />
      <div className="hero-veil" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="hero-location">
            <LocationRule />
            <span>{profile.location}</span>
          </p>
          <h1 id="hero-title" className="hero-name">
            {profile.name}
          </h1>
          <p className="hero-role">
            <Sparkle size={10} />
            <span>
              {profile.degree} Student <span aria-hidden="true">·</span> Developer
            </span>
            <Sparkle size={10} />
          </p>
          <p className="hero-tagline">{profile.tagline}</p>
          <p className="hero-intro">{profile.intro}</p>
          <div className="hero-actions">
            <a className="btn btn--primary btn--large" href="#projects">
              <span className="btn-icon">
                <Sparkle size={13} />
              </span>
              <span>Explore My Projects</span>
            </a>
            <a className="btn btn--ghost btn--large" href="#journey">
              <span className="btn-icon">
                <CompassIcon size={16} />
              </span>
              <span>Discover My Journey</span>
            </a>
          </div>
        </div>
      </div>

      <a className="scroll-cue" href="#about">
        <span>Begin the journey</span>
        <svg width="16" height="22" viewBox="0 0 16 22" aria-hidden="true">
          <path d="M8 1l3 3-3 3-3-3z" fill="currentColor" />
          <path d="M2 11l6 6 6-6" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      </a>
      <p className="hero-uid" title="Public GitHub account ID">
        UID {profile.links.githubId}
      </p>
    </section>
  );
}
