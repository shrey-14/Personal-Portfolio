import * as THREE from 'three';
import { EnemyBase, type EnemyKind, type EnemyStats } from './EnemyBase';

export const RUSHER_STATS: EnemyStats = { maxHealth: 12, speed: 2.4, reward: 8 };

const tmpToCore = new THREE.Vector3();

/** Fast, direct beeline to the core — no wander, no hesitation, flat
 *  altitude. The opposite of Drifter's movement in every respect. */
export class Rusher extends EnemyBase {
  readonly kind: EnemyKind = 'rusher';

  constructor(id: string, spawnPosition: THREE.Vector3) {
    super(id, RUSHER_STATS, spawnPosition);
  }

  updateMovement(corePosition: THREE.Vector3, _elapsed: number, dt: number): void {
    tmpToCore.subVectors(corePosition, this.position);
    tmpToCore.y = 0;
    const distance = tmpToCore.length();
    if (distance < 1e-4) return;
    tmpToCore.normalize();
    this.position.addScaledVector(tmpToCore, this.stats.speed * dt);
    this.position.y = 0.35;
  }
}
