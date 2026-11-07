import type { Element } from "./elements";
import github from "./github.json";

/**
 * Skills are grouped by category, and every skill lists the projects that
 * show it in use. Every entry here can be traced to a public repository —
 * no proficiency percentages, only evidence.
 */
export interface Skill {
  name: string;
  evidence: string[]; // project names (or coursework) where it was used
}

export interface SkillGroup {
  id: string;
  element: Element;
  title: string;
  short: string;
  epithet: string;
  description: string;
  skills: Skill[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: "languages",
    element: "geo",
    title: "Programming Languages",
    short: "Languages",
    epithet: "The bedrock",
    description:
      "The languages I've used to ship real projects — from desktop apps and ML pipelines to typed frontends and game scripts.",
    skills: [
      { name: "Python", evidence: ["Iskolar ng Bayan", "Market Sales Tracker", "ML practice"] },
      { name: "TypeScript", evidence: ["Internship Monitoring System"] },
      { name: "JavaScript", evidence: ["Iskolar ng Bayan (Web)", "Peso Pilot API"] },
      { name: "SQL", evidence: ["Iskolar ng Bayan"] },
      { name: "Dart", evidence: ["Peso Pilot"] },
      { name: "C#", evidence: ["Bugtong Buhay"] },
      { name: "GAML", evidence: ["Classroom simulation"] },
      { name: "R", evidence: ["University Policy Knowledge Base (CSST101)"] },
    ],
  },
  {
    id: "frontend",
    element: "anemo",
    title: "Frontend Development",
    short: "Frontend",
    epithet: "Interfaces that breathe",
    description:
      "Component-driven web interfaces with motion that supports the content instead of competing with it.",
    skills: [
      { name: "React", evidence: ["Iskolar ng Bayan (Web)", "Internship Monitoring System"] },
      { name: "Vite", evidence: ["Iskolar ng Bayan (Web)", "Internship Monitoring System"] },
      { name: "Tailwind CSS", evidence: ["Iskolar ng Bayan (Web)"] },
      { name: "Framer Motion", evidence: ["Iskolar ng Bayan (Web)"] },
      { name: "HTML & CSS", evidence: ["Internship Monitoring System", "This portfolio"] },
      { name: "three.js & React Three Fiber", evidence: ["This 3D portfolio"] },
      { name: "Web Audio API", evidence: ["This 3D portfolio — synthesized music"] },
    ],
  },
  {
    id: "backend",
    element: "hydro",
    title: "Backend & APIs",
    short: "Backend",
    epithet: "Currents beneath the surface",
    description:
      "REST layers, serverless functions, and service code that keep business rules in one dependable place.",
    skills: [
      { name: "FastAPI", evidence: ["Iskolar ng Bayan (Web)"] },
      { name: "REST API design", evidence: ["Iskolar ng Bayan (Web) — 18 endpoints"] },
      { name: "Serverless functions (Vercel)", evidence: ["Peso Pilot"] },
      { name: "Firebase Auth & Cloud Functions", evidence: ["Peso Pilot"] },
      { name: "Repository / service layers", evidence: ["Iskolar ng Bayan"] },
    ],
  },
  {
    id: "data",
    element: "cryo",
    title: "Databases",
    short: "Databases",
    epithet: "Memory, kept clear",
    description: "Relational schemas and cloud document stores for records that need to stay correct.",
    skills: [
      { name: "MySQL", evidence: ["Iskolar ng Bayan"] },
      { name: "Cloud Firestore", evidence: ["Peso Pilot"] },
      { name: "SQLite (sqflite)", evidence: ["Flutter practice"] },
      { name: "CSV / JSON data handling", evidence: ["Market Sales Tracker", "ML practice"] },
    ],
  },
  {
    id: "ml",
    element: "dendro",
    title: "Machine Learning & Data Analysis",
    short: "ML & Data",
    epithet: "Patterns that grow",
    description:
      "Training, evaluating, and versioning models — then wiring them into tools where they support human decisions.",
    skills: [
      { name: "scikit-learn", evidence: ["Iskolar ng Bayan — Random Forest", "ML practice — KNN, linear models"] },
      { name: "pandas", evidence: ["Iskolar ng Bayan", "ML practice"] },
      { name: "NumPy", evidence: ["ML practice"] },
      { name: "Matplotlib", evidence: ["Market Price Predictor", "Market Sales Tracker"] },
      { name: "Jupyter Notebooks", evidence: ["CSST101 / CSST102 coursework"] },
      { name: "Agent-based modeling", evidence: ["Classroom simulation (GAMA)"] },
    ],
  },
  {
    id: "platforms",
    element: "pyro",
    title: "Desktop, Mobile & Game",
    short: "Platforms",
    epithet: "Forged across platforms",
    description: "Beyond the browser: native desktop windows, cross-platform mobile apps, and a 3D game engine.",
    skills: [
      { name: "PyQt6 / PyQt5", evidence: ["Iskolar ng Bayan", "Market Sales Tracker"] },
      { name: "Flutter", evidence: ["Peso Pilot"] },
      { name: "Unity 6 (HDRP)", evidence: ["Bugtong Buhay"] },
      { name: "Game AI (state machines, NavMesh)", evidence: ["Bugtong Buhay — the manananggal"] },
    ],
  },
  {
    id: "tools",
    element: "electro",
    title: "Tools & Technologies",
    short: "Tools",
    epithet: "Instruments of the craft",
    description: "The everyday toolkit behind the projects — version control, notebooks, simulation, and AI APIs.",
    skills: [
      { name: "Git & GitHub", evidence: [`${github.user.publicRepos} public repositories`] },
      { name: "GitHub Actions", evidence: ["This portfolio — build, GitHub sync and deploy"] },
      { name: "Automated tests", evidence: ["Iskolar ng Bayan — 13 test modules"] },
      { name: "GAMA Platform", evidence: ["Classroom simulation"] },
      { name: "LLM APIs (OpenRouter)", evidence: ["Peso Pilot"] },
    ],
  },
];
