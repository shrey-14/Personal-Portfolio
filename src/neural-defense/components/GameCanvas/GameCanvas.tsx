import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraRig } from '../../game/rendering/CameraRig';
import { useViewportFit } from '../../game/rendering/useViewportFit';
import { GameLoopDriver } from './GameLoopDriver';
import { PlaceholderScene } from './PlaceholderScene';
import './GameCanvas.css';

/** Canvas wrapper: measures its container, letterboxes to the fixed 4:3
 *  virtual resolution, and forces the WebGL drawing buffer down to that
 *  resolution via the `dpr` override — see game/rendering/resolution.ts. */
export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fit = useViewportFit(containerRef);

  return (
    <div className="nd-canvas-viewport" ref={containerRef}>
      <Canvas
        className="nd-canvas"
        style={{ width: fit.width, height: fit.height }}
        dpr={fit.dpr}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        camera={{ fov: 60, near: 0.1, far: 100 }}
        onCreated={({ gl }) => gl.setClearColor('#040608', 1)}
      >
        <CameraRig />
        <GameLoopDriver />
        <PlaceholderScene />
      </Canvas>
    </div>
  );
}
