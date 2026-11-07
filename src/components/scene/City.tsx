/**
 * A distant walled lake city (original design): pale stone walls, round towers,
 * blue and terracotta roofs, and a tall cathedral spire. Drawn small and slightly
 * hazy so it reads as far away.
 */
export function City({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const houses: [number, number, number, string][] = [
    [-70, 18, 16, "#5b74ad"],
    [-52, 26, 18, "#c56f4f"],
    [-30, 22, 20, "#5b74ad"],
    [18, 24, 18, "#c56f4f"],
    [40, 30, 20, "#5b74ad"],
    [62, 20, 16, "#5b74ad"],
    [80, 16, 14, "#c56f4f"],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity=".92">
      {/* wall */}
      <path d="M-98 0V-14H98V0Z" fill="#e2d8c8" />
      <path d="M-98 -14H98V-10H-98Z" fill="#cbbfac" />
      {/* battlements and a stone course */}
      <path d={Array.from({ length: 33 }, (_, k) => `M${-96 + k * 6} -14v-3h3v3z`).join("")} fill="#e2d8c8" />
      <path d="M-98 -6H98" stroke="#a89a84" strokeWidth=".8" opacity=".6" />
      {/* houses behind the wall */}
      {houses.map(([hx, h, w, roof], i) => (
        <g key={i}>
          <rect x={hx - w / 2} y={-14 - h} width={w} height={h} fill="#efe6d8" />
          <rect x={hx} y={-14 - h} width={w / 2} height={h} fill="#d9cdbb" />
          <path d={`M${hx - w / 2 - 3} ${-14 - h}L${hx} ${-14 - h - w * 0.7}L${hx + w / 2 + 3} ${-14 - h}Z`} fill={roof} />
          {/* the shaded roof plane, a lit ridge edge and lit windows */}
          <path d={`M${hx} ${-14 - h - w * 0.7}L${hx + w / 2 + 3} ${-14 - h}H${hx}Z`} fill="#000" opacity=".16" />
          <path d={`M${hx - w / 2 - 3} ${-14 - h}L${hx} ${-14 - h - w * 0.7}`} stroke="#fff4d6" strokeWidth=".9" opacity=".7" />
          <rect x={hx - w / 4 - 1.5} y={-14 - h + h * 0.3} width="3" height="4" fill="#ffd98a" />
          <rect x={hx + w / 4 - 1.5} y={-14 - h + h * 0.3} width="3" height="4" fill="#e9c47a" opacity=".8" />
        </g>
      ))}
      {/* cathedral with spire */}
      <rect x="-14" y="-62" width="28" height="48" fill="#efe6d8" />
      <rect x="0" y="-62" width="14" height="48" fill="#d6cab7" />
      <path d="M-17 -62L0 -84L17 -62Z" fill="#4f69a3" />
      <path d="M0 -84L17 -62H0Z" fill="#000" opacity=".16" />
      <circle cx="0" cy="-50" r="5" fill="#ffd98a" opacity=".9" />
      <path d="M-4 -14v-14a4 4 0 0 1 8 0v14z" fill="#8a6a4f" />
      <rect x="-5" y="-112" width="10" height="34" fill="#efe6d8" />
      <path d="M-7 -112L0 -142L7 -112Z" fill="#4f69a3" />
      <circle cx="0" cy="-96" r="3" fill="#e9c46a" />
      {/* round towers */}
      {[-98, 98].map((tx) => (
        <g key={tx}>
          <rect x={tx - 8} y="-40" width="16" height="40" fill="#e2d8c8" />
          <path d={`M${tx - 10} -40L${tx} -56L${tx + 10} -40Z`} fill="#4f69a3" />
          <path d={`M${tx} -56L${tx + 10} -40H${tx}Z`} fill="#000" opacity=".16" />
          <rect x={tx - 1.5} y="-30" width="3" height="6" rx="1.5" fill="#ffd98a" />
        </g>
      ))}
      {/* reflection hint */}
      <rect x="-98" y="2" width="196" height="6" fill="#ffffff" opacity=".25" />
    </g>
  );
}

/** A small windmill; the sail group rotates around its hub (see .windmill-blades). */
export function Windmill({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-20 0L-13 -96H13L20 0Z" fill="#f2eadc" />
      <path d="M0 0V-96H13L20 0Z" fill="#dccfb9" />
      <path d="M-18 -94L0 -124L18 -94Z" fill="#5a73ad" />
      <rect x="-6" y="-30" width="12" height="30" rx="6" fill="#8a6a4f" />
      <g className="windmill-blades">
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a} 0 -100)`}>
            <rect x="-2" y="-176" width="4" height="76" fill="#efe6d6" />
            <rect x="2" y="-170" width="16" height="58" fill="#ffffff" stroke="#cfc2aa" strokeWidth="1.2" />
          </g>
        ))}
        <circle cx="0" cy="-100" r="6" fill="#8a6a4f" />
      </g>
    </g>
  );
}
