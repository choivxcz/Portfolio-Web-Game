import { useMemo } from "react";
import { PROPS } from "../layout";
import { terrainHeight } from "../terrain";
import { ModelInstances } from "./Models";

const url = (name: string) => `${import.meta.env.BASE_URL}models/town/${name}.glb`;

/** Village dressing from the CC0 Kenney Fantasy Town Kit, grouped by model for instancing. */
export function TownProps({ shadows }: { shadows: boolean }) {
  const groups = useMemo(() => {
    const map = new Map<string, { height: number; items: { x: number; y: number; z: number; s: number; ry: number; variant: number }[] }>();
    for (const p of PROPS) {
      const g = map.get(p.model) ?? { height: p.height, items: [] };
      g.items.push({ x: p.x, y: terrainHeight(p.x, p.z) - 0.05, z: p.z, s: 1, ry: p.yaw, variant: 0 });
      map.set(p.model, g);
    }
    return [...map.entries()];
  }, []);
  return (
    <>
      {groups.map(([model, g]) => (
        <ModelInstances key={model} url={url(model)} items={g.items} height={g.height} shadows={shadows} />
      ))}
    </>
  );
}
