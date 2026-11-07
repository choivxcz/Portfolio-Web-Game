import type { ReactElement } from "react";

/** Small flat silhouette icons for the navigation (original drawings, 24×24). */
const paths: Record<string, ReactElement> = {
  home: (
    <path d="M12 3.2L3 10.4h2.4V20h5v-5.2h3.2V20h5v-9.6H21zM12 6.4l1.6 1.3-1.6 1.6-1.6-1.6z" />
  ),
  about: (
    <path d="M3 5.2c3-.9 6-.5 8.2 1.1V20c-2.2-1.5-5.2-1.9-8.2-1zm18 0V19c-3-.9-6-.5-8.2 1V6.3c2.2-1.6 5.2-2 8.2-1.1zM15 9.4l1.2 2.4 2.4 1.2-2.4 1.2L15 16.6l-1.2-2.4-2.4-1.2 2.4-1.2z" />
  ),
  skills: (
    <path d="M12 2l2.3 6.2L20.5 10l-6.2 2.3L12 18.5l-2.3-6.2L3.5 10l6.2-1.8zM18.5 15.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
  ),
  projects: (
    <path d="M3 5.5l5.5-2 7 2 5.5-2V18.5l-5.5 2-7-2-5.5 2zm6 .4v10.9l6 1.7V7.6zM12 9.8l1 1.9-1 1.9-1-1.9z" />
  ),
  achievements: (
    <path d="M7 3h10v2.2h3.2c0 3.4-1.8 5.8-4.4 6.3A5 5 0 0 1 13 14v2.8h3.2V20H7.8v-3.2H11V14a5 5 0 0 1-2.8-2.5C5.6 11 3.8 8.6 3.8 5.2H7zm-1.5 3.6c.3 1.4 1 2.4 2 2.9a7 7 0 0 1-.5-2.9zm13 0H17c0 1-.2 2-.5 2.9 1-.5 1.7-1.5 2-2.9zM12 5.4l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9z" />
  ),
  contact: (
    <path d="M4.5 4.5h15A1.5 1.5 0 0 1 21 6v9.5a1.5 1.5 0 0 1-1.5 1.5H11l-5 4v-4H4.5A1.5 1.5 0 0 1 3 15.5V6a1.5 1.5 0 0 1 1.5-1.5zm7.5 2.8l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
  ),
};

export function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
