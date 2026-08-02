/* ══════════════════════════════════════════════════════════════════════════
   PixelIcon.tsx — tiny hand-drawn bitmap icons for Pixel Factory 95.
   Every hardware module gets one glyph; the same glyph rides above a
   worker's head as its task icon, so "what do I carry" and "where does it
   go" are literally the same shape — a colourblind-safe, silhouette-first
   read instead of a colour-only cue.
   ═════════════════════════════════════════════════════════════════════════ */
import { memo } from 'react';
import type { ModuleId, PowerupId } from '../types';

type Grid = string[];
type Palette = Record<string, string>;

const DEFAULT_PALETTE: Palette = {
  '.': 'transparent',
  X: '#1b1e24',
  o: '#ffffff',
  '+': '#ffb454',
};

function Bitmap({ grid, palette = DEFAULT_PALETTE, size = 16 }: { grid: Grid; palette?: Palette; size?: number }) {
  const n = grid.length;
  const px = size / n;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-hidden="true">
      {grid.map((row, y) => row.split('').map((c, x) => {
        const fill = palette[c];
        if (!fill || fill === 'transparent') return null;
        return <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />;
      }))}
    </svg>
  );
}

/* ── module glyphs (8x8) ─────────────────────────────────────────────── */
const MODULE_GRIDS: Record<ModuleId, Grid> = {
  floppy: [
    '.XXXXXX.',
    'XXXXXXXX',
    'XX....XX',
    'XX.oo.XX',
    'XX....XX',
    'X..XX..X',
    'X.XXXX.X',
    '.XXXXXX.',
  ],
  cpu: [
    '..X..X..',
    '.XXXXXX.',
    'X.XXXX.X',
    'XX.oo.XX',
    'XX.oo.XX',
    'X.XXXX.X',
    '.XXXXXX.',
    '..X..X..',
  ],
  ram: [
    'XXXXXXXX',
    'X.o..o.X',
    'X.o..o.X',
    'X.o..o.X',
    'X.o..o.X',
    'X.o..o.X',
    'X......X',
    'X.X.X.X.',
  ],
  hdd: [
    '.XXXXXX.',
    'XXXXXXXX',
    'X.oooo.X',
    'X.oXXo.X',
    'X.oooo.X',
    'XXXXXXXX',
    'X..++..X',
    '.XXXXXX.',
  ],
  printer: [
    '..oooo..',
    '.oXXXXo.',
    'XXXXXXXX',
    'X......X',
    'X.oooo.X',
    'X.oooo.X',
    '.XXXXXX.',
    '..X..X..',
  ],
  cdrom: [
    '.XXXXXX.',
    'XX....XX',
    'X.XXXX.X',
    'X.X++X.X',
    'X.X++X.X',
    'X.XXXX.X',
    'XX....XX',
    '.XXXXXX.',
  ],
  modem: [
    '..X..X..',
    '.X.XX.X.',
    'X.XXXX.X',
    '..XXXX..',
    '.XXXXXX.',
    'XXXXXXXX',
    'X.++++.X',
    'XXXXXXXX',
  ],
  soundcard: [
    '...XX...',
    '..XXXX..',
    '.XX..XX.',
    'XX....XX',
    'X.o..o.X',
    'XX....XX',
    '.XX..XX.',
    '..XXXX..',
  ],
  virusscanner: [
    '.XXXXXX.',
    'XXoXXoXX',
    'XXXXXXXX',
    'X.XooX.X',
    'X.oXXo.X',
    'XXXXXXXX',
    '.XXXXXX.',
    '..XXXX..',
  ],
  gpu: [
    'XXXXXXXX',
    'X.oooo.X',
    'X.o..o.X',
    'X.o+o.oX',
    'X.oooo.X',
    'XXXXXXXX',
    '..XXXX..',
    '.XXXXXX.',
  ],
  psu: [
    '....XX..',
    '...XX...',
    '..XX....',
    '.XXXXXX.',
    '....XX..',
    '...XX...',
    '..XX....',
    '.XX.....',
  ],
  recyclebin: [
    '.XXXXXX.',
    'XXXXXXXX',
    '.XXXXXX.',
    '.XoXoXo.',
    '.XoXoXo.',
    '.XoXoXo.',
    '.XoXoXo.',
    '..XXXX..',
  ],
  backup: [
    '.XXXXXX.',
    'XXXXXXXX',
    'X..++..X',
    'X.++++.X',
    'X..++..X',
    'X......X',
    'XXXXXXXX',
    '.XXXXXX.',
  ],
};

export const ModuleIcon = memo(function ModuleIcon(
  { id, size = 16, scrambled }: { id: ModuleId; size?: number; scrambled?: ModuleId },
) {
  return <Bitmap grid={MODULE_GRIDS[scrambled ?? id]} size={size} />;
});

/* ── powerup glyphs (8x8) ────────────────────────────────────────────── */
const POWERUP_GRIDS: Record<PowerupId, Grid> = {
  turbo_cpu: MODULE_GRIDS.cpu,
  double_speed: [
    '.X...X..',
    '.XX..XX.',
    '.XXX.XXX',
    '.XXXXXXX',
    '.XXX.XXX',
    '.XX..XX.',
    '.X...X..',
    '........',
  ],
  instant_repair: [
    '.....XX.',
    '....XX..',
    '...XX.X.',
    'XX.XX.XX',
    '.XXXX.X.',
    '..XX....',
    '.XX.....',
    'XX......',
  ],
  freeze_time: [
    '..X..X..',
    'X.X..X.X',
    '.XXXXXX.',
    'XXX..XXX',
    'XXX..XXX',
    '.XXXXXX.',
    'X.X..X.X',
    '..X..X..',
  ],
  disk_cleanup: MODULE_GRIDS.hdd,
  auto_sort: [
    'XX......',
    'XXXX....',
    'XXXXXX..',
    '.XXXXXX.',
    '..XXXXXX',
    '....XXXX',
    '......XX',
    '........',
  ],
  virus_shield: MODULE_GRIDS.virusscanner,
  combo_multiplier: [
    'X......X',
    'XX....XX',
    '.XX..XX.',
    '..XXXX..',
    '..XXXX..',
    '.XX..XX.',
    'XX....XX',
    'X......X',
  ],
};

export const PowerupIcon = memo(function PowerupIcon({ id, size = 16 }: { id: PowerupId; size?: number }) {
  return <Bitmap grid={POWERUP_GRIDS[id]} size={size} />;
});

export { Bitmap };
