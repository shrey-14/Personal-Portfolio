import type { ReactNode } from 'react';
import type { GameSettings } from '../storage';
import type { GameStats } from '../types';

function Dialog({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="pf-overlay">
      <div className="pf-dialog" style={wide ? { width: 'min(480px, 100%)' } : undefined}>
        <div className="pf-dialog-title">{title}</div>
        <div className="pf-dialog-body">{children}</div>
      </div>
    </div>
  );
}

export function MainMenu({
  highScore, hasSave, onNewGame, onContinue, onSettings, onCredits, onQuit,
}: {
  highScore: number; hasSave: boolean;
  onNewGame: () => void; onContinue: () => void; onSettings: () => void; onCredits: () => void; onQuit: () => void;
}) {
  return (
    <Dialog title="PIXEL FACTORY 95.EXE">
      <div className="pf-logo">PIXEL<br />FACTORY 95</div>
      <div className="pf-tagline">Route every worker home before the system overloads.</div>
      <div className="pf-menu-list">
        {hasSave && <button className="pf-btn pf-btn-primary" onClick={onContinue}>▶ Continue</button>}
        <button className="pf-btn" onClick={onNewGame}>🖴 New Game</button>
        <button className="pf-btn" disabled>🏆 Best Score: {highScore}</button>
        <button className="pf-btn" onClick={onSettings}>⚙ Settings</button>
        <button className="pf-btn" onClick={onCredits}>ℹ Credits</button>
        <button className="pf-btn" onClick={onQuit}>⏻ Quit</button>
      </div>
      <div className="pf-hint">
        Drag from one module to another to build a conveyor belt.<br />
        Keyboard/touch: use the Route Builder panel once a game starts.
      </div>
    </Dialog>
  );
}

export function PauseMenu({
  onResume, onRestart, onSettings, onQuit,
}: { onResume: () => void; onRestart: () => void; onSettings: () => void; onQuit: () => void }) {
  return (
    <Dialog title="PAUSED">
      <div className="pf-menu-list">
        <button className="pf-btn pf-btn-primary" onClick={onResume}>▶ Resume</button>
        <button className="pf-btn" onClick={onRestart}>↻ Restart</button>
        <button className="pf-btn" onClick={onSettings}>⚙ Settings</button>
        <button className="pf-btn" onClick={onQuit}>■ Quit to Menu</button>
      </div>
    </Dialog>
  );
}

export function GameOverDialog({
  stats, highScore, isNewBest, onRetry, onQuit,
}: { stats: GameStats; highScore: number; isNewBest: boolean; onRetry: () => void; onQuit: () => void }) {
  const resolved = stats.correct + stats.wrong + stats.missed;
  const efficiency = resolved ? Math.round((stats.correct / resolved) * 100) : 0;
  return (
    <Dialog title="SYSTEM OVERLOAD">
      <div className="pf-logo" style={{ fontSize: 15, color: '#b00020', textShadow: '2px 2px 0 #000' }}>GAME OVER</div>
      {isNewBest && <div className="pf-newbest">★ NEW BEST SCORE ★</div>}
      <div className="pf-stat-grid">
        <span>Score</span><b>{stats.score}</b>
        <span>Best Score</span><b>{highScore}</b>
        <span>Correct</span><b>{stats.correct}</b>
        <span>Wrong</span><b>{stats.wrong}</b>
        <span>Missed</span><b>{stats.missed}</b>
        <span>Best Combo</span><b>x{stats.bestCombo}</b>
        <span>Efficiency</span><b>{efficiency}%</b>
        <span>Survived</span><b>{Math.floor(stats.elapsed)}s</b>
      </div>
      <div className="pf-dialog-actions">
        <button className="pf-btn" onClick={onQuit}>Main Menu</button>
        <button className="pf-btn pf-btn-primary" onClick={onRetry}>Retry</button>
      </div>
    </Dialog>
  );
}

export function SettingsDialog({
  settings, onChange, onClose,
}: { settings: GameSettings; onChange: (patch: Partial<GameSettings>) => void; onClose: () => void }) {
  return (
    <Dialog title="SETTINGS">
      <Row label="Sound Effects" on={settings.sound} onToggle={() => onChange({ sound: !settings.sound })} />
      <Row label="Background Music" on={settings.music} onToggle={() => onChange({ music: !settings.music })} />
      <Row label="Reduced Motion" on={settings.reducedMotion} onToggle={() => onChange({ reducedMotion: !settings.reducedMotion })} />
      <div className="pf-dialog-actions">
        <button className="pf-btn pf-btn-primary" onClick={onClose}>OK</button>
      </div>
    </Dialog>
  );
}

function Row({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="pf-settings-row">
      <span>{label}</span>
      <button className="pf-switch" data-on={on} onClick={onToggle} role="switch" aria-checked={on} aria-label={label}>
        <i />
      </button>
    </div>
  );
}

export function CreditsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="CREDITS" wide>
      <p style={{ fontSize: 12, lineHeight: 1.6 }}>
        <b>PIXEL FACTORY 95</b><br />
        A relaxing hardware-routing game built into SHREY/OS.<br /><br />
        Designed &amp; built by Shrey Patel — AI/ML engineer, retro-computing enthusiast.<br />
        Every module you master unlocks a real piece of this portfolio.<br /><br />
        Built with React, TypeScript, Three.js and React Three Fiber. No game engine,
        no sample packs — every sound is synthesised live in the browser.
      </p>
      <div className="pf-dialog-actions">
        <button className="pf-btn pf-btn-primary" onClick={onClose}>Close</button>
      </div>
    </Dialog>
  );
}
