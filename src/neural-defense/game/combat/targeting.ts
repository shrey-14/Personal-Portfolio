import * as THREE from 'three';
import type { EnemyBase } from '../entities/enemies';

/** Converts a browser PointerEvent to normalized device coordinates relative
 *  to the given element — deliberately element-relative, not window-relative
 *  like game/input/InputManager's pointer tracking, since the game canvas is
 *  letterboxed inside a Win95 window rather than filling the viewport. */
export function pointerEventToNdc(event: PointerEvent, domElement: HTMLElement): THREE.Vector2 {
  const rect = domElement.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  return new THREE.Vector2(x, y);
}

const projected = new THREE.Vector3();

/** Nearest alive enemy to a pointer, in screen space — not a mesh raycast.
 *  Deliberately forgiving (arcade-style "closest to reticle" targeting, not
 *  pixel-perfect hit testing) since these are small, fast, low-poly targets. */
export function nearestEnemyToPointer(
  pointerNdc: THREE.Vector2,
  enemies: EnemyBase[],
  camera: THREE.Camera,
  maxNdcDistance: number,
): EnemyBase | null {
  let best: EnemyBase | null = null;
  let bestDistance = maxNdcDistance;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    projected.copy(enemy.position).project(camera);
    if (projected.z > 1 || projected.z < -1) continue;
    const dx = projected.x - pointerNdc.x;
    const dy = projected.y - pointerNdc.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = enemy;
    }
  }

  return best;
}
