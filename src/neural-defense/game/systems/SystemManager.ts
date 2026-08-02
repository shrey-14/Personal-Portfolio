import type { GameSystem } from './GameSystem';

/** Ordered registry of gameplay systems, driven by GameLoop's fixed update.
 *  No systems are registered yet — this milestone only wires the pipeline. */
export class SystemManager {
  private systems: GameSystem[] = [];

  register(system: GameSystem): void {
    this.systems.push(system);
  }

  unregister(name: string): void {
    this.systems = this.systems.filter((system) => system.name !== name);
  }

  updateAll(fixedDeltaSeconds: number): void {
    for (const system of this.systems) system.update(fixedDeltaSeconds);
  }

  clear(): void {
    this.systems = [];
  }
}
