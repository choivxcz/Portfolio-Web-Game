import { profile } from "../data/profile";
import { projects } from "../data/projects";
import { Sparkle } from "./Ornament";
import { RegionArt } from "./scene/RegionArt";
import { SectionHeader } from "./SectionHeader";
import { Sigil } from "./Sigil";

const tabs = [
  { href: "#about", label: "Profile", tone: "ivory" },
  { href: "#journey", label: "Journey", tone: "green" },
  { href: "#skills", label: "Skills", tone: "teal" },
  { href: "#projects", label: "Projects", tone: "amber" },
  { href: "#achievements", label: "Honors", tone: "rose" },
];

const stats = [
  { value: "15", label: "Public repositories", element: "anemo" as const },
  { value: "5", label: "Platforms explored", element: "electro" as const },
  { value: "18", label: "REST endpoints in one API", element: "hydro" as const },
  { value: "13", label: "Features in an ML model", element: "dendro" as const },
];

function RowIcon() {
  return (
    <svg className="row-icon" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l7 10-7 10-7-10z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7l3.5 5-3.5 5-3.5-5z" fill="currentColor" />
    </svg>
  );
}

export function About() {
  const languages = ["Python", "TypeScript", "JavaScript", "Dart", "C#", "SQL"];
  const year = profile.university ? `${profile.yearLevel} year · ${profile.university}` : `${profile.yearLevel} year`;

  return (
    <section id="about" className="section section--ivory on-ivory about" aria-labelledby="about-title">
      <div className="container">
        <SectionHeader
          id="about-title"
          chapter="Chapter I · Adventurer Profile"
          title="About Me"
          element="anemo"
          lede="Field notes on who I am, what I build, and why — kept in an adventurer's handbook."
        />

        <div className="handbook reveal">
          <nav className="handbook-tabs" aria-label="Jump to a chapter">
            {tabs.map((t) => (
              <a key={t.href} href={t.href} className={`handbook-tab tab--${t.tone}`} aria-current={t.href === "#about" ? "true" : undefined}>
                {t.label}
              </a>
            ))}
          </nav>

          <div className="handbook-book">
            <span className="book-cap book-cap--tl" aria-hidden="true" />
            <span className="book-cap book-cap--tr" aria-hidden="true" />
            <span className="book-cap book-cap--bl" aria-hidden="true" />
            <span className="book-cap book-cap--br" aria-hidden="true" />

            <div className="handbook-page handbook-page--left">
              <h3 className="page-title">Adventurer Profile</h3>
              <div className="namecard">
                <div className="namecard-art">
                  <RegionArt preset="plains" id="namecard" />
                </div>
                <div className="namecard-seal" aria-hidden="true">
                  {profile.initials}
                </div>
              </div>
              <p className="profile-name">{profile.name}</p>
              <p className="profile-ribbon">
                <Sparkle size={9} />
                <span>Computer Science Student</span>
                <Sparkle size={9} />
              </p>
              <dl className="attr-list">
                <div>
                  <dt>Path</dt>
                  <dd>{profile.degree}</dd>
                </div>
                <div>
                  <dt>Year</dt>
                  <dd>{year}</dd>
                </div>
                <div>
                  <dt>Region</dt>
                  <dd>{profile.location}</dd>
                </div>
                <div>
                  <dt>Focus</dt>
                  <dd>AI-assisted systems · Full-stack web</dd>
                </div>
                <div className="attr-tags">
                  <dt>Languages</dt>
                  <dd>
                    {languages.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="handbook-page handbook-page--right">
              <h3 className="page-title">Travel Journal</h3>
              <ol className="journal-list">
                <li className="journal-row journal-row--current">
                  <RowIcon />
                  <div>
                    <p className="row-title">Who I am</p>
                    <p className="row-text">
                      A {profile.yearLevel.toLowerCase()}-year {profile.degree} student
                      {profile.university ? ` at ${profile.university}` : ""} from {profile.location} who likes turning messy,
                      real-world processes into software that people can actually use.
                    </p>
                  </div>
                </li>
                {profile.previousBackground && (
                  <li className="journal-row">
                    <RowIcon />
                    <div>
                      <p className="row-title">Before Computer Science</p>
                      <p className="row-text">{profile.previousBackground}</p>
                    </div>
                  </li>
                )}
                <li className="journal-row">
                  <RowIcon />
                  <div>
                    <p className="row-title">Where it began</p>
                    <p className="row-text">
                      My first project was a PyQt5 app that tracked a business's daily sales. Since then: a Flutter finance app
                      with an AI assistant, a folklore horror game in Unity, classroom simulations, and machine-learning notebooks.
                    </p>
                  </div>
                </li>
                <li className="journal-row">
                  <RowIcon />
                  <div>
                    <p className="row-title">What I'm building now</p>
                    <p className="row-text">
                      Systems for public service — <em>Iskolar ng Bayan</em> helps a youth development office screen scholarship
                      applicants with a Random Forest model that advises staff, never replaces them.
                    </p>
                  </div>
                </li>
                <li className="journal-row">
                  <RowIcon />
                  <div>
                    <p className="row-title">How I work</p>
                    <p className="row-text">
                      Build the careful parts first — validation, tests, clear status flows — so the interesting parts can be
                      trusted.
                    </p>
                  </div>
                </li>
              </ol>
              <p className="page-footnote">
                {projects.length} discoveries recorded · <a href="#projects">open the archive</a>
              </p>
            </div>
          </div>
        </div>

        <ul className="stat-rows" aria-label="Highlights">
          {stats.map((s, i) => (
            <li key={s.label} className="stat-row reveal" style={{ ["--d" as string]: `${i * 70}ms`, ["--accent" as string]: `var(--${s.element})` }}>
              <Sigil element={s.element} size={26} ring={false} />
              <span className="stat-label">{s.label}</span>
              <span className="stat-value">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
