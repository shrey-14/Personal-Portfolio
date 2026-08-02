import { useGameState } from '../../game/core/GameEngineContext';
import { GameState } from '../../game/core/GameState';
import './HUD.css';

/** Placeholder HUD — just enough to prove the state pipeline is live.
 *  Real gameplay readouts (health, wave, score, …) land in a later milestone. */
export function HUD() {
  const state = useGameState();
  if (state !== GameState.Playing) return null;

  return (
    <div className="nd-hud" aria-hidden="true">
      <span>NEURAL DEFENSE</span>
      <span>STATE: {state.toUpperCase()}</span>
    </div>
  );
}
