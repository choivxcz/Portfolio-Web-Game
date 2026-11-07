/**
 * ─────────────────────────────────────────────────────────────
 *  PROFILE — edit this file to change your personal details.
 * ─────────────────────────────────────────────────────────────
 *  Everything here was taken from your public GitHub profile and
 *  repositories (github.com/choivxcz). Fields left as empty strings
 *  are simply hidden on the site — fill them in to make them appear.
 */

export const profile = {
  name: "Karl Sebastian V. Cuerdo",
  shortName: "K. Cuerdo",
  initials: "KC",
  location: "Manila, Philippines",

  degree: "BS Computer Science",
  yearLevel: "Third", // repo names show CS2B (AY 2025–26) → CS3B (AY 2026–27)

  /** TODO: your university, e.g. "University of the Philippines". Hidden while empty. */
  university: "",

  /**
   * TODO (optional): your academic background before Computer Science
   * (e.g. senior high school strand). Shown as the first stop on the
   * Journey timeline and in the About journal. Hidden while empty.
   */
  previousBackground: "",

  tagline: "Turning raw data into systems people can rely on.",
  intro:
    "I'm a Computer Science student who builds AI-assisted management systems, full-stack web apps, mobile tools — and the occasional haunted Unity world.",

  links: {
    github: "https://github.com/choivxcz",
    githubHandle: "choivxcz",
    /** TODO: e.g. "you@example.com". When empty, the email button is hidden and GitHub becomes the main contact. */
    email: "",
    /** TODO: e.g. "https://www.linkedin.com/in/your-handle". Hidden while empty. */
    linkedin: "",
    instagram: "https://www.instagram.com/iudex.choi/",
    instagramHandle: "iudex.choi",
    facebook: "https://www.facebook.com/karl.sebastian.villaflor.cuerdo.2024/",
    /** Add other verified links here: { label: "Itch.io", href: "https://..." } */
    others: [] as { label: string; href: string }[],
    /** Public GitHub account ID (from api.github.com/users/choivxcz), shown like an in-game UID. */
    githubId: "196051006",
  },

  /** GitHub shows "Available for hire" on this profile. */
  openToOpportunities: true,
};

export type Profile = typeof profile;
