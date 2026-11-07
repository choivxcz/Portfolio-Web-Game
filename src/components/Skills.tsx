import { useRef, useState, type KeyboardEvent } from "react";
import { elementMeta } from "../data/elements";
import { skillGroups } from "../data/skills";
import { Corners, Sparkle } from "./Ornament";
import { RegionArt } from "./scene/RegionArt";
import { SectionHeader } from "./SectionHeader";
import { Sigil } from "./Sigil";

const N = skillGroups.length;

export function Skills() {
  const [index, setIndex] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const group = skillGroups[index];
  const meta = elementMeta[group.element];

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = index;
    if (e.key in keys) next = (index + keys[e.key] + N) % N;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = N - 1;
    else return;
    e.preventDefault();
    setIndex(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id="skills" className="section skills" aria-labelledby="skills-title" style={{ ["--accent" as string]: meta.color }}>
      <div className="skills-scene" aria-hidden="true">
        <RegionArt preset="harbor" id="skills-bg" />
      </div>
      <div className="container">
        <div className="affinity-panel frame on-ivory reveal">
          <Corners />
          <SectionHeader
            id="skills-title"
            chapter="Chapter III · Elemental Affinities"
            title="Skills"
            element="electro"
            lede="Seven affinities, each tied to the projects where I've actually used them. Select one to read its record."
          />

          <div className="affinity-layout">
            <div role="tablist" aria-label="Skill categories" className="affinity-tiles">
              {skillGroups.map((g, i) => {
                const m = elementMeta[g.element];
                const selected = i === index;
                return (
                  <button
                    key={g.id}
                    ref={(el) => {
                      tabs.current[i] = el;
                    }}
                    role="tab"
                    id={`tab-${g.id}`}
                    aria-selected={selected}
                    aria-controls="skills-panel"
                    tabIndex={selected ? 0 : -1}
                    className={`affinity-tile ${selected ? "is-active" : ""}`}
                    style={{ ["--node" as string]: m.color }}
                    onClick={() => setIndex(i)}
                    onKeyDown={onKey}
                  >
                    <span className="affinity-glyph">
                      <Sigil element={g.element} size={44} ring={false} />
                    </span>
                    <span className="affinity-name">{g.short}</span>
                    <span className="affinity-element">{m.label}</span>
                  </button>
                );
              })}
            </div>

            <div id="skills-panel" role="tabpanel" aria-labelledby={`tab-${group.id}`} className="affinity-detail" key={group.id}>
              <header className="affinity-head">
                <span className="affinity-emblem" aria-hidden="true">
                  <Sigil element={group.element} size={46} ring={false} />
                </span>
                <div>
                  <p className="affinity-kicker">
                    {meta.label} <Sparkle size={8} /> {group.epithet}
                  </p>
                  <h3 className="affinity-title">{group.title}</h3>
                </div>
              </header>
              <p className="affinity-desc">{group.description}</p>
              <ul className="affinity-list">
                {group.skills.map((s, i) => (
                  <li key={s.name} className="affinity-row" style={{ ["--d" as string]: `${i * 50}ms` }}>
                    <span className="affinity-skill">
                      <span className="skill-gem" aria-hidden="true" />
                      {s.name}
                    </span>
                    <span className="affinity-evidence">
                      <span className="visually-hidden">Used in: </span>
                      {s.evidence.join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
