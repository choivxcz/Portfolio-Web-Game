import { useEffect, useRef, type ReactNode } from "react";
import { places } from "../data/places";
import type { Project } from "../data/projects";
import { CloseIcon, ExternalIcon, GitHubIcon } from "./Icons";
import { Corners, Sparkle } from "./Ornament";
import { Sigil } from "./Sigil";
import { Stars } from "./Stars";

interface Props {
  project: Project | null;
  onClose: () => void;
  renderVisual: (p: Project) => ReactNode;
}

/**
 * Project details in a native <dialog>: focus is trapped and Escape closes it
 * for free, and focus returns to the button that opened it.
 */
export function ProjectModal({ project, onClose, renderVisual }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const place = project ? places[project.region] : null;

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (project && !dlg.open) {
      dlg.showModal();
      document.body.classList.add("modal-open");
    }
    if (!project && dlg.open) dlg.close();
  }, [project]);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const handleClose = () => {
      document.body.classList.remove("modal-open");
      onClose();
    };
    dlg.addEventListener("close", handleClose);
    return () => dlg.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      style={{ ["--accent" as string]: place?.accent }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      {project && place && (
        <div className="modal-inner on-ivory">
          <Corners />
          <button type="button" className="modal-close" onClick={() => ref.current?.close()} aria-label="Close details">
            <CloseIcon size={18} />
          </button>
          <div className="modal-visual">
            {renderVisual(project)}
            <div className="modal-head">
              <p className="modal-realm">
                <Sigil element={project.element} size={18} ring={false} />
                <span>{place.name}</span>
                <span aria-hidden="true">·</span>
                <span>{project.realm}</span>
                <span aria-hidden="true">·</span>
                <span>{project.year}</span>
              </p>
              <h3 id="modal-title" className="modal-title">
                {project.name}
              </h3>
              <Stars count={project.rarity} size={20} />
            </div>
          </div>
          <div className="modal-body">
            <p className="modal-status">{project.status}</p>
            <p className="modal-summary">{project.summary}</p>

            <aside className="modal-place" aria-label="Expedition region">
              <p className="modal-place-name">
                {place.name} <span>· {place.epithet}</span>
              </p>
              <p>{project.regionNote}</p>
            </aside>

            <h4 className="modal-h">The problem</h4>
            <p>{project.problem}</p>

            <h4 className="modal-h">What I built</h4>
            <ul className="modal-list">
              {project.highlights.map((h) => (
                <li key={h}>
                  <Sparkle size={10} />
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <h4 className="modal-h">Technologies</h4>
            <ul className="tag-list" aria-label="Technologies">
              {project.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>

            {project.note && <p className="modal-note">{project.note}</p>}

            <div className="modal-actions">
              {project.repos.map((r) => (
                <a key={r.href} className="btn btn--primary btn--small" href={r.href} target="_blank" rel="noopener noreferrer">
                  <span className="btn-icon">
                    <GitHubIcon size={13} />
                  </span>
                  <span>{r.label}</span>
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              ))}
              {project.demo && (
                <a className="btn btn--ghost btn--small" href={project.demo} target="_blank" rel="noopener noreferrer">
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
      )}
    </dialog>
  );
}
