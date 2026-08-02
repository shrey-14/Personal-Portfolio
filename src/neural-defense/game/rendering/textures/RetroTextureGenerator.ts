import * as THREE from 'three';
import { createSeededRandom } from '../../core/random';
import { hexToRgb, quantizeToPalette, rgbToCss, type RGB } from './palette';

/** 4x4 ordered (Bayer) dither matrix — the classic technique VGA-era software
 *  renderers used to fake extra shades out of a tiny palette. */
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function bayerThreshold(x: number, y: number): number {
  return (BAYER_4X4[y % 4][x % 4] + 0.5) / 16;
}

function createContext(size: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/** Wraps a generated canvas as a nearest-filtered, non-mipmapped texture —
 *  every generator below funnels through this so pixelation is guaranteed. */
function toTexture(ctx: CanvasRenderingContext2D, repeat: [number, number] = [1, 1]): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(ctx.canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function setPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: RGB): void {
  ctx.fillStyle = rgbToCss(color);
  ctx.fillRect(x, y, 1, 1);
}

export interface DitherGradientOptions {
  size?: number;
  repeat?: [number, number];
}

/** Ordered-dither diagonal gradient between two colors, both snapped to the
 *  VGA palette first — reads as a smooth ramp from a distance despite using
 *  only the two source colors, exactly like period 3D software renderers. */
export function createDitherGradientTexture(
  colorA: number,
  colorB: number,
  { size = 32, repeat = [1, 1] }: DitherGradientOptions = {},
): THREE.CanvasTexture {
  const ctx = createContext(size);
  const a = quantizeToPalette(hexToRgb(colorA));
  const b = quantizeToPalette(hexToRgb(colorB));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size - 2);
      const pick = t > bayerThreshold(x, y) ? b : a;
      setPixel(ctx, x, y, pick);
    }
  }
  return toTexture(ctx, repeat);
}

export interface CheckerOptions {
  size?: number;
  cells?: number;
  repeat?: [number, number];
}

export function createCheckerTexture(
  colorA: number,
  colorB: number,
  { size = 32, cells = 4, repeat = [1, 1] }: CheckerOptions = {},
): THREE.CanvasTexture {
  const ctx = createContext(size);
  const a = quantizeToPalette(hexToRgb(colorA));
  const b = quantizeToPalette(hexToRgb(colorB));
  const cellSize = size / cells;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      setPixel(ctx, x, y, (cellX + cellY) % 2 === 0 ? a : b);
    }
  }
  return toTexture(ctx, repeat);
}

export interface StripeOptions {
  size?: number;
  stripeWidth?: number;
  repeat?: [number, number];
}

/** Diagonal hazard stripes — sci-fi industrial panel/barrier texture. */
export function createStripeTexture(
  colorA: number,
  colorB: number,
  { size = 32, stripeWidth = 4, repeat = [1, 1] }: StripeOptions = {},
): THREE.CanvasTexture {
  const ctx = createContext(size);
  const a = quantizeToPalette(hexToRgb(colorA));
  const b = quantizeToPalette(hexToRgb(colorB));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const band = Math.floor((x + y) / stripeWidth);
      setPixel(ctx, x, y, band % 2 === 0 ? a : b);
    }
  }
  return toTexture(ctx, repeat);
}

export interface NoiseOptions {
  size?: number;
  seed?: number;
  repeat?: [number, number];
}

/** Deterministic per-pixel static, picked from a small palette subset — CRT
 *  static, worn metal, terrain speckle. Same seed always renders identically. */
export function createNoiseTexture(
  colors: number[],
  { size = 32, seed = 1, repeat = [1, 1] }: NoiseOptions = {},
): THREE.CanvasTexture {
  const ctx = createContext(size);
  const palette = colors.map((hex) => quantizeToPalette(hexToRgb(hex)));
  const random = createSeededRandom(seed);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const pick = palette[Math.floor(random() * palette.length)];
      setPixel(ctx, x, y, pick);
    }
  }
  return toTexture(ctx, repeat);
}

export interface GridOptions {
  size?: number;
  cell?: number;
  lineWidth?: number;
  repeat?: [number, number];
}

/** VGA-style graph-paper grid — the corridor/floor-panel texture of every
 *  Descent-era flight sim. */
export function createGridTexture(
  background: number,
  line: number,
  { size = 32, cell = 8, lineWidth = 1, repeat = [1, 1] }: GridOptions = {},
): THREE.CanvasTexture {
  const ctx = createContext(size);
  const bg = quantizeToPalette(hexToRgb(background));
  const fg = quantizeToPalette(hexToRgb(line));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const onLine = x % cell < lineWidth || y % cell < lineWidth;
      setPixel(ctx, x, y, onLine ? fg : bg);
    }
  }
  return toTexture(ctx, repeat);
}
