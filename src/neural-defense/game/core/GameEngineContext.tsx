import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';
import { GameEngine } from './GameEngine';
import type { GameState } from './GameState';

const GameEngineReactContext = createContext<GameEngine | null>(null);

/** Owns the GameEngine instance for one mounted <NeuralDefenseGame> tree.
 *  The engine is created once (survives StrictMode's double-invoke via the
 *  ref guard) and started/disposed alongside this provider's mount lifecycle. */
export function GameEngineProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) engineRef.current = new GameEngine();
  const engine = engineRef.current;

  useEffect(() => {
    engine.start();
    return () => engine.dispose();
  }, [engine]);

  return (
    <GameEngineReactContext.Provider value={engine}>
      {children}
    </GameEngineReactContext.Provider>
  );
}

export function useGameEngine(): GameEngine {
  const engine = useContext(GameEngineReactContext);
  if (!engine) throw new Error('useGameEngine() must be used inside <GameEngineProvider>');
  return engine;
}

export function useGameState(): GameState {
  const engine = useGameEngine();
  return useSyncExternalStore(
    (onStoreChange) => engine.onStateChange(onStoreChange),
    () => engine.getState(),
  );
}
