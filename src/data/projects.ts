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
      "A Flutter app for recording income and expenses, with an AI assistant that answers questions about your month of spending.",
    problem:
      "Most people log expenses but rarely learn from them. Peso Pilot turns transactions into monthly summaries and a conversational assistant that explains where the money went.",
    highlights: [
      "Accounts with registration, sign-in and password reset through Firebase Authentication",
      "A ledger of income and expenses by category, organised by month in Cloud Firestore, with archiving",
      "Spending by category as pie charts (fl_chart)",
      "A chat assistant whose context is the month's totals and category breakdown compared with the previous month, not every transaction",
      "The app never holds the AI key: chat goes through a Vercel serverless proxy (with a Firebase Cloud Functions alternative) that keeps the OpenRouter key on the server and validates each message",
    ],
    tech: ["Flutter", "Dart", "Firebase Auth", "Cloud Firestore", "fl_chart", "Vercel Functions", "OpenRouter"],
    repos: [
      { label: "App source", href: gh("Peso-Pilot-App") },
      { label: "Original version", href: gh("Flutter_Project") },
    ],
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
    status: "Unity 6 game · gameplay scripts public",
    summary:
      "A first-person horror game in Unity 6 based on Filipino folklore: solve the riddles (bugtong) hidden around a house to find the key and escape, while a manananggal hunts you.",
    problem:
      "A playable way to bring local folklore into an atmospheric, exploration-driven horror experience.",
    highlights: [
      "The manananggal is a six-state AI (roam, investigate, search, chase, attack, check hiding place) that navigates with Unity's NavMesh, flying higher while roaming and lower on the hunt",
      "Sound matters: walking is audible, running is loud, crouching is almost silent, and louder noises carry farther",
      "Riddles, keys, doors, a chest, item pickups, hiding in cabinets, and respawning",
      "Footsteps, room and altar triggers, enemy sounds and random ambience; menus, loading and ending scenes",
      "Built in Unity 6 with the High Definition Render Pipeline",
    ],
    tech: ["Unity 6", "C#", "HDRP", "NavMesh", "Input System", "TextMeshPro"],
    repos: [{ label: "Gameplay scripts", href: gh("Bugtong-Buhay-Scripts") }],
    note: "The full Unity project is private because it includes licensed Asset Store packages; the C# scripts I wrote are public.",
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
    repos: [
      { label: "Repository", href: gh("Machine-Learning") },
      { label: "DataCamp: Intermediate Python", href: gh("Data-Camp-Intermediate-Python") },
    ],
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
  {
    id: "portfolioworld",
    name: "This 3D Portfolio",
    realm: "Interactive web",
    element: "anemo",
    region: "dragonspine",
    regionNote:
      "Dragonspine is the mountain you can see from anywhere in the valley — like this world, which you're standing in right now.",
    category: "Web Systems",
    year: "2026",
    status: "Live · you are here",
    summary:
      "The world you're exploring: a portfolio built as a small open-world game in the browser, where every landmark opens a section.",
    problem:
      "A portfolio people actually want to explore, that still works as a plain page for anyone who can't or doesn't want to play.",
    highlights: [
      "Procedural terrain, cliffs, mountains, water and grass, all generated in code with a cel-shaded look",
      "Third-person explorer with collisions, teleporting, a minimap, and touch controls for phones",
      "An original background theme synthesized in the browser, with no audio files",
      "Private reviews sent through Web3Forms, and a Repository Archive synced from GitHub on every deploy",
      "A classic scrolling page as a fallback when 3D isn't available",
    ],
    tech: ["TypeScript", "React", "three.js", "React Three Fiber", "Web Audio", "Vite", "GitHub Actions"],
    repos: [{ label: "Repository", href: gh("Portfolio-Web-Game") }],
    rarity: 4,
    size: "compact",
  },
  {
    id: "supervised",
    name: "Supervised Learning Lab",
    realm: "Coursework · CSST102",
    element: "cryo",
    region: "chasm",
    regionNote:
      "The Chasm is mined layer by layer, each find tested before it's trusted — like a dataset explored, split, and evaluated.",
    category: "AI & Data",
    year: "2026",
    status: "Coursework · CSST102 & CSST101",
    summary:
      "Complete supervised machine-learning pipelines in Python: explore a dataset, split it, train a k-nearest neighbours classifier, and evaluate it.",
    problem: "Learning to run the whole pipeline end to end, the same way on different datasets.",
    highlights: [
      "Iris dataset: exploration, visualisation, train-test split, k-nearest neighbours and accuracy",
      "UCI Wine dataset: the same pipeline with feature selection and a confusion matrix",
      "A k-nearest neighbours exercise in scikit-learn, with a written assessment",
    ],
    tech: ["Python", "scikit-learn", "pandas", "NumPy", "Matplotlib", "Google Colab"],
    repos: [
      { label: "CSST102 notebooks", href: gh("Cuerdo-CSST102-CS3B") },
      { label: "CSST101 ML exercise", href: gh("Cuerdo-CSST101-CS3B") },
    ],
    rarity: 3,
    size: "compact",
  },
  {
    id: "policykb",
    name: "University Policy Knowledge Base",
    realm: "Coursework · CSST101",
    element: "hydro",
    region: "enkanomiya",
    regionNote:
      "Enkanomiya is a hidden world that runs by its own written laws — like a system that reasons from a set of rules.",
    category: "AI & Data",
    year: "2026",
    status: "Coursework · R notebooks",
    summary: "A knowledge-based system for university policies, and a course enrollment database, both written in R.",
    problem: "Turning written rules into something a program can reason with and answer questions from.",
    highlights: [
      "A knowledge-based system that encodes university policies as rules",
      "A course enrollment database implemented in R",
      "Earlier labs on R variables, operators, user input and data frames",
    ],
    tech: ["R", "Google Colab", "Jupyter"],
    repos: [{ label: "Repository", href: gh("Cuerdo-CSST101-CS3B") }],
    rarity: 3,
    size: "compact",
  },
];

/** Which project each public repository belongs to (used by the Repository Archive). */
export const repoProject: Record<string, string> = {};
// a project's main (first) repository claims it before any project that only links it
for (const pass of [0, 1]) {
  for (const p of projects) {
    p.repos.forEach((r, i) => {
      if ((i === 0) !== (pass === 0)) return;
      repoProject[r.href.split("/").pop()!] ??= p.name;
    });
  }
}
