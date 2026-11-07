/**
 * PLACES — the regions each project is charted in on the Expedition Board.
 *
 * Every project in src/data/projects.ts sets `region` to one of these ids. The id
 * also picks its landscape banner (src/components/scene/regionPresets.ts), drawn in
 * src/components/scene/places.tsx. All art is original and only inspired by the
 * game's regions: no official emblems, maps or images are used.
 *
 * The first eight are the nations; the rest are ready for future projects.
 */
export type PlaceId =
  | "mondstadt"
  | "liyue"
  | "inazuma"
  | "sumeru"
  | "fontaine"
  | "natlan"
  | "nodkrai"
  | "snezhnaya"
  | "dragonspine"
  | "chasm"
  | "enkanomiya"
  | "desert";

export interface Place {
  name: string;
  /** Short title shown under the name. */
  epithet: string;
  /** Accent for the board note, card label and dialog. */
  accent: string;
}

export const places: Record<PlaceId, Place> = {
  mondstadt: { name: "Mondstadt", epithet: "City of Freedom", accent: "#5fcfb0" },
  liyue: { name: "Liyue", epithet: "Nation of Contracts", accent: "#f0b232" },
  inazuma: { name: "Inazuma", epithet: "Nation of Eternity", accent: "#b48be0" },
  sumeru: { name: "Sumeru", epithet: "Nation of Wisdom", accent: "#9cc93a" },
  fontaine: { name: "Fontaine", epithet: "Nation of Justice", accent: "#3fb6ee" },
  natlan: { name: "Natlan", epithet: "Land of the Sacred Flame", accent: "#ef7a3a" },
  nodkrai: { name: "Nod-Krai", epithet: "Land under the Moon", accent: "#a9b4ea" },
  snezhnaya: { name: "Snezhnaya", epithet: "Nation of Ice", accent: "#8fd3e6" },
  dragonspine: { name: "Dragonspine", epithet: "The Frozen Summit", accent: "#e0566a" },
  chasm: { name: "The Chasm", epithet: "Depths beneath Liyue", accent: "#c9a46a" },
  enkanomiya: { name: "Enkanomiya", epithet: "Land beneath the Sea", accent: "#7fe0f0" },
  desert: { name: "Desert of Hadramaveth", epithet: "Sands of a Fallen King", accent: "#e6a85a" },
};
