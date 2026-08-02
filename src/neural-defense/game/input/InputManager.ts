export interface PointerState {
  x: number;
  y: number;
  /** Normalized device coordinates (-1..1), the space Three.js raycasting expects. */
  ndcX: number;
  ndcY: number;
  down: boolean;
}

type KeyListener = (code: string) => void;

/** Low-level keyboard + pointer state, framework-agnostic so it can be shared
 *  by gameplay systems and UI alike. Call attach() once the game mounts and
 *  dispose() when it unmounts — GameEngine owns that lifecycle. */
export class InputManager {
  private readonly keysDown = new Set<string>();
  private readonly keyDownListeners = new Set<KeyListener>();
  private readonly keyUpListeners = new Set<KeyListener>();
  private readonly pointer: PointerState = { x: 0, y: 0, ndcX: 0, ndcY: 0, down: false };
  private attached = false;

  attach(): void {
    if (this.attached || typeof window === 'undefined') return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('blur', this.handleBlur);
    this.attached = true;
  }

  dispose(): void {
    if (!this.attached) return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('blur', this.handleBlur);
    this.keysDown.clear();
    this.attached = false;
  }

  isKeyDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  onKeyDown(listener: KeyListener): () => void {
    this.keyDownListeners.add(listener);
    return () => this.keyDownListeners.delete(listener);
  }

  onKeyUp(listener: KeyListener): () => void {
    this.keyUpListeners.add(listener);
    return () => this.keyUpListeners.delete(listener);
  }

  getPointer(): Readonly<PointerState> {
    return this.pointer;
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.keysDown.has(event.code)) {
      this.keyDownListeners.forEach((listener) => listener(event.code));
    }
    this.keysDown.add(event.code);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keysDown.delete(event.code);
    this.keyUpListeners.forEach((listener) => listener(event.code));
  };

  private handlePointerMove = (event: PointerEvent): void => {
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
    this.pointer.ndcX = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.ndcY = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  private handlePointerDown = (): void => {
    this.pointer.down = true;
  };

  private handlePointerUp = (): void => {
    this.pointer.down = false;
  };

  /** Losing window focus mid-keypress (alt-tab, etc.) would otherwise leave a
   *  "stuck" key down forever since no keyup ever fires. */
  private handleBlur = (): void => {
    this.keysDown.clear();
  };
}
