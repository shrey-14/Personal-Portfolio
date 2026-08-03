import { HIGH_SCORE_KEY, SETTINGS_KEY } from './constants';

export interface GameSettings {
  sound: boolean;
  music: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  music: true,
  reducedMotion: false,
};

export function loadHighScore(): number {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): number {
  const best = Math.max(score, loadHighScore());
  try { localStorage.setItem(HIGH_SCORE_KEY, String(best)); } catch { /* ignore */ }
  return best;
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: GameSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
