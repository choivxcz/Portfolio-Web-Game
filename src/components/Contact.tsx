import type { ReactNode } from "react";
import { profile } from "../data/profile";
import { ExternalIcon, FacebookIcon, GitHubIcon, InstagramIcon, LinkedInIcon, MailIcon } from "./Icons";
import { Corners, Divider } from "./Ornament";
import { Particles } from "./Particles";
import { RegionArt } from "./scene/RegionArt";

const DUSK_COLORS = ["#fff1c9", "#ffd9a0", "#ffffff"];

interface Row {
  icon: ReactNode;
  title: string;
  detail: string;
  href: string;
  external: boolean;
}

export function Contact() {
  const { email, github, githubHandle, linkedin, instagram, instagramHandle, facebook, others } = profile.links;
  const rows: Row[] = [
    ...(email ? [{ icon: <MailIcon />, title: "Email", detail: email, href: `mailto:${email}`, external: false }] : []),
    { icon: <GitHubIcon />, title: "GitHub", detail: `github.com/${githubHandle}`, href: github, external: true },
    ...(instagram ? [{ icon: <InstagramIcon />, title: "Instagram", detail: `@${instagramHandle}`, href: instagram, external: true }] : []),
    ...(facebook ? [{ icon: <FacebookIcon />, title: "Facebook", detail: "Karl Sebastian V. Cuerdo", href: facebook, external: true }] : []),
    ...(linkedin ? [{ icon: <LinkedInIcon />, title: "LinkedIn", detail: "Professional profile", href: linkedin, external: true }] : []),
    ...others.map((o) => ({ icon: <ExternalIcon />, title: o.label, detail: o.href.replace(/^https?:\/\//, ""), href: o.href, external: true })),
  ];
  const primary = rows[0];

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="contact-scene" aria-hidden="true">
        <RegionArt preset="newshore" id="contact-bg" />
      </div>
      <Particles density={2.5} colors={DUSK_COLORS} drift={0.2} className="contact-particles" />

      <div className="container contact-inner">
        <header className="destination reveal">
          <p className="destination-kicker">Chapter VI · A New Destination</p>
          <h2 id="contact-title" className="destination-title">
            A New Journey
          </h2>
          <Divider className="destination-rule" />
          <p className="destination-sub">Let's build something worth exploring.</p>
        </header>

        <div className="contact-panel frame on-ivory reveal">
          <Corners />
          <div className="contact-copy">
            <h3 className="contact-heading">Open to new adventures</h3>
            <p>
              I'm open to internships, collaborations, and conversations about software that helps people. Whether you have a
              project in mind or just want to say hello, I'd be glad to hear from you.
            </p>
            <a
              className="btn btn--primary btn--large"
              href={primary.href}
              {...(primary.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <span className="btn-icon">{primary.icon}</span>
              <span>{email ? "Send me a message" : "Visit my GitHub"}</span>
              {primary.external && <span className="visually-hidden"> (opens in a new tab)</span>}
            </a>
          </div>

          <ul className="contact-rows" aria-label="Where to find me">
            {rows.map((r) => (
              <li key={r.href}>
                <a href={r.href} className="contact-row" {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <span className="contact-row-icon">{r.icon}</span>
                  <span className="contact-row-text">
                    <span className="contact-row-title">{r.title}</span>
                    <span className="contact-row-detail">{r.detail}</span>
                  </span>
                  <span className="contact-row-go" aria-hidden="true">
                    <ExternalIcon size={16} />
                  </span>
                  {r.external && <span className="visually-hidden"> (opens in a new tab)</span>}
                </a>
              </li>
            ))}
            <li>
              <a href="#home" className="contact-row">
                <span className="contact-row-icon" aria-hidden="true">
                  ◆
                </span>
                <span className="contact-row-text">
                  <span className="contact-row-title">Return to the start</span>
                  <span className="contact-row-detail">Back to the opening vista</span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
