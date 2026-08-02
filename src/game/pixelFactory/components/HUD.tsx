import type { GameStats } from '../types';

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function HUD({
  stats, highScore, onPause, onMute, muted,
}: {
  stats: GameStats;
  highScore: number;
  onPause: () => void;
  onMute: () => void;
  muted: boolean;
}) {
  const resolved = stats.correct + stats.wrong + stats.missed;
  const efficiency = resolved ? Math.round((stats.correct / resolved) * 100) : 100;
  const critical = stats.overload >= 75;

  return (
    <div className="pf-hud" role="status" aria-label="Game status">
      <div className="pf-hud-cell"><b>{stats.score}</b><span>SCORE</span></div>
      <div className="pf-hud-cell"><b>{highScore}</b><span>BEST</span></div>
      <div className="pf-hud-cell pf-hud-combo"><b>x{stats.combo}</b><span>COMBO</span></div>
      <div className="pf-hud-cell"><b>{efficiency}%</b><span>EFFICIENCY</span></div>
      <div className="pf-hud-cell"><b>{stats.wave}</b><span>WAVE</span></div>
      <div className="pf-hud-cell"><b>{fmtTime(stats.elapsed)}</b><span>UPTIME</span></div>

      <div className="pf-overload-wrap">
        <div className="pf-overload-label">SYSTEM LOAD {Math.round(stats.overload)}%</div>
        <div className={`pf-overload-bar${critical ? ' pf-critical' : ''}`}>
          <div className="pf-overload-fill" style={{ width: `${stats.overload}%` }} />
        </div>
      </div>

      <div className="pf-hud-spacer" />

      <div className="pf-hud-btns">
        <button className="pf-icon-btn" onClick={onMute} aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Unmute' : 'Mute'}>
          {muted ? '🔇' : '🔊'}
        </button>
        <button className="pf-icon-btn" onClick={onPause} aria-label="Pause game" title="Pause (Esc)">II</button>
      </div>
    </div>
  );
}
