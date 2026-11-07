import { useState } from "react";
import { achievementCategories, milestones } from "../data/achievements";
import { SectionHeader } from "./SectionHeader";

const categories = ["All Milestones", ...achievementCategories] as const;

/** Original laurel medal: a gold wreath around a deep rose disc with a star. */
function Medal() {
  const leaves = Array.from({ length: 7 }, (_, i) => i);
  return (
    <svg className="medal" viewBox="0 0 64 64" aria-hidden="true">
      {leaves.map((i) => {
        const a = (200 + i * 22) * (Math.PI / 180);
        const b = (-20 - i * 22) * (Math.PI / 180);
        return (
          <g key={i} fill="#e2b65a" stroke="#a8823c" strokeWidth=".6">
            <ellipse cx={32 + Math.cos(a) * 24} cy={34 + Math.sin(a) * 24} rx="3.4" ry="6.5" transform={`rotate(${(a * 180) / Math.PI + 90} ${32 + Math.cos(a) * 24} ${34 + Math.sin(a) * 24})`} />
            <ellipse cx={32 + Math.cos(b) * 24} cy={34 + Math.sin(b) * 24} rx="3.4" ry="6.5" transform={`rotate(${(b * 180) / Math.PI + 90} ${32 + Math.cos(b) * 24} ${34 + Math.sin(b) * 24})`} />
          </g>
        );
      })}
      <circle cx="32" cy="32" r="17" fill="url(#medalCore)" stroke="#e9c97a" strokeWidth="2.5" />
      <path d="M32 21l2.6 8.4L43 32l-8.4 2.6L32 43l-2.6-8.4L21 32l8.4-2.6z" fill="#f6dfa4" />
      <path d="M26 56h12l-6-5z" fill="#e2b65a" />
    </svg>
  );
}

export function Achievements() {
  const [cat, setCat] = useState<string>("All Milestones");
  const shown = cat === "All Milestones" ? milestones : milestones.filter((m) => m.category === cat);

  return (
    <section id="achievements" className="section section--ivory on-ivory achievements" aria-labelledby="achievements-title">
      <div className="container">
        <SectionHeader
          id="achievements-title"
          chapter="Chapter V · Achievement Archive"
          title="Achievements"
          element="geo"
          lede="Milestones you can verify in the code itself. Academic honors and leadership roles will be recorded here as they're added."
        />

        <svg width="0" height="0" className="visually-hidden" aria-hidden="true">
          <defs>
            <radialGradient id="medalCore" cx="45%" cy="40%" r="60%">
              <stop offset="0" stopColor="#c47a62" />
              <stop offset="1" stopColor="#5b2f2e" />
            </radialGradient>
          </defs>
        </svg>
        <div className="ach-screen reveal">
          <div className="ach-categories" role="tablist" aria-label="Achievement categories">
            <p className="ach-completed">
              Achievements completed: <strong>{milestones.length}</strong>
            </p>
            {categories.map((c) => {
              const count = c === "All Milestones" ? milestones.length : milestones.filter((m) => m.category === c).length;
              return (
                <button
                  key={c}
                  role="tab"
                  aria-selected={cat === c}
                  aria-controls="ach-book"
                  className={`ach-cat ${cat === c ? "is-active" : ""}`}
                  onClick={() => setCat(c)}
                >
                  <span className="ach-cat-name">{c}</span>
                  <span className="ach-cat-pct">
                    {count} recorded · 100%
                  </span>
                </button>
              );
            })}
          </div>

          <div className="ach-book" id="ach-book" role="tabpanel">
            <div className="ach-page">
              <div className="ach-progress-row">
                <div className="ach-progress-text">
                  <p className="ach-progress-title">Achievement Progress</p>
                  <div className="ach-bar" aria-hidden="true">
                    <span />
                  </div>
                  <p className="ach-progress-note">Every milestone below is completed and dated.</p>
                </div>
                <p className="ach-progress-pct">100%</p>
              </div>

              <ol className="ach-list">
                {shown.map((m) => (
                  <li key={m.title} className="ach-row">
                    <Medal />
                    <div className="ach-text">
                      <h3 className="ach-title">{m.title}</h3>
                      <p>{m.detail}</p>
                    </div>
                    <div className="ach-status">
                      <span className="ach-done">Completed</span>
                      <time>{m.date}</time>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
