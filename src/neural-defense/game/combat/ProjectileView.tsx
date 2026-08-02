import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EnemyBase } from '../entities/enemies';
import { createLowPolySphere, createSpike } from '../rendering/GeometryFactory';
import { createUnlitMaterial } from '../rendering/MaterialFactory';
import { rgbToHex, VGA_PALETTE } from '../rendering/textures/palette';
import { PROJECTILE_FLIGHT_SECONDS } from './types';

const PROJECTILE_COLOR = rgbToHex(VGA_PALETTE[11]); // mint — "the core's own energy"
const CONTROL_HEIGHT = 1.1;
const CONTROL_SIDE = 0.7;

const bodyGeometry = createLowPolySphere(0.13, 0);
const trailGeometry = (() => {
  const geo = createSpike(0.06, 0.45, 4);
  geo.rotateX(Math.PI / 2); // apex -> local +Z (trailing behind; forward is -Z, see lookAt below)
  return geo;
})();
const bodyMaterial = createUnlitMaterial(PROJECTILE_COLOR);
const trailMaterial = createUnlitMaterial(PROJECTILE_COLOR, { transparent: true, opacity: 0.5 });

export interface ProjectileViewProps {
  origin: THREE.Vector3;
  target: EnemyBase;
  onImpact: (position: THREE.Vector3) => void;
}

/** A 3D energy bolt flying a quadratic-bezier path from `origin` to the
 *  target's LIVE position, recomputed every frame — since the curve's
 *  endpoint (P2) is always the target's current position and B(1) === P2 by
 *  construction, the shot always converges exactly on the target at t=1
 *  regardless of how it moves in between. That's the "always hits" homing
 *  behavior, not a physics/collision system. If the target dies mid-flight
 *  (and the Milestone 5 demo loop respawns it elsewhere), the projectile
 *  freezes its aim at the last known alive position instead of teleport-
 *  following the respawn. */
export function ProjectileView({ origin, target, onImpact }: ProjectileViewProps) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const impactedRef = useRef(false);
  const seedRef = useRef(Math.random() * Math.PI * 2);
  const lastAlivePosition = useRef(target.position.clone());
  const point = useMemo(() => new THREE.Vector3(), []);
  const mid = useMemo(() => new THREE.Vector3(), []);
  const perp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_state, delta) => {
    if (impactedRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta / PROJECTILE_FLIGHT_SECONDS);
    const t = progressRef.current;

    if (target.alive) lastAlivePosition.current.copy(target.position);
    const p2 = lastAlivePosition.current;

    mid.copy(origin).lerp(p2, 0.5);
    perp.set(-(p2.z - origin.z), 0, p2.x - origin.x).normalize();
    mid.addScaledVector(perp, Math.sin(seedRef.current) * CONTROL_SIDE);
    mid.y += CONTROL_HEIGHT;

    const oneMinusT = 1 - t;
    point
      .set(0, 0, 0)
      .addScaledVector(origin, oneMinusT * oneMinusT)
      .addScaledVector(mid, 2 * oneMinusT * t)
      .addScaledVector(p2, t * t);

    const group = groupRef.current;
    if (group) {
      group.position.copy(point);
      group.lookAt(p2);
    }

    if (t >= 1) {
      impactedRef.current = true;
      onImpact(point.clone());
    }
  });

  return (
    <group ref={groupRef} position={origin}>
      <mesh geometry={bodyGeometry} material={bodyMaterial} />
      <mesh geometry={trailGeometry} material={trailMaterial} position={[0, 0, 0.28]} />
    </group>
  );
}
