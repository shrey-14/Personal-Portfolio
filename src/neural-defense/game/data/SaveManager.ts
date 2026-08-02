import { SAVE_KEY_PREFIX, SAVE_VERSION } from './constants';

export interface GameSaveData {
  version: number;
  highScore: number;
  audioMuted: boolean;
}

const DEFAULT_SAVE: GameSaveData = {
  version: SAVE_VERSION,
  highScore: 0,
  audioMuted: false,
};

/** localStorage-backed persistence, namespaced so it never collides with the
 *  portfolio shell's own storage keys (e.g. shreyos_theme). Fails soft — a
 *  visitor in private-browsing mode or over quota just doesn't get a save. */
export class SaveManager {
  private key(name: string): string {
    return `${SAVE_KEY_PREFIX}${name}`;
  }

  load(): GameSaveData {
    try {
      const raw = window.localStorage.getItem(this.key('save'));
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw) as Partial<GameSaveData>;
      if (parsed.version !== SAVE_VERSION) return { ...DEFAULT_SAVE };
      return { ...DEFAULT_SAVE, ...parsed };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  save(data: GameSaveData): void {
    try {
      window.localStorage.setItem(this.key('save'), JSON.stringify(data));
    } catch {
      /* localStorage unavailable — silently skip, gameplay must not depend on it */
    }
  }

  clear(): void {
    try {
      window.localStorage.removeItem(this.key('save'));
    } catch {
      /* ignore */
    }
  }
}
