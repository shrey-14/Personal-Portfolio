import { useSyncExternalStore } from 'react';
import { useGameEngine } from '../core/GameEngineContext';
import type { CombatState } from './CombatStore';

export function useCombatState(): CombatState {
  const engine = useGameEngine();
  return useSyncExternalStore(
    (onStoreChange) => engine.combat.subscribe(onStoreChange),
    () => engine.combat.getState(),
  );
}
