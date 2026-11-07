import type { ReactElement } from "react";
import type { Element } from "../data/elements";

/**
 * Original elemental emblems — simple geometric glyphs inside a shared seal ring.
 * Drawn with `currentColor`, so the parent sets the color.
 */
const glyphs: Record<Element, ReactElement> = {
  anemo: (
    <g>
      <path d="M24 13c6 0 10 4 10 9s-4 8-8 8-6-2-6-5 2-4 4-4" />
      <path d="M13 26c1-5 5-9 11-9" opacity=".6" />
      <path d="M35 22c-1 5-5 9-11 9" opacity=".6" />
    </g>
  ),
  hydro: (
    <g>
      <path d="M24 11c5 7 9 11 9 17a9 9 0 0 1-18 0c0-6 4-10 9-17z" />
      <path d="M18 29c2 1.6 4 1.6 6 0s4-1.6 6 0" opacity=".7" />
    </g>
  ),
  electro: (
    <g>
      <path d="M13 15h22L24 35z" />
      <path d="M22 17l4 6-4 1 4 6" opacity=".8" />
    </g>
  ),
  pyro: (
    <g>
      <path d="M24 12l8 9-8 15-8-15z" />
      <path d="M24 20l3.5 4L24 31l-3.5-7z" opacity=".75" />
    </g>
  ),
  cryo: (
    <g>
      <path d="M24 11v26M12.7 17.5l22.6 13M12.7 30.5l22.6-13" />
      <path d="M21 13l3 3 3-3M21 35l3-3 3 3" opacity=".7" />
    </g>
  ),
  dendro: (
    <g>
      <path d="M24 11c8 5 10 12 0 26-10-14-8-21 0-26z" />
      <path d="M24 16v19M24 22l-4-3M24 27l4-3" opacity=".75" />
    </g>
  ),
  geo: (
    <g>
      <path d="M24 10l12 7v14l-12 7-12-7V17z" />
      <path d="M24 17l6 7-6 7-6-7z" opacity=".8" />
    </g>
  ),
};

interface SigilProps {
  element: Element;
  size?: number;
  ring?: boolean;
  className?: string;
  title?: string;
}

export function Sigil({ element, size = 40, ring = true, className, title }: SigilProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {ring && (
        <g opacity=".55">
          <circle cx="24" cy="24" r="21" strokeWidth="1" />
          <path d="M24 1.5v3M24 43.5v3M1.5 24h3M43.5 24h3" strokeWidth="1" />
        </g>
      )}
      {glyphs[element]}
    </svg>
  );
}
