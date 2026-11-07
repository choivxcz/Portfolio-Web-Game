import { profile } from "../data/profile";
import { Sigil } from "./Sigil";

const elements = ["anemo", "geo", "electro", "dendro", "hydro", "pyro", "cryo"] as const;

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-elements" aria-hidden="true">
          {elements.map((e) => (
            <span key={e} style={{ color: `var(--${e})` }}>
              <Sigil element={e} size={18} ring={false} />
            </span>
          ))}
        </div>
        <p>
          © {new Date().getFullYear()} {profile.name} · {profile.location}
        </p>
        <p className="footer-small">
          Built with React, TypeScript &amp; Vite. A fan-made tribute to the art style of Genshin Impact — not affiliated with
          or endorsed by HoYoverse. All artwork on this site is original.
        </p>
        <a className="footer-top" href="#home">
          Return to the beginning ↑
        </a>
      </div>
    </footer>
  );
}
