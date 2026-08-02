import * as THREE from 'three';
import { createSeededRandom } from '../core/random';

/** Every shape here is built from Three.js primitives or per-vertex math —
 *  nothing is loaded from disk. Low polygon counts and small radial-segment
 *  values are deliberate: this is the geometric vocabulary of the genre. */

export function createBox(width = 1, height = 1, depth = 1): THREE.BoxGeometry {
  return new THREE.BoxGeometry(width, height, depth);
}

/** Low-poly sphere. detail 0 = a 20-face icosahedron (the classic "low-poly
 *  ball"); higher detail smooths it while staying well short of round. */
export function createLowPolySphere(radius = 1, detail: 0 | 1 | 2 = 0): THREE.IcosahedronGeometry {
  return new THREE.IcosahedronGeometry(radius, detail);
}

/** Faceted prism — a hexagonal cylinder by default, not a smooth round one. */
export function createPrism(radius = 1, height = 1, sides = 6): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(radius, radius, height, sides, 1, false);
}

export function createSpike(radius = 1, height = 1, sides = 6): THREE.ConeGeometry {
  return new THREE.ConeGeometry(radius, height, sides, 1, false);
}

export function createGroundPlane(width = 10, depth = 10, segments = 1): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(width, depth, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

/** Flat open ring, facing +Z by default — a HUD-style reticle/targeting
 *  bracket, not a filled disc. */
export function createRing(innerRadius = 0.5, outerRadius = 0.7, segments = 16): THREE.RingGeometry {
  return new THREE.RingGeometry(innerRadius, outerRadius, segments);
}

export interface CrystalOptions {
  radius?: number;
  /** Icosahedron subdivision level — kept low (0-1) to stay low-poly. */
  detail?: 0 | 1;
  /** Fraction of radius applied as random per-vertex displacement. */
  jitter?: number;
  seed?: number;
}

/** Displaces an icosahedron's vertices outward/inward along their own
 *  direction from center, so every seed produces a unique faceted rock/crystal
 *  silhouette. Duplicate vertices at shared face corners are displaced by the
 *  same amount (keyed by position, not index) so the mesh stays watertight
 *  instead of cracking open along its seams. */
export function createCrystal({
  radius = 1,
  detail = 1,
  jitter = 0.25,
  seed = 1,
}: CrystalOptions = {}): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const position = geometry.attributes.position;
  const random = createSeededRandom(seed);
  const offsetByVertexKey = new Map<string, number>();
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const key = `${vertex.x.toFixed(3)},${vertex.y.toFixed(3)},${vertex.z.toFixed(3)}`;
    let offset = offsetByVertexKey.get(key);
    if (offset === undefined) {
      offset = 1 + (random() * 2 - 1) * jitter;
      offsetByVertexKey.set(key, offset);
    }
    vertex.multiplyScalar(offset);
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}
