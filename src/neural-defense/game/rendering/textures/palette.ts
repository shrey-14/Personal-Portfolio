export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** The classic 16-color VGA/CGA palette. Every procedurally generated texture
 *  and most material colors in this module are drawn from (or quantized to)
 *  this set — the "limited color palette" that sells the late-90s PC look. */
export const VGA_PALETTE: readonly RGB[] = [
  { r: 0x00, g: 0x00, b: 0x00 }, // black
  { r: 0x00, g: 0x00, b: 0xaa }, // blue
  { r: 0x00, g: 0xaa, b: 0x00 }, // green
  { r: 0x00, g: 0xaa, b: 0xaa }, // cyan
  { r: 0xaa, g: 0x00, b: 0x00 }, // red
  { r: 0xaa, g: 0x00, b: 0xaa }, // magenta
  { r: 0xaa, g: 0x55, b: 0x00 }, // brown
  { r: 0xaa, g: 0xaa, b: 0xaa }, // light gray
  { r: 0x55, g: 0x55, b: 0x55 }, // dark gray
  { r: 0x55, g: 0x55, b: 0xff }, // light blue
  { r: 0x55, g: 0xff, b: 0x55 }, // light green
  { r: 0x55, g: 0xff, b: 0xff }, // light cyan
  { r: 0xff, g: 0x55, b: 0x55 }, // light red
  { r: 0xff, g: 0x55, b: 0xff }, // light magenta
  { r: 0xff, g: 0xff, b: 0x55 }, // yellow
  { r: 0xff, g: 0xff, b: 0xff }, // white
] as const;

/** Nearest-color search (squared Euclidean distance in RGB space) — snaps an
 *  arbitrary color onto the given palette. Defaults to VGA_PALETTE. */
export function quantizeToPalette(color: RGB, palette: readonly RGB[] = VGA_PALETTE): RGB {
  let closest = palette[0];
  let closestDistance = Infinity;
  for (const swatch of palette) {
    const dr = swatch.r - color.r;
    const dg = swatch.g - color.g;
    const db = swatch.b - color.b;
    const distance = dr * dr + dg * dg + db * db;
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = swatch;
    }
  }
  return closest;
}

export function rgbToHex({ r, g, b }: RGB): number {
  return (r << 16) | (g << 8) | b;
}

export function hexToRgb(hex: number): RGB {
  return { r: (hex >> 16) & 0xff, g: (hex >> 8) & 0xff, b: hex & 0xff };
}

export function rgbToCss({ r, g, b }: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}
