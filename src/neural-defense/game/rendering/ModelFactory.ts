import * as THREE from 'three';
import { createCrystal, createGroundPlane, createPrism } from './GeometryFactory';
import { createFlatMaterial, createUnlitMaterial } from './MaterialFactory';
import { rgbToHex, VGA_PALETTE } from './textures/palette';
import { createGridTexture } from './textures/RetroTextureGenerator';

/** Composed, named "models" built from GeometryFactory + MaterialFactory +
 *  RetroTextureGenerator — the layer gameplay milestones plug into directly
 *  (add a new createXxx() here per prop/enemy/turret) rather than hand-rolling
 *  geometry+material pairs at every call site. Everything returns a plain
 *  THREE.Object3D, so callers drop it straight into R3F via <primitive>. */

export interface CrystalFormationOptions {
  radius?: number;
  seed?: number;
  color?: THREE.ColorRepresentation;
}

export function createCrystalFormation({
  radius = 1,
  seed = 1,
  color = rgbToHex(VGA_PALETTE[10]),
}: CrystalFormationOptions = {}): THREE.Mesh {
  const geometry = createCrystal({ radius, seed, jitter: 0.3, detail: 1 });
  const material = createFlatMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'crystal-formation';
  return mesh;
}

export interface FloorPanelOptions {
  width?: number;
  depth?: number;
}

export function createFloorPanel({ width = 20, depth = 20 }: FloorPanelOptions = {}): THREE.Mesh {
  const geometry = createGroundPlane(width, depth, 1);
  const texture = createGridTexture(rgbToHex(VGA_PALETTE[0]), rgbToHex(VGA_PALETTE[2]), {
    size: 32,
    cell: 8,
  });
  texture.repeat.set(width / 2, depth / 2);
  const material = createFlatMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'floor-panel';
  return mesh;
}

export interface BeaconOptions {
  height?: number;
  radius?: number;
  color?: THREE.ColorRepresentation;
}

/** A small hexagonal pylon with an unlit "glowing" tip — no real emissive/
 *  bloom, just an unlit material reading brighter than its lit surroundings. */
export function createBeacon({
  height = 2,
  radius = 0.4,
  color = rgbToHex(VGA_PALETTE[13]),
}: BeaconOptions = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'beacon';

  const base = new THREE.Mesh(
    createPrism(radius, height * 0.6, 6),
    createFlatMaterial({ color: rgbToHex(VGA_PALETTE[8]) }),
  );
  base.position.y = height * 0.3;

  const tip = new THREE.Mesh(createPrism(radius * 0.18, height * 0.4, 6), createUnlitMaterial(color));
  tip.position.y = height * 0.6 + height * 0.2;

  group.add(base, tip);
  return group;
}
