export type FixedUpdateCallback = (fixedDeltaSeconds: number) => void;
export type RenderTickCallback = (interpolationAlpha: number, deltaSeconds: number) => void;

/** Framework-agnostic fixed-timestep loop. Driven externally (by an R3F
 *  useFrame callback, in this codebase) via `tick(deltaSeconds)` on every
 *  render frame; internally it runs gameplay updates at a constant rate so
 *  simulation stays deterministic regardless of display refresh rate. */
export class GameLoop {
  private readonly fixedTimestep: number;
  private accumulator = 0;
  private running = false;
  private readonly updateCallbacks = new Set<FixedUpdateCallback>();
  private readonly renderCallbacks = new Set<RenderTickCallback>();

  constructor(fixedHz: number = 60) {
    this.fixedTimestep = 1 / fixedHz;
  }

  start(): void {
    this.running = true;
    this.accumulator = 0;
  }

  stop(): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  onUpdate(callback: FixedUpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  onRender(callback: RenderTickCallback): () => void {
    this.renderCallbacks.add(callback);
    return () => this.renderCallbacks.delete(callback);
  }

  /** Advance the loop by one real-world frame. Caller supplies the frame's
   *  delta time (seconds); a tab-away / debugger-pause spike is clamped so the
   *  accumulator can't try to "catch up" in a runaway update burst. */
  tick(deltaSeconds: number): void {
    if (!this.running) return;

    const clamped = Math.min(deltaSeconds, 0.25);
    this.accumulator += clamped;

    while (this.accumulator >= this.fixedTimestep) {
      this.updateCallbacks.forEach((callback) => callback(this.fixedTimestep));
      this.accumulator -= this.fixedTimestep;
    }

    const alpha = this.accumulator / this.fixedTimestep;
    this.renderCallbacks.forEach((callback) => callback(alpha, clamped));
  }
}
