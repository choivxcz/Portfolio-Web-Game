import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/nav.css";
import "./styles/hero.css";
import "./styles/about.css";
import "./styles/journey.css";
import "./styles/skills.css";
import "./styles/projects.css";
import "./styles/modal.css";
import "./styles/achievements.css";
import "./styles/contact.css";
import "./styles/reviews.css";
import "./styles/repos.css";
import "./styles/footer.css";
import "./styles/hud.css";
import "./styles/panel.css";
import "./styles/menu.css";

// Hidden-until-revealed styles only apply when motion is allowed.
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("motion");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
