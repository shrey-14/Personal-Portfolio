import { GameEngineProvider } from './game/core/GameEngineContext';
import { GameCanvas } from './components/GameCanvas/GameCanvas';
import { HUD } from './components/HUD/HUD';
import { MainMenu } from './components/Menus/MainMenu';
import './NeuralDefenseGame.css';

export interface NeuralDefenseGameProps {
  className?: string;
}

/** Root of the Neural Defense game module — a self-contained Win95-style game
 *  window (titlebar + 4:3 viewport) that can be dropped anywhere in the
 *  portfolio. Owns its own GameEngine instance via GameEngineProvider. */
export function NeuralDefenseGame({ className }: NeuralDefenseGameProps) {
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
          <GameCanvas />
          <MainMenu />
          <HUD />
        </div>
      </div>
    </GameEngineProvider>
  );
}
