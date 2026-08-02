import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { createBeacon, createCrystalFormation, createFloorPanel } from '../../game/rendering/ModelFactory';

/** Non-gameplay showcase scene. Its job is to prove the Milestone 2 rendering
 *  utilities out loud: a floor built from a generated VGA grid texture, a
 *  procedurally displaced low-poly crystal, and two beacon props — all flat-
 *  shaded, all built through GeometryFactory/MaterialFactory/ModelFactory/
 *  RetroTextureGenerator, nothing loaded from disk. Real scene content
 *  replaces this in a later milestone. */
export function PlaceholderScene() {
  const crystalRef = useRef<Group>(null);

  const floor = useMemo(() => createFloorPanel({ width: 24, depth: 24 }), []);
  const crystal = useMemo(() => createCrystalFormation({ radius: 1.3, seed: 7 }), []);
  const beaconA = useMemo(() => createBeacon({ height: 2.4 }), []);
  const beaconB = useMemo(() => createBeacon({ height: 1.8, color: 0x55ffff }), []);

  useFrame((_state, delta) => {
    const group = crystalRef.current;
    if (!group) return;
    group.rotation.y += delta * 0.35;
    group.rotation.x += delta * 0.12;
  });

  return (
    <>
      <fog attach="fog" args={['#040608', 6, 22]} />
      <ambientLight intensity={0.5} color="#3a4a52" />
      <directionalLight position={[4, 6, 3]} intensity={1.1} color="#ffb454" />

      <primitive object={floor} />
      <group ref={crystalRef} position={[0, 1.4, 0]}>
        <primitive object={crystal} />
      </group>
      <primitive object={beaconA} position={[-3.2, 0, -2]} />
      <primitive object={beaconB} position={[3.2, 0, -2]} />
    </>
  );
}
