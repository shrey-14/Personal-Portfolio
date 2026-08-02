import * as THREE from 'three';

/** Every material here is Lambert or Basic — never Standard/Physical. No
 *  roughness, metalness, or envMap is ever set anywhere in this module; that
 *  is what keeps the look flat-shaded and PBR-free. */

export interface FlatMaterialOptions {
  color?: THREE.ColorRepresentation;
  map?: THREE.Texture;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}

/** The workhorse material: lit (so ambient/directional lighting still reads),
 *  flat-shaded, no smooth normal interpolation. */
export function createFlatMaterial({
  color = 0xffffff,
  map,
  transparent = false,
  opacity = 1,
  side = THREE.FrontSide,
}: FlatMaterialOptions = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color,
    // Omit `map` entirely rather than pass `map: undefined` — three.js warns
    // on any constructor parameter whose value is explicitly undefined.
    ...(map ? { map } : {}),
    transparent,
    opacity,
    side,
    flatShading: true,
    fog: true,
  });
}

export interface UnlitMaterialOptions {
  wireframe?: boolean;
  transparent?: boolean;
  opacity?: number;
}

/** Unlit flat color — ignores scene lighting entirely. For HUD-adjacent
 *  props, beacons/emissive-looking accents, or vector-line wireframes. */
export function createUnlitMaterial(
  color: THREE.ColorRepresentation = 0xffffff,
  { wireframe = false, transparent = false, opacity = 1 }: UnlitMaterialOptions = {},
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, wireframe, transparent, opacity, fog: true });
}

/** Per-vertex colored, flat-shaded — the PS1-era "vertex color" look.
 *  Geometry must carry a `color` BufferAttribute. */
export function createVertexColorMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: true });
}
