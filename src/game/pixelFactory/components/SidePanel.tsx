import { useState } from 'react';
import { MODULES, EVENT_MAP, POWERUP_MAP } from '../constants';
import type { EngineSnapshot } from '../engine';
import type { ModuleId } from '../types';

export default function SidePanel({
  snapshot, onAddBelt, onRemoveBelt, onCollectPowerup,
}: {
  snapshot: EngineSnapshot;
  onAddBelt: (from: ModuleId, to: ModuleId) => void;
  onRemoveBelt: (id: string) => void;
  onCollectPowerup: (id: number) => void;
}) {
  const unlocked = MODULES.filter(m => snapshot.moduleStates[m.id] !== 'locked');
  const [from, setFrom] = useState<ModuleId>('floppy');
  const [to, setTo] = useState<ModuleId>(unlocked[1]?.id || 'cpu');

  const now = snapshot.stats.elapsed;

  return (
    <div className="pf-side">
      <div className="pf-route-panel">
        <h4>ROUTE BUILDER</h4>
        <div className="pf-route-select">
          <select aria-label="From module" value={from} onChange={e => setFrom(e.target.value as ModuleId)}>
            {unlocked.map(m => <option key={m.id} value={m.id}>{m.short}</option>)}
          </select>
          <span aria-hidden="true">→</span>
          <select aria-label="To module" value={to} onChange={e => setTo(e.target.value as ModuleId)}>
            {unlocked.map(m => <option key={m.id} value={m.id}>{m.short}</option>)}
          </select>
        </div>
        <button className="pf-btn" style={{ width: '100%', fontSize: 10, padding: '3px 6px' }}
          onClick={() => onAddBelt(from, to)} disabled={from === to}>
          + Build Belt
        </button>
        <ul className="pf-belt-list" aria-label="Active belts">
          {snapshot.belts.map(b => (
            <li key={b.id}>
              <span>{b.from} → {b.to}</span>
              <button onClick={() => onRemoveBelt(b.id)} aria-label={`Remove belt ${b.from} to ${b.to}`}>✕</button>
            </li>
          ))}
          {!snapshot.belts.length && <li style={{ color: '#666' }}>No belts yet — drag on the floor or use the builder above.</li>}
        </ul>
      </div>

      {(snapshot.activeEvents.length > 0 || snapshot.activePowerups.length > 0 || snapshot.floatingPowerups.length > 0) && (
        <div className="pf-events-panel">
          <h4>ACTIVE EFFECTS</h4>
          {snapshot.activeEvents.map(ev => {
            const def = EVENT_MAP[ev.defId];
            const pct = Math.max(0, Math.min(100, ((ev.until - now) / def.duration) * 100));
            return (
              <div className="pf-active-effect" key={ev.id}>
                <span>⚠ {def.name}</span>
                <div className="pf-bar"><i style={{ width: `${pct}%`, background: '#b00020' }} /></div>
              </div>
            );
          })}
          {snapshot.activePowerups.map(p => {
            const def = POWERUP_MAP[p.defId];
            const pct = Math.max(0, Math.min(100, ((p.until - now) / def.duration) * 100));
            return (
              <div className="pf-active-effect" key={p.id}>
                <span>★ {def.name}</span>
                <div className="pf-bar"><i style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
          {snapshot.floatingPowerups.map(fp => (
            <div className="pf-active-effect" key={fp.id}>
              <span>◆ {POWERUP_MAP[fp.powerupId].name} ready</span>
              <button className="pf-btn" style={{ fontSize: 9, padding: '1px 6px' }} onClick={() => onCollectPowerup(fp.id)}>Grab</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
