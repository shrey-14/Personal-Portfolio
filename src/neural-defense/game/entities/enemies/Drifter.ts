import * as THREE from 'three';
import { EnemyBase, type EnemyKind, type EnemyStats } from './EnemyBase';

export const DRIFTER_STATS: EnemyStats = { maxHealth: 20, speed: 0.5, reward: 5 };

const tmpToCore = new THREE.Vector3();
const tmpLateral = new THREE.Vector3();

/** Slow, wandering approach: drifts toward the core with a lazy sideways sway
 *  perpendicular to its heading, plus a gentle vertical float — never a
 *  straight line, never in a hurry. */
export class Drifter extends EnemyBase {
  readonly kind: EnemyKind = 'drifter';
  private readonly wanderSeed = Math.random() * Math.PI * 2;
  private readonly hoverHeight = 0.45 + Math.random() * 0.2;

  constructor(id: string, spawnPosition: THREE.Vector3) {
    super(id, DRIFTER_STATS, spawnPosition);
  }

  updateMovement(corePosition: THREE.Vector3, elapsed: number, dt: number): void {
    tmpToCore.subVectors(corePosition, this.position);
    tmpToCore.y = 0;
    const distance = tmpToCore.length();
    if (distance < 1e-4) return;
    tmpToCore.normalize();
    tmpLateral.set(-tmpToCore.z, 0, tmpToCore.x);

    const wander = Math.sin(elapsed * 0.8 + this.wanderSeed) * 0.6;
    this.position.addScaledVector(tmpToCore, this.stats.speed * dt);
    this.position.addScaledVector(tmpLateral, wander * dt);
    this.position.y = this.hoverHeight + Math.sin(elapsed * 1.4 + this.wanderSeed) * 0.15;
  }
}
