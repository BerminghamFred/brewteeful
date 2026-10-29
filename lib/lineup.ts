import type { Person } from "@/stores/set-store";

/**
 * Gives everyone without a design a different one, in catalogue order, skipping designs
 * already in the lineup (and only repeating once every design is used). Chosen designs
 * are never changed.
 */
export function fillDesigns(people: Person[], designs: string[]): Person[] {
  const used = new Set(people.map((p) => p.design).filter(Boolean));
  const queue = [...designs.filter((d) => !used.has(d)), ...designs];
  let k = 0;
  return people.map((p) => (p.design || !queue.length ? p : { ...p, design: queue[k++ % queue.length]! }));
}
