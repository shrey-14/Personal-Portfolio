import { useMemo, useRef, useState } from 'react';
import { NeuralDefenseGame } from '../NeuralDefenseGame';
import type { AICoreHandle } from '../game/entities/aiCore';
import { createDefaultEnemies } from '../game/entities/enemies';
import type { CameraMode } from '../game/rendering/CameraRig';

/** Dev-only QA harness: mounts the game plus a few plain HTML controls to
 *  exercise the AICore's imperative reactions, health-driven critical state,
 *  and the Armored enemy's live damage cracks — without needing real
 *  gameplay wired up yet. Never shipped — game-dev.html is a separate Vite
 *  entry from the portfolio's index.html. */
export function DevHarness() {
  const aiCoreRef = useRef<AICoreHandle>(null);
  const [health, setHealth] = useState(1);
  const enemies = useMemo(() => createDefaultEnemies(), []);
  const armored = enemies.find((enemy) => enemy.kind === 'armored')!;

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const cameraMode = (params.get('camera') as CameraMode | null) ?? undefined;
  const crtParam = params.get('crt');
  const crtEnabled = crtParam === null ? undefined : crtParam !== '0';

  return (
    <>
      <NeuralDefenseGame
        cameraMode={cameraMode}
        crtEnabled={crtEnabled}
        aiCoreRef={aiCoreRef}
        aiCoreHealth={health}
        enemies={enemies}
      />
      <div className="dev-controls">
        <button type="button" onClick={() => aiCoreRef.current?.playDamage()}>
          Core Damage
        </button>
        <button type="button" onClick={() => aiCoreRef.current?.playVictory()}>
          Core Victory
        </button>
        <label>
          Core Health {health.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={health}
            onChange={(event) => setHealth(Number(event.target.value))}
          />
        </label>
        <button type="button" onClick={() => armored.takeDamage(12)}>
          Damage Armored
        </button>
      </div>
    </>
  );
}
