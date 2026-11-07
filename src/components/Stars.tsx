/** A row of rarity stars (decorative; the count is also given as text for screen readers). */
export function Stars({ count, size = 16, className = "" }: { count: number; size?: number; className?: string }) {
  return (
    <span className={`stars ${className}`}>
      <span className="visually-hidden">{count}-star</span>
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 1.8l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.9l-6.4 3.5L7 14.3 1.7 9.3l7.2-.9z"
            fill="#ffcc32"
            stroke="#b9861a"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}
