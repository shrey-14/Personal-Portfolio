import { MAX_ENERGY } from './types';

export interface CombatState {
  lockedTargetId: string | null;
  hoveredTargetId: string | null;
  energy: number;
  maxEnergy: number;
}

type Listener = (state: CombatState) => void;

/** Framework-agnostic combat resource store, mirroring GameEngine's own
 *  state-listener pattern. CombatController (inside the Canvas, where
 *  targeting/firing happens) and the HTML HUD (outside the Canvas) both
 *  need the same lock/energy state — this is the shared source of truth. */
export class CombatStore {
  private state: CombatState;
  private readonly listeners = new Set<Listener>();

  constructor(maxEnergy = MAX_ENERGY) {
    this.state = { lockedTargetId: null, hoveredTargetId: null, energy: maxEnergy, maxEnergy };
  }

  getState(): CombatState {
    return this.state;
  }

  private set(partial: Partial<CombatState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  setHovered(id: string | null): void {
    if (id !== this.state.hoveredTargetId) this.set({ hoveredTargetId: id });
  }

  setLocked(id: string | null): void {
    if (id !== this.state.lockedTargetId) this.set({ lockedTargetId: id });
  }

  /** Returns true if a shot could actually be fired (had >=1 energy banked). */
  tryConsumeEnergy(): boolean {
    if (this.state.energy < 1) return false;
    this.set({ energy: this.state.energy - 1 });
    return true;
  }

  regenTick(dt: number, regenPerSecond: number): void {
    if (this.state.energy >= this.state.maxEnergy) return;
    this.set({ energy: Math.min(this.state.maxEnergy, this.state.energy + dt * regenPerSecond) });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
