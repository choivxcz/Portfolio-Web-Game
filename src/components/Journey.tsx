import { journey, type JourneyStop } from "../data/journey";
import { RegionArt } from "./scene/RegionArt";
import { SectionHeader } from "./SectionHeader";
import { Sigil } from "./Sigil";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Chapter titles and landscape fragments for each year of the log. */
const chapters: Record<string, { title: string; preset: string }> = {
  Earlier: { title: "Before the Journey", preset: "riverlands" },
  "2025": { title: "First Steps", preset: "windfields" },
  "2026": { title: "Into the Wider World", preset: "plains" },
};

function groupByYear(stops: JourneyStop[]) {
  const groups: { year: string; stops: { stop: JourneyStop; index: number }[] }[] = [];
  stops.forEach((stop, index) => {
    const year = stop.date.match(/20\d\d/g)?.pop() ?? "Earlier";
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.stops.push({ stop, index });
    else groups.push({ year, stops: [{ stop, index }] });
  });
  return groups;
}

export function Journey() {
  const groups = groupByYear(journey);

  return (
    <section id="journey" className="section section--ivory on-ivory journey" aria-labelledby="journey-title">
      <div className="container">
        <SectionHeader
          id="journey-title"
          chapter="Chapter II · Adventure Log"
          title="My Journey"
          element="cryo"
          lede="Every entry below is a real project or course, dated from its repository."
        />

        <div className="log">
          {groups.map((g) => {
            const chapter = chapters[g.year] ?? { title: "The Road Ahead", preset: "plains" };
            return (
              <section key={g.year} className="log-chapter" aria-label={`${g.year}: ${chapter.title}`}>
                <header className="log-banner reveal">
                  <RegionArt preset={chapter.preset} id={`log-${g.year}`} />
                  <div className="log-banner-text">
                    <span className="log-year">{g.year}</span>
                    <span className="log-chapter-title">{chapter.title}</span>
                  </div>
                </header>

                <ol className="log-entries">
                  {g.stops.map(({ stop, index }) => (
                    <li key={stop.title} className="log-entry reveal" style={{ ["--accent" as string]: `var(--${stop.element})` }}>
                      <span className="log-marker" aria-hidden="true">
                        <Sigil element={stop.element} size={20} ring={false} />
                      </span>
                      <div className="log-card">
                        <p className="log-meta">
                          <span className="log-act">Act {ROMAN[index] ?? index + 1}</span>
                          <time>{stop.date}</time>
                        </p>
                        <h3 className="log-title">{stop.title}</h3>
                        <p className="log-text">{stop.body}</p>
                        {stop.tags && (
                          <ul className="tag-list" aria-label="Technologies">
                            {stop.tags.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
          <p className="log-continues reveal">
            <span aria-hidden="true">◆</span> The road continues…
          </p>
        </div>
      </div>
    </section>
  );
}
