import { useGameState } from '../../game/core/GameEngineContext';
import { GameState } from '../../game/core/GameState';
import { EnergyMeter } from './EnergyMeter';
import './HUD.css';

/** Top-left debug tag plus the combat energy meter. Real gameplay readouts
 *  (core health, wave, score, …) land in a later milestone. */
export function HUD() {
  const state = useGameState();
  if (state !== GameState.Playing) return null;

  return (
    <>
      <div className="nd-hud">
        <span>NEURAL DEFENSE</span>
        <span>STATE: {state.toUpperCase()}</span>
      </div>
      <EnergyMeter />
    </>
  );
}
