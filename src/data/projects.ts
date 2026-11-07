import type { Element } from "./elements";
import type { PlaceId } from "./places";

/**
 * PROJECTS — every entry is verified against a public repository.
 *
 * To add a screenshot instead of the generated landscape banner, place an image in
 * /public/projects/ and set `image: "projects/your-file.webp"`.
 * To add a live demo, set `demo: "https://..."` — the button only appears when set.
 */
export const projectCategories = ["AI & Data", "Web Systems", "Mobile & Games", "Desktop Tools"] as const;
export type ProjectCategory = (typeof projectCategories)[number];

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  id: string;
  name: string;
  realm: string; // short domain label
  element: Element;
  /** Region the project is charted in on the Expedition Board (see src/data/places.ts). */
  region: PlaceId;
  /** One line on why the project belongs in that region. */
  regionNote: string;
  /** Used by the archive filter. */
  category: ProjectCategory;
  image?: string;
  year: string;
  status: string; // honest status label
  summary: string;
  problem: string;
  highlights: string[];
  tech: string[];
  repos: ProjectLink[];
  demo?: string;
  note?: string;
  /** Card rarity (3–5 stars) — purely decorative, sets the card's background color. */
  rarity: 3 | 4 | 5;
  size: "feature" | "wide" | "tall" | "compact";
}

const gh = (repo: string) => `https://github.com/choivxcz/${repo}`;

export const projects: Project[] = [
  {
    id: "iskolar",
    name: "Iskolar ng Bayan",
    realm: "Public-service AI",
    element: "dendro",
    region: "sumeru",
    regionNote:
      "Sumeru is the nation of scholars and its Akademiya — a fitting home for a system that helps decide who earns a scholar's support.",
    category: "AI & Data",
    year: "2026",
    status: "Academic project · in active development",
    summary:
      "An AI-assisted scholarship applicant screening and management system for the Local Youth Development Office (LYDO) of Santa Cruz, Laguna.",
    problem:
      "Screening scholarship applicants by hand is slow and inconsistent. Staff need one place to register applicants, track each application's status, schedule interviews, and record decisions — with a machine-learning advisory to help prioritise, not replace, human judgment.",
    highlights: [
      "Random Forest classifier (scikit-learn, 300 trees) trained on 13 applicant features such as academic average, monthly income, household composition, and program eligibility",
      "Versioned model artifact with stored evaluation metrics (accuracy, precision, recall, F1) and feature-configuration checks before use",
      "Full workflow: registration → applications → AI screening → interviews → final decisions, with guarded status transitions",
      "Desktop edition in PyQt6 backed by MySQL, using repository and service layers, plus 13 automated test modules",
      "Web edition: a FastAPI REST layer (18 endpoints) that reuses the desktop business logic, with a React 19 + Vite + Tailwind + Framer Motion frontend",
    ],
    tech: ["Python", "PyQt6", "MySQL", "scikit-learn", "pandas", "FastAPI", "React", "Vite", "Tailwind CSS", "Framer Motion"],
    repos: [
      { label: "Desktop edition", href: gh("AI-Assisted-Scholarship-Applicant-Screening-and-Management-System") },
      { label: "Web edition", href: gh("IskoMatic") },
    ],
    rarity: 5,
    size: "feature",
  },
  {
    id: "internship",
    name: "College Internship Monitoring & Management System",
    realm: "Academic operations",
    element: "hydro",
    region: "fontaine",
    regionNote:
      "Fontaine runs on records, rules and fair process — much like keeping every intern's documents and progress in order.",
    category: "Web Systems",
    year: "2026",
    status: "Frontend prototype · backend not started",
    summary:
      "A web portal for coordinating college internships — from student profiles and applications to required documents and progress tracking.",
    problem:
      "Internship coordinators juggle applications, paperwork, and progress reports across many students and host companies. This system brings them into a single, structured dashboard.",
    highlights: [
      "Login flow leading into an administrator dashboard",
      "Dedicated modules for student profiles, applications, documents, and progress monitoring",
      "Typed React components with an ambient, pointer-reactive glow effect",
    ],
    tech: ["TypeScript", "React", "Vite", "CSS"],
    repos: [{ label: "Repository", href: gh("College-Internship-Monitoring-and-Management-System") }],
    rarity: 4,
    size: "wide",
  },
  {
    id: "pesopilot",
    name: "Peso Pilot",
    realm: "Personal finance · AI",
    element: "geo",
    region: "liyue",
    regionNote:
      "Liyue is the harbor of commerce, where every coin is counted — the natural place for a finance app.",
    category: "Mobile & Games",
    year: "2026",
    status: "Mobile app · course final project",
    summary:
      "An AI-integrated finance app for tracking income and expenses, with an assistant that gives advice and summarises your spending.",
    problem:
      "Most people log expenses but rarely learn from them. Peso Pilot turns transactions into monthly summaries and a conversational assistant that explains where the money went.",
    highlights: [
      "Income and expense tracking per category, with charts and history views",
      "Financial chat assistant that reads a monthly summary of the user's transactions",
      "Firebase authentication and Cloud Firestore storage",
      "AI requests routed through a small Vercel serverless backend so the API key never ships inside the app",
    ],
    tech: ["Flutter", "Dart", "Firebase", "Cloud Firestore", "fl_chart", "Vercel", "OpenRouter"],
    repos: [{ label: "Source (flutter_try)", href: gh("flutter_try") }],
    note: "The app's code lives in the flutter_try repository under lib/final_project.",
    rarity: 4,
    size: "tall",
  },
  {
    id: "bugtong",
    name: "Bugtong Buhay",
    realm: "Game development",
    element: "pyro",
    region: "natlan",
    regionNote:
      "Natlan honours its ancestors and the stories its tribes pass down by firelight — like a game built from Filipino folklore.",
    category: "Mobile & Games",
    year: "2026",
    status: "Unity project",
    summary:
      "A first-person 3D horror game in Unity drawing on Filipino folklore — featuring a manananggal and household talismans as collectible items.",
    problem:
      "A playable way to bring local folklore into an atmospheric, exploration-driven horror experience.",
    highlights: [
      "First-person exploration with interactable objects, an inventory, and dialogue",
      "Collectibles rooted in folklore: candles and garlic, a walis tambo, a doll, a crow, a clock",
      "Built with C# scripts on top of Unity asset packs for environments and controls",
    ],
    tech: ["Unity", "C#", "ShaderLab"],
    repos: [{ label: "Repository", href: gh("Bugtong-Buhay") }],
    rarity: 4,
    size: "tall",
  },
  {
    id: "classroom",
    name: "Classroom Attention Simulation",
    realm: "Intelligent systems",
    element: "electro",
    region: "inazuma",
    regionNote:
      "In Inazuma one storm reaches every corner of the islands — the way small behaviours ripple through a whole class of agents.",
    category: "AI & Data",
    year: "2026",
    status: "Coursework · CSEL302",
    summary:
      "Agent-based models of student attention and performance, built in the GAMA platform for an Intelligent Systems course.",
    problem:
      "How do individual behaviours add up to classroom-wide outcomes? Each student is an agent with its own attention and performance; the group pattern emerges from the simulation.",
    highlights: [
      "Agents with their own attention, performance, and mobility, updated every cycle",
      "Classroom data loaded from CSV to seed the simulation",
      "Written lab reports analysing global vs. species variables and emergent behaviour",
    ],
    tech: ["GAML", "GAMA Platform", "CSV"],
    repos: [{ label: "Repository", href: gh("Cuerdo-CSEL302-CS2B") }],
    rarity: 4,
    size: "wide",
  },
  {
    id: "mltrail",
    name: "Machine Learning Practice",
    realm: "Study log",
    element: "cryo",
    region: "snezhnaya",
    regionNote:
      "Snezhnaya is where patient, cold-blooded research happens — learning the fundamentals one notebook at a time.",
    category: "AI & Data",
    year: "2026",
    status: "Learning repository",
    summary:
      "Notebooks and scripts working through NumPy, pandas, data cleaning, encoders, k-nearest neighbours, and linear models.",
    problem: "Building the fundamentals behind the models used in later projects.",
    highlights: [
      "Handling missing data, ordinal and one-hot encoding",
      "Nearest-neighbour and linear model notebooks",
      "Practice datasets covering sales, students, and medical records",
    ],
    tech: ["Python", "NumPy", "pandas", "scikit-learn", "Jupyter"],
    repos: [{ label: "Repository", href: gh("Machine-Learning") }],
    rarity: 3,
    size: "compact",
  },
  {
    id: "salestracker",
    name: "Market Sales Tracker",
    realm: "First project",
    element: "anemo",
    region: "mondstadt",
    regionNote:
      "Mondstadt is where every traveller's journey begins — and where mine did, with my first project.",
    category: "Desktop Tools",
    year: "2025",
    status: "First-year project",
    summary: "A desktop app that tracks a business's daily sales — my first project as a first-year CS student.",
    problem: "Small sellers need a simple way to record what sold each day and see the totals.",
    highlights: ["PyQt5 desktop interface with item storage and sales tables", "Charts with Matplotlib", "Data saved as JSON"],
    tech: ["Python", "PyQt5", "Matplotlib"],
    repos: [{ label: "Repository", href: gh("Market_Sales_Tracker") }],
    rarity: 3,
    size: "compact",
  },
  {
    id: "pricepredictor",
    name: "Market Price Predictor",
    realm: "Console tool",
    element: "hydro",
    region: "nodkrai",
    regionNote:
      "Under Nod-Krai's moon, the phases rise and fall in a pattern you can learn to read — like prices tracked over time.",
    category: "Desktop Tools",
    year: "2025",
    status: "Console application",
    summary: "Add and update product prices, then visualise each product's price trend with Matplotlib.",
    problem: "Seeing how a product's price moves over time, without a spreadsheet.",
    highlights: ["Add and update product prices from the console", "Per-product trend charts with Matplotlib"],
    tech: ["Python", "Matplotlib"],
    repos: [{ label: "Repository", href: gh("Market-Price-Predictor-Console-Only-") }],
    rarity: 3,
    size: "compact",
  },
];
