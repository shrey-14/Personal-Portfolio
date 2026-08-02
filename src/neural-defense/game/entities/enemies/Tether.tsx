import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EnemyBase } from './EnemyBase';

export interface TetherProps {
  enemy: EnemyBase;
  corePosition: THREE.Vector3;
  color?: THREE.ColorRepresentation;
}

/** Thin unlit line connecting an enemy to the core it's draining — a flat
 *  vector-line "leash," not a glowing beam. Opacity pulses gently to read as
 *  live energy flow rather than a static wire. Every enemy carries one. */
export function Tether({ enemy, corePosition, color = 0xff5555 }: TetherProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    return geo;
  }, []);
  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5, fog: true }),
    [color],
  );
  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

  useFrame((state) => {
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    positions.setXYZ(0, enemy.position.x, enemy.position.y, enemy.position.z);
    positions.setXYZ(1, corePosition.x, corePosition.y, corePosition.z);
    positions.needsUpdate = true;
    geometry.computeBoundingSphere();

    const t = state.clock.getElapsedTime();
    material.opacity = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(t * 4));
  });

  return <primitive object={line} />;
}
