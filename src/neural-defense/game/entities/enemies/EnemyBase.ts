import * as THREE from 'three';
import type { Entity } from '../Entity';

export interface EnemyStats {
  readonly maxHealth: number;
  /** World units per second along its own movement pattern. */
  readonly speed: number;
  /** Granted on kill — not wired to any economy system yet, just carried here
   *  as a stat until one exists. */
  readonly reward: number;
}

export type EnemyKind = 'drifter' | 'rusher' | 'armored';

/** Framework-agnostic simulation state for one enemy — no Three.js scene
 *  graph objects, no React. A future wave/spawn system owns creating and
 *  destroying these through EntityManager; the visual layer (EnemyView) just
 *  renders whatever's currently alive each frame. Every concrete enemy type
 *  supplies its own updateMovement — that, plus its own geometry/material, is
 *  what makes each kind recognizable without relying on color alone. */
export abstract class EnemyBase implements Entity {
  abstract readonly kind: EnemyKind;
  readonly id: string;
  readonly stats: EnemyStats;
  readonly position: THREE.Vector3;
  health: number;
  alive = true;

  protected constructor(id: string, stats: EnemyStats, spawnPosition: THREE.Vector3) {
    this.id = id;
    this.stats = stats;
    this.health = stats.maxHealth;
    this.position = spawnPosition.clone();
  }

  get healthFraction(): number {
    return THREE.MathUtils.clamp(this.health / this.stats.maxHealth, 0, 1);
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) this.alive = false;
  }

  hasReachedCore(corePosition: THREE.Vector3, arrivalRadius = 0.6): boolean {
    return this.position.distanceTo(corePosition) <= arrivalRadius;
  }

  /** Mutates `this.position` toward (or around) `corePosition`. Unique per
   *  subclass — this is the actual "unique movement" requirement, not just a
   *  speed multiplier on one shared formula. */
  abstract updateMovement(corePosition: THREE.Vector3, elapsed: number, dt: number): void;
}
