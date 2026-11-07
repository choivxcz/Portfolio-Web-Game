import type { Element } from "./elements";
import { profile } from "./profile";

/**
 * JOURNEY — dates come from repository creation / activity dates on GitHub.
 * Add, remove, or reorder stops freely.
 */
export interface JourneyStop {
  date: string;
  title: string;
  body: string;
  element: Element;
  tags?: string[];
}

const stops: JourneyStop[] = [
  {
    date: "Jul 2025",
    title: "The first project",
    body: "Built Market Sales Tracker as a first-year CS student — a PyQt5 desktop app for recording daily sales.",
    element: "anemo",
    tags: ["Python", "PyQt5"],
  },
  {
    date: "Aug 2025",
    title: "Learning to read the data",
    body: "Market Price Predictor added product price histories and trend charts with Matplotlib.",
    element: "hydro",
    tags: ["Matplotlib"],
  },
  {
    date: "Sep 2025",
    title: "Into mobile",
    body: "Started experimenting with Flutter and Dart — the workspace that later became Peso Pilot.",
    element: "geo",
    tags: ["Flutter", "Dart"],
  },
  {
    date: "Feb – Apr 2026",
    title: "Intelligent systems",
    body: "Second year (BSCS 2B): modelled student attention with agent-based simulations in GAMA for CSEL302.",
    element: "electro",
    tags: ["GAML", "Simulation"],
  },
  {
    date: "May 2026",
    title: "Peso Pilot takes flight",
    body: "An AI-assisted finance app with Firebase, charts, and a financial chat assistant behind a serverless backend.",
    element: "geo",
    tags: ["Firebase", "AI"],
  },
  {
    date: "May – Aug 2026",
    title: "A world of folklore",
    body: "Built Bugtong Buhay, a first-person horror game in Unity inspired by Filipino folklore.",
    element: "pyro",
    tags: ["Unity", "C#"],
  },
  {
    date: "Jun – Sep 2026",
    title: "Foundations of machine learning",
    body: "Worked through NumPy, pandas, scikit-learn, KNN and linear models — then third-year coursework (BSCS 3B) in Jupyter, plus DataCamp's Intermediate Python.",
    element: "cryo",
    tags: ["scikit-learn", "Jupyter"],
  },
  {
    date: "Oct 2026",
    title: "Systems that serve people",
    body: "Iskolar ng Bayan: an ML-assisted scholarship screening system for LYDO Santa Cruz, rebuilt for the web with FastAPI and React — alongside a college internship monitoring portal.",
    element: "dendro",
    tags: ["FastAPI", "React", "ML"],
  },
];

export const journey: JourneyStop[] = profile.previousBackground
  ? [
      {
        date: "Before CS",
        title: "Where it started",
        body: profile.previousBackground,
        element: "cryo",
      },
      ...stops,
    ]
  : stops;
