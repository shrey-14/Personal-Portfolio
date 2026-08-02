import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { EnemyBase } from '../entities/enemies';
import { createRing } from '../rendering/GeometryFactory';
import { createUnlitMaterial } from '../rendering/MaterialFactory';
import { rgbToHex, VGA_PALETTE } from '../rendering/textures/palette';

const outerRingGeometry = createRing(0.32, 0.4, 20);
const innerRingGeometry = createRing(0.14, 0.19, 16);
const hoverMaterial = createUnlitMaterial(rgbToHex(VGA_PALETTE[11]), { transparent: true, opacity: 0.5 });
const lockedMaterial = createUnlitMaterial(rgbToHex(VGA_PALETTE[12]), { transparent: true, opacity: 0.9 });

const Z_AXIS = new THREE.Vector3(0, 0, 1);

export interface ReticleProps {
  target: EnemyBase | null;
  locked: boolean;
}

/** 3D billboard reticle — always faces the camera, sits on the hovered or
 *  locked enemy's live position. Dim single ring while hovering; bright
 *  double ring that spins while locked, for "weapons hot" feedback that
 *  reads instantly and doesn't rely on color alone (enemies already use the
 *  palette for their own identity). */
export function Reticle({ target, locked }: ReticleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const spinRef = useRef(0);
  const spinQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group || !target) return;

    group.position.copy(target.position);

    if (locked) spinRef.current += delta * 2.4;
    spinQuaternion.setFromAxisAngle(Z_AXIS, spinRef.current);
    group.quaternion.copy(camera.quaternion).multiply(spinQuaternion);

    const pulse = locked ? 1 : 0.9 + Math.sin(performance.now() / 260) * 0.06;
    group.scale.setScalar(pulse);
  });

  if (!target) return null;

  return (
    <group ref={groupRef}>
      <mesh geometry={outerRingGeometry} material={locked ? lockedMaterial : hoverMaterial} />
      {locked && <mesh geometry={innerRingGeometry} material={lockedMaterial} />}
    </group>
  );
}
