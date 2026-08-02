import { useCallback } from 'react';
import { useGameEngine, useGameState } from '../../game/core/GameEngineContext';
import { GameState } from '../../game/core/GameState';
import './MainMenu.css';

/** The Win95-style splash: title + START. No gameplay yet — START just moves
 *  the engine into GameState.Playing so later milestones have a state to
 *  build the real scene against. */
export function MainMenu() {
  const engine = useGameEngine();
  const state = useGameState();

  const handleStart = useCallback(() => {
    engine.audio.unlock();
    engine.audio.playBeep(880, 0.09, 'square');
    engine.setState(GameState.Playing);
  }, [engine]);

  if (state !== GameState.Menu) return null;

  return (
    <div className="nd-menu">
      <div className="nd-menu-panel">
        <h1 className="nd-menu-title">NEURAL DEFENSE</h1>
        <p className="nd-menu-subtitle">A SHREY/OS PRODUCTION</p>
        <button type="button" className="nd-menu-start" onClick={handleStart}>
          START
        </button>
        <p className="nd-menu-hint">v0.1.0 — foundation build</p>
      </div>
    </div>
  );
}
