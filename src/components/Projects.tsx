import { useCallback, useState } from "react";
import { places } from "../data/places";
import { projectCategories, projects, type Project } from "../data/projects";
import { ArrowIcon, CompassIcon, ExternalIcon, GitHubIcon } from "./Icons";
import { ProjectModal } from "./ProjectModal";
import { RegionArt } from "./scene/RegionArt";
import { SectionHeader } from "./SectionHeader";
import { Stars } from "./Stars";

/** Banner art: a real screenshot when provided, otherwise the landscape preset. */
export function ProjectBanner({ p, variant = "card" }: { p: Project; variant?: string }) {
  if (p.image) return <img className="region-art" src={p.image} alt="" loading="lazy" decoding="async" />;
  return <RegionArt preset={p.region} id={`${variant}-${p.id}`} />;
}

function ArchiveCard({ p, onOpen }: { p: Project; onOpen: (p: Project) => void }) {
  const repos = p.size === "feature" ? p.repos : p.repos.slice(0, 1);
  const place = places[p.region];
  return (
    <article
      className={`archive-card archive-card--${p.size} reveal`}
      style={{ ["--accent" as string]: place.accent }}
      aria-labelledby={`project-${p.id}`}
    >
      <p className="archive-label">
        <span className="archive-place">{place.name}</span>
        <span className="archive-realm">{p.realm}</span>
        <Stars count={p.rarity} size={13} />
      </p>
      <div className="archive-plate">
        <button type="button" className="archive-frame" onClick={() => onOpen(p)} aria-label={`Open details for ${p.name}, charted in ${place.name}`}>
          <ProjectBanner p={p} />
          <span className="archive-epithet" aria-hidden="true">
            {place.epithet}
          </span>
        </button>
        <div className="archive-caption">
          <h3 id={`project-${p.id}`}>{p.name}</h3>
          <span className="archive-year">{p.year}</span>
        </div>
        <div className="archive-body on-ivory">
          <p className="archive-summary">{p.summary}</p>
          {p.size !== "compact" && (
            <ul className="tag-list" aria-label="Technologies">
              {p.tech.slice(0, p.size === "feature" ? 8 : 5).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <div className="archive-actions">
            <button type="button" className="btn btn--small btn--primary" onClick={() => onOpen(p)} aria-haspopup="dialog">
              <span className="btn-icon">
                <ArrowIcon size={13} />
              </span>
              <span>Details</span>
            </button>
            {repos.map((r) => (
              <a key={r.href} className="btn btn--small btn--ghost" href={r.href} target="_blank" rel="noopener noreferrer">
                <span className="btn-icon">
                  <GitHubIcon size={13} />
                </span>
                <span>{p.repos.length > 1 ? r.label : "Code"}</span>
                <span className="visually-hidden"> for {p.name} (opens in a new tab)</span>
              </a>
            ))}
            {p.demo && (
              <a className="btn btn--small btn--ghost" href={p.demo} target="_blank" rel="noopener noreferrer">
                <span className="btn-icon">
                  <ExternalIcon size={13} />
                </span>
                <span>Live demo</span>
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function Projects() {
  const [open, setOpen] = useState<Project | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const close = useCallback(() => setOpen(null), []);
  const shown = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  return (
    <section id="projects" className="section section--archive projects" aria-labelledby="projects-title">
      <div className="container">
        <SectionHeader
          id="projects-title"
          chapter="Chapter IV · The Exploration Archive"
          title="Projects"
          element="dendro"
          lede="Every project is charted in its own region, from Mondstadt to Snezhnaya. Select an entry to read its full story."
        />

        <div className="archive-bar reveal">
          <p className="archive-heading">
            <span className="archive-heading-icon" aria-hidden="true">
              <CompassIcon size={20} />
            </span>
            Exploration Archive
          </p>
          <label className="archive-select">
            <span className="visually-hidden">Filter projects by type</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All expeditions</option>
              {projectCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <p className="archive-count" aria-live="polite">
            Archive entries unlocked: <strong>{shown.length}</strong>
          </p>
        </div>

        <div className="archive-grid">
          {shown.map((p) => (
            <ArchiveCard key={p.id} p={p} onOpen={setOpen} />
          ))}
        </div>
      </div>

      <ProjectModal project={open} onClose={close} renderVisual={(p) => <ProjectBanner p={p} variant="modal" />} />
    </section>
  );
}
