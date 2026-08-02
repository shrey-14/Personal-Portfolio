export interface AICoreProps {
  position?: [number, number, number];
  scale?: number;
  /** 0..1 health fraction. At or below `criticalThreshold`, the core switches
   *  into a continuous red alarm pulse. @default 1 */
  health?: number;
  /** @default 0.3 */
  criticalThreshold?: number;
}

/** Imperative handle for one-shot reactions — gameplay code calls these
 *  directly on a ref rather than threading transient event props through. */
export interface AICoreHandle {
  playDamage: () => void;
  playVictory: () => void;
}

export type AICoreEffect = { type: 'damage' | 'victory'; startedAt: number } | null;
