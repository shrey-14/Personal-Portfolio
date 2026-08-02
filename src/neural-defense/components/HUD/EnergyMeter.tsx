import { useCombatState } from '../../game/combat';
import './EnergyMeter.css';

/** Segmented arcade-style energy bar — each block is one shot; firing spends
 *  one, and blocks refill individually as GameEngine.combat regenerates. */
export function EnergyMeter() {
  const { energy, maxEnergy, lockedTargetId } = useCombatState();
  const segments = Array.from({ length: maxEnergy }, (_, index) => Math.max(0, Math.min(1, energy - index)));

  return (
    <div className="nd-energy">
      <span className={`nd-energy-label${lockedTargetId ? ' nd-energy-locked' : ''}`}>
        {lockedTargetId ? 'TARGET LOCKED' : 'SCANNING'}
      </span>
      <div className="nd-energy-segments">
        {segments.map((fill, index) => (
          <div className="nd-energy-seg" key={index}>
            <div className="nd-energy-seg-fill" style={{ width: `${fill * 100}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
