import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine, type EngineSnapshot } from './engine';
import { audio } from './audio';
import {
  loadHighScore, saveHighScore, loadSettings, saveSettings, type GameSettings,
} from './storage';
import type { GamePhase, GameStats, ModuleId, UnlockToastState, EventId } from './types';
import { EVENT_MAP, MODULE_MAP } from './constants';

export interface EventBannerState { id: number; text: string; sub: string; }
export interface ModuleUnlockState { id: number; text: string; }

export function useGameEngine() {
  const engineRef = useRef<GameEngine | null>(null);
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);
  const [highScore, setHighScore] = useState(() => loadHighScore());
  const [settings, setSettingsState] = useState<GameSettings>(() => loadSettings());
  const [lastStats, setLastStats] = useState<GameStats | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [toastQueue, setToastQueue] = useState<UnlockToastState[]>([]);
  const [eventBanner, setEventBanner] = useState<EventBannerState | null>(null);
  const [moduleUnlockBanner, setModuleUnlockBanner] = useState<ModuleUnlockState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const bannerTimerRef = useRef<number | null>(null);
  const unlockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    audio.sound = settings.sound;
    audio.music = settings.music;
  }, [settings]);

  const showEventBanner = useCallback((id: EventId) => {
    const def = EVENT_MAP[id];
    setEventBanner({ id: Date.now(), text: def.name.toUpperCase(), sub: def.desc });
    if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => setEventBanner(null), 3600);
  }, []);

  const showModuleUnlock = useCallback((id: ModuleId) => {
    setModuleUnlockBanner({ id: Date.now(), text: `${MODULE_MAP[id].name.toUpperCase()} ONLINE` });
    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = window.setTimeout(() => setModuleUnlockBanner(null), 3200);
  }, []);

  const makeEngine = useCallback(() => new GameEngine({
    onSound: (name) => {
      (audio as any)[name]?.();
    },
    onToast: (toast) => setToastQueue(q => [...q, toast]),
    onModuleUnlock: (id) => showModuleUnlock(id),
    onEventStart: (id) => showEventBanner(id),
    onGameOver: (stats) => {
      const best = saveHighScore(stats.score);
      setHighScore(best);
      setIsNewBest(stats.score >= best && stats.score > 0);
      setLastStats(stats);
      setPhase('gameover');
      audio.stopMusic();
    },
  }), [showEventBanner, showModuleUnlock]);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
  }, []);

  const loop = useCallback((ts: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (lastTsRef.current == null) lastTsRef.current = ts;
    const dt = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;
    engine.tick(dt);
    setSnapshot(engine.getSnapshot());
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const startLoop = useCallback(() => {
    stopLoop();
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, stopLoop]);

  const newGame = useCallback(() => {
    engineRef.current = makeEngine();
    setSnapshot(engineRef.current.getSnapshot());
    setLastStats(null);
    setToastQueue([]);
    setEventBanner(null);
    setModuleUnlockBanner(null);
    setPhase('playing');
    if (settings.music) audio.startMusic();
    startLoop();
  }, [makeEngine, startLoop, settings.music]);

  const pauseGame = useCallback(() => {
    if (phase !== 'playing') return;
    stopLoop();
    setPhase('paused');
  }, [phase, stopLoop]);

  const resumeGame = useCallback(() => {
    if (phase !== 'paused') return;
    setPhase('playing');
    startLoop();
  }, [phase, startLoop]);

  const quitToMenu = useCallback(() => {
    stopLoop();
    audio.stopMusic();
    engineRef.current = null;
    setSnapshot(null);
    setPhase('menu');
  }, [stopLoop]);

  useEffect(() => () => { stopLoop(); audio.stopMusic(); }, [stopLoop]);

  const addBelt = useCallback((from: ModuleId, to: ModuleId) => {
    engineRef.current?.addBelt(from, to);
  }, []);
  const removeBelt = useCallback((id: string) => {
    engineRef.current?.removeBelt(id);
  }, []);
  const collectPowerup = useCallback((id: number) => {
    engineRef.current?.collectPowerup(id);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToastQueue(q => q.filter(t => t.id !== id));
  }, []);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  return {
    phase, snapshot, highScore, settings, lastStats, isNewBest,
    toastQueue, eventBanner, moduleUnlockBanner,
    newGame, pauseGame, resumeGame, quitToMenu,
    addBelt, removeBelt, collectPowerup, dismissToast, updateSettings,
  };
}

export type GameEngineApi = ReturnType<typeof useGameEngine>;
