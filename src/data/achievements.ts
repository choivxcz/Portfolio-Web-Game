import type { Element } from "./elements";
import github from "./github.json";

/**
 * MILESTONES — only verifiable accomplishments drawn from public work.
 *
 * Academic honors, leadership roles, and certificates were not found in any
 * public source, so none are listed. Add them here, e.g.:
 *
 *   { title: "Dean's Lister", detail: "Recognised for academic excellence.",
 *     date: "AY 2025–2026", element: "geo", numeral: "VII", category: "Exploration" },
 */
export interface Milestone {
  title: string;
  detail: string;
  date: string;
  element: Element;
  numeral: string;
  category: "Software Craft" | "Exploration";
}

export const achievementCategories = ["Software Craft", "Exploration"] as const;

export const milestones: Milestone[] = [
  {
    title: "A model with a version number",
    category: "Software Craft",
    detail:
      "Trained, evaluated, and versioned a Random Forest screening model (rf-1.0.0) with stored metrics and safety checks before it is loaded.",
    date: "Oct 2026",
    element: "dendro",
    numeral: "I",
  },
  {
    title: "From desktop to the web",
    category: "Software Craft",
    detail:
      "Rebuilt Iskolar ng Bayan as a web app — a FastAPI layer of 18 REST endpoints reusing the original, tested business logic.",
    date: "Oct 2026",
    element: "hydro",
    numeral: "II",
  },
  {
    title: "Code backed by tests",
    category: "Software Craft",
    detail: "Wrote 13 automated test modules covering applicant, application, search, archive, and ML screening logic.",
    date: "Oct 2026",
    element: "cryo",
    numeral: "III",
  },
  {
    title: "Five platforms explored",
    category: "Exploration",
    detail: "Shipped work on desktop (PyQt), web (React), mobile (Flutter), a game engine (Unity), and a simulation platform (GAMA).",
    date: "2025 – 2026",
    element: "electro",
    numeral: "IV",
  },
  {
    title: "Building for a real office",
    category: "Exploration",
    detail: "Designed a screening workflow around the needs of the Local Youth Development Office of Santa Cruz, Laguna.",
    date: "2026",
    element: "geo",
    numeral: "V",
  },
  {
    title: "First commit, first project",
    category: "Exploration",
    detail: `Published Market Sales Tracker as a first-year student — the start of ${github.user.publicRepos} public repositories.`,
    date: "Jul 2025",
    element: "anemo",
    numeral: "VI",
  },
  {
    title: "A monster that listens",
    category: "Software Craft",
    detail:
      "Gave Bugtong Buhay's manananggal a six-state AI on Unity's NavMesh that hunts by sight and by sound: running is loud, crouching is almost silent.",
    date: "May 2026",
    element: "pyro",
    numeral: "VII",
  },
  {
    title: "A key that never ships",
    category: "Software Craft",
    detail:
      "Kept Peso Pilot's AI key off the phone: chat goes through a serverless proxy that holds the key and validates every message.",
    date: "2026",
    element: "geo",
    numeral: "VIII",
  },
  {
    title: "Learning in the open",
    category: "Exploration",
    detail:
      "Published coursework and self-study on GitHub: supervised-learning pipelines, a knowledge-based system in R, and DataCamp's Intermediate Python.",
    date: "Aug – Sep 2026",
    element: "cryo",
    numeral: "IX",
  },
  {
    title: "A world of my own",
    category: "Exploration",
    detail: "Built this portfolio as an explorable 3D world, with procedural terrain, synthesized music, and a classic page for everyone else.",
    date: "Nov 2026",
    element: "anemo",
    numeral: "X",
  },
];
