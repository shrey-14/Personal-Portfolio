import * as THREE from 'three';
import { EnemyBase, type EnemyKind, type EnemyStats } from './EnemyBase';

export const ARMORED_STATS: EnemyStats = { maxHealth: 60, speed: 0.35, reward: 15 };

const tmpToCore = new THREE.Vector3();

/** Slow, unwavering, heavy advance — the same straight-line path a Rusher
 *  takes, just relentless and slow instead of fast, with a rhythmic stomp bob
 *  instead of a level glide. No lateral wander at all. */
export class Armored extends EnemyBase {
  readonly kind: EnemyKind = 'armored';

  constructor(id: string, spawnPosition: THREE.Vector3) {
    super(id, ARMORED_STATS, spawnPosition);
  }

  updateMovement(corePosition: THREE.Vector3, elapsed: number, dt: number): void {
    tmpToCore.subVectors(corePosition, this.position);
    tmpToCore.y = 0;
    const distance = tmpToCore.length();
    if (distance < 1e-4) return;
    tmpToCore.normalize();
    this.position.addScaledVector(tmpToCore, this.stats.speed * dt);
    this.position.y = 0.3 + Math.abs(Math.sin(elapsed * 2.2)) * 0.05;
  }
}
