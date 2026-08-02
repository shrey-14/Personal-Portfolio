import type { Ref } from 'react';
import { GameEngineProvider } from './game/core/GameEngineContext';
import type { AICoreHandle } from './game/entities/aiCore';
import type { CameraMode } from './game/rendering/CameraRig';
import { GameCanvas } from './components/GameCanvas/GameCanvas';
import { HUD } from './components/HUD/HUD';
import { MainMenu } from './components/Menus/MainMenu';
import './NeuralDefenseGame.css';

export interface NeuralDefenseGameProps {
  className?: string;
  /** @default 'perspective' */
  cameraMode?: CameraMode;
  /** CRT scanline/vignette/curvature post-process layer. @default true */
  crtEnabled?: boolean;
  /** Reach the central AI Core's imperative handle (playDamage/playVictory)
   *  from outside the render tree — gameplay systems trigger reactions here. */
  aiCoreRef?: Ref<AICoreHandle>;
  /** 0..1 — drives the AI Core's continuous critical-state pulse. @default 1 */
  aiCoreHealth?: number;
}

/** Root of the Neural Defense game module — a self-contained Win95-style game
 *  window (titlebar + 4:3 viewport) that can be dropped anywhere in the
 *  portfolio. Owns its own GameEngine instance via GameEngineProvider. */
export function NeuralDefenseGame({
  className,
  cameraMode,
  crtEnabled,
  aiCoreRef,
  aiCoreHealth,
}: NeuralDefenseGameProps) {
  return (
    <GameEngineProvider>
      <div className={['nd-window', className].filter(Boolean).join(' ')}>
        <div className="nd-titlebar">
          <span className="nd-titlebar-icon" aria-hidden="true">▣</span>
          <span className="nd-titlebar-text">Neural Defense.exe</span>
          <div className="nd-titlebar-buttons" aria-hidden="true">
            <span className="nd-titlebar-btn">_</span>
            <span className="nd-titlebar-btn">□</span>
            <span className="nd-titlebar-btn">✕</span>
          </div>
        </div>
        <div className="nd-viewport">
          <GameCanvas
            cameraMode={cameraMode}
            crtEnabled={crtEnabled}
            aiCoreRef={aiCoreRef}
            aiCoreHealth={aiCoreHealth}
          />
          <MainMenu />
          <HUD />
        </div>
      </div>
    </GameEngineProvider>
  );
}
