/** Contract for a fixed-timestep gameplay system (movement, AI, collision, …).
 *  SystemManager runs registered systems in registration order every tick. */
export interface GameSystem {
  readonly name: string;
  update(fixedDeltaSeconds: number): void;
}
