import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EnemyBase, EnemyKind } from './EnemyBase';
import { randomRingSpawnPoint } from './spawn';
import { Tether } from './Tether';
import { ArmoredMesh } from './views/ArmoredMesh';
import { DrifterMesh } from './views/DrifterMesh';
import { RusherMesh } from './views/RusherMesh';

export interface EnemyViewProps {
  enemy: EnemyBase;
  corePosition: THREE.Vector3;
}

const TETHER_COLOR_BY_KIND: Record<EnemyKind, THREE.ColorRepresentation> = {
  drifter: 0x55ff55,
  rusher: 0xff5555,
  armored: 0x5555ff,
};

/** Renders whichever enemy kind this instance is, ticks its unique movement
 *  every frame, orients it to face the core, and keeps its tether up to
 *  date. Simulation (EnemyBase.updateMovement) and presentation both happen
 *  here for now; a future wave/spawn system can pull the simulation step
 *  into its own SystemManager entry without changing how enemies are drawn.
 *
 *  Reaching the core (or dying) respawns the instance on a ring around the
 *  scene so the showcase loops — demo scaffolding only. Real arrival/death
 *  handling (core damage, kill rewards, wave state) is a later milestone. */
export function EnemyView({ enemy, corePosition }: EnemyViewProps) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useMemo(() => performance.now() / 1000, []);

  useFrame((_state, delta) => {
    if (!enemy.alive) {
      enemy.health = enemy.stats.maxHealth;
      enemy.alive = true;
      enemy.position.copy(randomRingSpawnPoint());
    }

    const elapsed = performance.now() / 1000 - startTime;
    enemy.updateMovement(corePosition, elapsed, delta);

    if (enemy.hasReachedCore(corePosition)) {
      enemy.position.copy(randomRingSpawnPoint());
    }

    const group = groupRef.current;
    if (!group) return;
    group.position.copy(enemy.position);
    group.lookAt(corePosition);
  });

  return (
    <group ref={groupRef}>
      {enemy.kind === 'drifter' && <DrifterMesh />}
      {enemy.kind === 'rusher' && <RusherMesh />}
      {enemy.kind === 'armored' && <ArmoredMesh enemy={enemy} />}
      <Tether enemy={enemy} corePosition={corePosition} color={TETHER_COLOR_BY_KIND[enemy.kind]} />
    </group>
  );
}
