/** Minimal contract every game entity satisfies. Gameplay milestones extend
 *  this rather than replace it, so EntityManager keeps working unchanged. */
export interface Entity {
  readonly id: string;
}
