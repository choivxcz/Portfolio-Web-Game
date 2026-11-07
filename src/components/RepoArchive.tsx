import { useEffect, useMemo, useState } from "react";
import snapshot from "../data/github.json";
import { repoProject } from "../data/projects";

/**
 * The Repository Archive: every public repository on the GitHub profile, with a
 * language breakdown and a timeline from each repo's creation to its latest push.
 * It starts from the snapshot in src/data/github.json (refreshed on every deploy)
 * and updates itself from the GitHub API when the page is open.
 */
interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  htmlUrl: string;
  createdAt: string;
  pushedAt: string;
}

/** GitHub's own language colours, so the bar reads like the profile page. */
const LANG_COLOR: Record<string, string> = {
  Python: "#3572A5",
  "Jupyter Notebook": "#DA5B0B",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Dart: "#00B4AB",
  "C#": "#178600",
  GAML: "#8fbd2f",
  R: "#198CE7",
  HTML: "#e34c26",
  CSS: "#563d7c",
};
const langColor = (l: string) => LANG_COLOR[l] ?? "#9aa3b5";
const langName = (l: string | null) => l ?? "Docs & notes";

const CACHE_KEY = "repo-archive.v1";
const DAY = 86400000;
const month = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Live data from the API, merged onto the snapshot (which keeps the original creation dates). */
function useRepos() {
  const base = snapshot.repos as Repo[];
  const [state, setState] = useState<{ repos: Repo[]; live: boolean; at: string }>({ repos: base, live: false, at: snapshot.fetchedAt });

  useEffect(() => {
    let alive = true;
    const merge = (live: Repo[], at: string) => {
      const known = new Map(base.map((r) => [r.name, r]));
      const repos = live.map((r) => {
        const k = known.get(r.name);
        return k && k.createdAt < r.createdAt ? { ...r, createdAt: k.createdAt } : r;
      });
      if (alive && repos.length) setState({ repos, live: true, at });
    };
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null");
      if (cached && Date.now() - cached.t < 3600000) {
        merge(cached.repos, new Date(cached.t).toISOString());
        return;
      }
    } catch {
      /* no cache */
    }
    const controller = new AbortController();
    fetch(`https://api.github.com/users/${snapshot.user.login}/repos?per_page=100&type=owner`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { name: string; description: string | null; language: string | null; html_url: string; created_at: string; pushed_at: string; fork: boolean; private: boolean }[]) => {
        const repos = data
          .filter((r) => !r.fork && !r.private)
          .map((r) => ({ name: r.name, description: r.description, language: r.language, htmlUrl: r.html_url, createdAt: r.created_at, pushedAt: r.pushed_at }));
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), repos }));
        } catch {
          /* ignore */
        }
        merge(repos, new Date().toISOString());
      })
      .catch(() => undefined); // offline or rate-limited: the snapshot stays
    return () => {
      alive = false;
      controller.abort();
    };
  }, [base]);
  return state;
}

export function RepoArchive() {
  const { repos: raw, live, at } = useRepos();
  const repos = useMemo(() => [...raw].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [raw]);

  const langs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of repos) counts.set(langName(r.language), (counts.get(langName(r.language)) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [repos]);

  if (!repos.length) return null;
  const first = new Date(repos[0].createdAt);
  const latest = repos.reduce((m, r) => (r.pushedAt > m ? r.pushedAt : m), repos[0].pushedAt);
  const start = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
  const endD = new Date(Math.max(Date.parse(latest), Date.parse(at)));
  const end = Date.UTC(endD.getUTCFullYear(), endD.getUTCMonth() + 1, 1);
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - start) / (end - start)) * 100));
  const ticks: number[] = [];
  for (let d = new Date(start); d.getTime() <= end; d.setUTCMonth(d.getUTCMonth() + 3)) ticks.push(d.getTime());
  const linked = repos.filter((r) => repoProject[r.name]).length;
  const codeLangs = langs.filter(([l]) => l !== langName(null)).length;

  return (
    <div className="repo-archive reveal" aria-labelledby="repo-archive-title">
      <header className="repo-head">
        <h3 id="repo-archive-title" className="repo-title">
          Repository Archive
        </h3>
        <p className="repo-sub">
          Every public repository on{" "}
          <a href={snapshot.user.htmlUrl} target="_blank" rel="noopener noreferrer">
            github.com/{snapshot.user.login}
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
          , from the first commit to the latest push.{" "}
          <span className="repo-sync">{live ? "Live from GitHub." : `Synced ${day.format(new Date(at))}.`}</span>
        </p>
      </header>

      <dl className="repo-stats">
        <div>
          <dt>Public repositories</dt>
          <dd>{repos.length}</dd>
        </div>
        <div>
          <dt>Languages</dt>
          <dd>{codeLangs}</dd>
        </div>
        <div>
          <dt>Charted as projects</dt>
          <dd>{linked}</dd>
        </div>
        <div>
          <dt>First repository</dt>
          <dd>{month.format(first)}</dd>
        </div>
        <div>
          <dt>Latest push</dt>
          <dd>{day.format(new Date(latest))}</dd>
        </div>
        {snapshot.user.hireable && (
          <div className="repo-stat--hire">
            <dt>Status</dt>
            <dd>Available for hire</dd>
          </div>
        )}
      </dl>

      <div className="repo-langs">
        <p className="repo-label">Languages by repository</p>
        <div className="repo-langbar" role="img" aria-label={langs.map(([l, n]) => `${l}: ${n}`).join(", ")}>
          {langs.map(([l, n]) => (
            <span key={l} style={{ flexGrow: n, background: langColor(l) }} title={`${l}: ${n}`} />
          ))}
        </div>
        <ul className="repo-legend">
          {langs.map(([l, n]) => (
            <li key={l}>
              <i style={{ background: langColor(l) }} aria-hidden="true" />
              {l} <span>{n}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="repo-timeline">
        <p className="repo-label">Timeline · created → latest push</p>
        <div className="repo-axis" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} style={{ left: `${pct(t)}%` }}>
              {month.format(new Date(t))}
            </span>
          ))}
        </div>
        <ol className="repo-rows">
          {repos.map((r) => {
            const c = Date.parse(r.createdAt);
            const p = Math.max(c, Date.parse(r.pushedAt));
            const project = repoProject[r.name];
            const days = Math.round((p - c) / DAY);
            return (
              <li key={r.name} className={`repo-row ${project ? "is-project" : ""}`}>
                <a href={r.htmlUrl} target="_blank" rel="noopener noreferrer" className="repo-link">
                  <span className="repo-name">
                    <i style={{ background: langColor(langName(r.language)) }} aria-hidden="true" />
                    {r.name}
                    {project && <span className="repo-tag">{project}</span>}
                  </span>
                  {r.description && <span className="repo-desc">{r.description}</span>}
                  <span className="repo-dates">
                    {day.format(new Date(c))} → {day.format(new Date(p))} · {langName(r.language)}
                    {days > 0 ? ` · ${days} days` : ""}
                  </span>
                  <span className="repo-track" aria-hidden="true">
                    <span className="repo-bar" style={{ left: `${pct(c)}%`, width: `max(6px, ${pct(p) - pct(c)}%)` }} />
                  </span>
                  <span className="visually-hidden"> (opens on GitHub in a new tab)</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
