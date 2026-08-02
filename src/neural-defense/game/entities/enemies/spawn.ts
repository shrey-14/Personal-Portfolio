import * as THREE from 'three';
import { Armored } from './Armored';
import type { EnemyBase } from './EnemyBase';
import { Drifter } from './Drifter';
import { Rusher } from './Rusher';

/** Demo-only helper: a random point on a ring around the origin. Used to
 *  recycle enemies in the showcase scene so it loops instead of stalling
 *  once everything reaches the core. Real spawning (waves, budgets, paths)
 *  is a later milestone's concern — this is scaffolding, not that system. */
export function randomRingSpawnPoint(radius = 7, y = 0): THREE.Vector3 {
  const angle = Math.random() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

/** One of each enemy kind, placed around the core — the default cast for
 *  any <PlaceholderScene> that isn't handed an explicit `enemies` prop. */
export function createDefaultEnemies(): EnemyBase[] {
  return [
    new Drifter('demo-drifter', randomRingSpawnPoint(7)),
    new Rusher('demo-rusher', randomRingSpawnPoint(7)),
    new Armored('demo-armored', randomRingSpawnPoint(7)),
  ];
}
