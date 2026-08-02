import type { Entity } from './Entity';

/** Simple id-keyed entity registry. No gameplay entities exist yet — this is
 *  the foundation later systems (spawning, collision, etc.) will register into. */
export class EntityManager<T extends Entity = Entity> {
  private readonly entities = new Map<string, T>();

  add(entity: T): void {
    this.entities.set(entity.id, entity);
  }

  remove(id: string): boolean {
    return this.entities.delete(id);
  }

  get(id: string): T | undefined {
    return this.entities.get(id);
  }

  has(id: string): boolean {
    return this.entities.has(id);
  }

  all(): T[] {
    return Array.from(this.entities.values());
  }

  clear(): void {
    this.entities.clear();
  }

  get size(): number {
    return this.entities.size;
  }
}
