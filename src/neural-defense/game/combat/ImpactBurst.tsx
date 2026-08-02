import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type * as THREE from 'three';
import { createLowPolySphere } from '../rendering/GeometryFactory';
import { createUnlitMaterial } from '../rendering/MaterialFactory';
import { rgbToHex, VGA_PALETTE } from '../rendering/textures/palette';

const BURST_COLOR = rgbToHex(VGA_PALETTE[11]); // mint — matches the projectile's own energy color
const burstGeometry = createLowPolySphere(1, 0);

export interface ImpactBurstProps {
  position: THREE.Vector3;
  onDone: () => void;
  /** @default 0.28 */
  duration?: number;
  /** @default 1 — muzzle flashes pass a smaller value than hit impacts. */
  maxScale?: number;
}

/** A quick expanding, fading unlit flash — no bloom, just scale + opacity.
 *  Reused for both the muzzle flash (on fire) and the hit impact (on
 *  arrival), since both are "a burst of energy at a point in space," just at
 *  different sizes/durations. Self-removes via onDone once its animation
 *  finishes; the parent owns the list this instance came from. */
export function ImpactBurst({ position, onDone, duration = 0.28, maxScale = 1 }: ImpactBurstProps) {
  const material = useMemo(
    () => createUnlitMaterial(BURST_COLOR, { transparent: true, opacity: 1 }),
    [],
  );
  const meshRef = useRef<Mesh>(null);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((_state, delta) => {
    if (doneRef.current) return;
    elapsedRef.current += delta;
    const t = Math.min(1, elapsedRef.current / duration);
    const scale = (0.15 + t * 0.9) * maxScale;
    if (meshRef.current) meshRef.current.scale.setScalar(scale);
    material.opacity = 1 - t;
    if (t >= 1) {
      doneRef.current = true;
      onDone();
    }
  });

  return <mesh ref={meshRef} geometry={burstGeometry} material={material} position={position} />;
}
