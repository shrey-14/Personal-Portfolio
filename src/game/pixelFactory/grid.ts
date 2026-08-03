import { GRID_W, GRID_H, MODULES } from './constants';
import type { ModuleId } from './types';

export type Cell = [number, number];

const NEIGHBORS: Cell[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function key(x: number, y: number) { return `${x},${y}`; }

/** true where a module occupies the cell — belts must route around these. */
export function buildOccupied(): Set<string> {
  const s = new Set<string>();
  for (const m of MODULES) s.add(key(m.gx, m.gy));
  return s;
}

const OCCUPIED = buildOccupied();

/** the free cell immediately beside a module — where belts actually connect. */
export function portOf(id: ModuleId): Cell {
  const m = MODULES.find(mm => mm.id === id)!;
  for (const [dx, dy] of NEIGHBORS) {
    const x = m.gx + dx, y = m.gy + dy;
    if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) continue;
    if (OCCUPIED.has(key(x, y))) continue;
    return [x, y];
  }
  return [m.gx, m.gy];
}

/** BFS shortest path between two free cells, avoiding module tiles. */
export function findCellPath(start: Cell, goal: Cell): Cell[] | null {
  if (start[0] === goal[0] && start[1] === goal[1]) return [start];
  const startK = key(...start);
  const goalK = key(...goal);
  const visited = new Set<string>([startK]);
  const prev = new Map<string, string>();
  const queue: Cell[] = [start];
  let qi = 0;
  while (qi < queue.length) {
    const [cx, cy] = queue[qi++];
    const ck = key(cx, cy);
    if (ck === goalK) break;
    for (const [dx, dy] of NEIGHBORS) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) continue;
      const k = key(x, y);
      if (visited.has(k)) continue;
      if (OCCUPIED.has(k) && k !== goalK) continue;
      visited.add(k);
      prev.set(k, ck);
      queue.push([x, y]);
    }
  }
  if (!visited.has(goalK)) return null;
  const path: Cell[] = [goal];
  let cur = goalK;
  while (cur !== startK) {
    const p = prev.get(cur);
    if (!p) return null;
    const [px, py] = p.split(',').map(Number);
    path.push([px, py]);
    cur = p;
  }
  return path.reverse();
}

export function gridToWorld(gx: number, gy: number): [number, number] {
  return [gx - (GRID_W - 1) / 2, gy - (GRID_H - 1) / 2];
}
