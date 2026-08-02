import { useMemo, type Ref } from 'react';
import * as THREE from 'three';
import { CombatController } from '../../game/combat';
import { AICore } from '../../game/entities/aiCore';
import type { AICoreHandle } from '../../game/entities/aiCore';
import { createDefaultEnemies, EnemyView } from '../../game/entities/enemies';
import type { EnemyBase } from '../../game/entities/enemies';
import { createBeacon, createFloorPanel } from '../../game/rendering/ModelFactory';

export interface PlaceholderSceneProps {
  aiCoreRef?: Ref<AICoreHandle>;
  aiCoreHealth?: number;
  enemies?: EnemyBase[];
}

const CORE_POSITION = new THREE.Vector3(0, 1.2, 0);

/** Non-gameplay showcase scene: a floor built from a generated VGA grid
 *  texture, two beacon props, the central AICore, and a small cast of
 *  enemies tethered to it — all flat-shaded, all built through
 *  GeometryFactory/MaterialFactory/ModelFactory/RetroTextureGenerator,
 *  nothing loaded from disk. Real wave/spawn logic replaces the enemy
 *  default cast in a later milestone. */
export function PlaceholderScene({ aiCoreRef, aiCoreHealth = 1, enemies }: PlaceholderSceneProps) {
  const floor = useMemo(() => createFloorPanel({ width: 24, depth: 24 }), []);
  const beaconA = useMemo(() => createBeacon({ height: 2.4 }), []);
  const beaconB = useMemo(() => createBeacon({ height: 1.8, color: 0x55ffff }), []);
  const fallbackEnemies = useMemo(() => createDefaultEnemies(), []);
  const activeEnemies = enemies ?? fallbackEnemies;

  return (
    <>
      <fog attach="fog" args={['#040608', 6, 22]} />
      <ambientLight intensity={0.5} color="#3a4a52" />
      <directionalLight position={[4, 6, 3]} intensity={1.1} color="#ffb454" />

      <primitive object={floor} />
      <AICore ref={aiCoreRef} position={[CORE_POSITION.x, CORE_POSITION.y, CORE_POSITION.z]} health={aiCoreHealth} />
      <primitive object={beaconA} position={[-3.2, 0, -2]} />
      <primitive object={beaconB} position={[3.2, 0, -2]} />

      {activeEnemies.map((enemy) => (
        <EnemyView key={enemy.id} enemy={enemy} corePosition={CORE_POSITION} />
      ))}

      <CombatController enemies={activeEnemies} corePosition={CORE_POSITION} />
    </>
  );
}
