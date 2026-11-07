/**
 * Reusable ornaments: thin gold rules, small diamonds and corner caps,
 * kept deliberately restrained. All drawn with currentColor.
 */

/** Section rule: fine lines meeting at a four-point star, with diamond studs. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <svg className={`divider ${className}`} viewBox="0 0 260 16" aria-hidden="true" fill="none">
      <path d="M0 8h104M156 8h104" stroke="currentColor" strokeOpacity=".55" />
      <path d="M108 8l4-4 4 4-4 4zM144 8l4-4 4 4-4 4z" fill="currentColor" fillOpacity=".75" />
      <path d="M130 1.5l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" fill="currentColor" />
    </svg>
  );
}

/** Small "◇◇" rule used under card titles, like the game's quest log. */
export function DiamondRule({ className = "" }: { className?: string }) {
  return (
    <svg className={`diamond-rule ${className}`} viewBox="0 0 200 10" aria-hidden="true" fill="none">
      <path d="M0 5h88M112 5h88" stroke="currentColor" strokeOpacity=".45" />
      <path d="M92 5l4-4 4 4-4 4zM100 5l4-4 4 4-4 4z" stroke="currentColor" />
    </svg>
  );
}

/** Small four-point sparkle used as a bullet / accent. */
export function Sparkle({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <path d="M6 0l1.4 4.6L12 6l-4.6 1.4L6 12l-1.4-4.6L0 6l4.6-1.4z" fill="currentColor" />
    </svg>
  );
}

/** Corner caps for gold frames: an L-bracket with a diamond stud. Parent must be position:relative. */
export function Corners() {
  const corner = (
    <svg viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <path d="M1.5 22V6.5a5 5 0 0 1 5-5H22" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 28V10.5a3.5 3.5 0 0 1 3.5-3.5H28" stroke="currentColor" strokeOpacity=".45" />
      <path d="M6.5 1.5l5 5-5 5-5-5z" fill="currentColor" />
      <circle cx="22.5" cy="1.5" r="1.4" fill="currentColor" />
      <circle cx="1.5" cy="22.5" r="1.4" fill="currentColor" />
    </svg>
  );
  return (
    <>
      <span className="corner corner--tl">{corner}</span>
      <span className="corner corner--tr">{corner}</span>
      <span className="corner corner--bl">{corner}</span>
      <span className="corner corner--br">{corner}</span>
    </>
  );
}
