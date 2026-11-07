/**
 * The seven elements used as accents across the site.
 * Colors match the CSS variables in src/styles/tokens.css.
 */
export type Element = "anemo" | "hydro" | "electro" | "pyro" | "cryo" | "dendro" | "geo";

export const elementMeta: Record<Element, { label: string; color: string; soft: string }> = {
  anemo: { label: "Anemo", color: "#5fcfb0", soft: "rgba(95, 207, 176, 0.18)" },
  hydro: { label: "Hydro", color: "#3fb6ee", soft: "rgba(63, 182, 238, 0.18)" },
  electro: { label: "Electro", color: "#b48be0", soft: "rgba(180, 139, 224, 0.18)" },
  pyro: { label: "Pyro", color: "#ef7a3a", soft: "rgba(239, 122, 58, 0.18)" },
  cryo: { label: "Cryo", color: "#8fd3e6", soft: "rgba(143, 211, 230, 0.18)" },
  dendro: { label: "Dendro", color: "#9cc93a", soft: "rgba(156, 201, 58, 0.18)" },
  geo: { label: "Geo", color: "#f0b232", soft: "rgba(240, 178, 50, 0.18)" },
};
