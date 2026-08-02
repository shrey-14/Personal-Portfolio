import { AudioManager } from '../audio/AudioManager';
import { SaveManager } from '../data/SaveManager';
import { FIXED_TIMESTEP_HZ } from '../data/constants';
import { EntityManager } from '../entities/EntityManager';
import { InputManager } from '../input/InputManager';
import { SystemManager } from '../systems/SystemManager';
import { GameLoop } from './GameLoop';
import { GameState } from './GameState';

type StateListener = (state: GameState) => void;

/** Composition root for one Neural Defense session. Framework-agnostic — owns
 *  no React or Three.js objects itself, only the managers gameplay systems and
 *  UI plug into. One instance lives for the lifetime of a mounted
 *  <NeuralDefenseGame>, created and disposed by GameEngineProvider. */
export class GameEngine {
  readonly loop = new GameLoop(FIXED_TIMESTEP_HZ);
  readonly input = new InputManager();
  readonly audio = new AudioManager();
  readonly save = new SaveManager();
  readonly systems = new SystemManager();
  readonly entities = new EntityManager();

  private state: GameState = GameState.Boot;
  private readonly stateListeners = new Set<StateListener>();

  start(): void {
    this.input.attach();
    this.loop.onUpdate((dt) => this.systems.updateAll(dt));
    this.loop.start();
    this.setState(GameState.Menu);
  }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    this.audio.dispose();
    this.systems.clear();
    this.entities.clear();
  }

  getState(): GameState {
    return this.state;
  }

  setState(next: GameState): void {
    if (this.state === next) return;
    this.state = next;
    this.stateListeners.forEach((listener) => listener(next));
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }
}
