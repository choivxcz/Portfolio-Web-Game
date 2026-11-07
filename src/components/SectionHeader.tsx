import type { Element } from "../data/elements";
import { Divider } from "./Ornament";
import { Sigil } from "./Sigil";

interface Props {
  id: string;
  chapter: string;
  title: string;
  lede?: string;
  element: Element;
  align?: "left" | "center";
}

export function SectionHeader({ id, chapter, title, lede, element, align = "center" }: Props) {
  return (
    <header className={`section-header section-header--${align} reveal`}>
      <p className="section-chapter">
        <Sigil element={element} size={22} ring={false} />
        <span>{chapter}</span>
      </p>
      <h2 id={id} className="section-title">
        {title}
      </h2>
      <Divider />
      {lede && <p className="section-lede">{lede}</p>}
    </header>
  );
}
