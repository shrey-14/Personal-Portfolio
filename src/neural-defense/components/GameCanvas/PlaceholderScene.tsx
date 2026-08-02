import { useMemo, type Ref } from 'react';
import { AICore } from '../../game/entities/aiCore';
import type { AICoreHandle } from '../../game/entities/aiCore';
import { createBeacon, createFloorPanel } from '../../game/rendering/ModelFactory';

export interface PlaceholderSceneProps {
  aiCoreRef?: Ref<AICoreHandle>;
  aiCoreHealth?: number;
}

/** Non-gameplay showcase scene: a floor built from a generated VGA grid
 *  texture, two beacon props, and the central AICore — all flat-shaded, all
 *  built through GeometryFactory/MaterialFactory/ModelFactory/
 *  RetroTextureGenerator, nothing loaded from disk. Real scene content
 *  (turrets, enemies, waves) replaces this in a later milestone. */
export function PlaceholderScene({ aiCoreRef, aiCoreHealth = 1 }: PlaceholderSceneProps) {
  const floor = useMemo(() => createFloorPanel({ width: 24, depth: 24 }), []);
  const beaconA = useMemo(() => createBeacon({ height: 2.4 }), []);
  const beaconB = useMemo(() => createBeacon({ height: 1.8, color: 0x55ffff }), []);

  return (
    <>
      <fog attach="fog" args={['#040608', 6, 22]} />
      <ambientLight intensity={0.5} color="#3a4a52" />
      <directionalLight position={[4, 6, 3]} intensity={1.1} color="#ffb454" />

      <primitive object={floor} />
      <AICore ref={aiCoreRef} position={[0, 1.2, 0]} health={aiCoreHealth} />
      <primitive object={beaconA} position={[-3.2, 0, -2]} />
      <primitive object={beaconB} position={[3.2, 0, -2]} />
    </>
  );
}
