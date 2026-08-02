import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraRig, type CameraMode } from '../../game/rendering/CameraRig';
import { CRTPostProcessing } from '../../game/rendering/crt/CRTPostProcessing';
import { useViewportFit } from '../../game/rendering/useViewportFit';
import { GameLoopDriver } from './GameLoopDriver';
import { PlaceholderScene } from './PlaceholderScene';
import './GameCanvas.css';

export interface GameCanvasProps {
  cameraMode?: CameraMode;
  crtEnabled?: boolean;
}

/** Canvas wrapper: measures its container, letterboxes to the fixed 4:3
 *  virtual resolution, and forces the WebGL drawing buffer down to that
 *  resolution via the `dpr` override — see game/rendering/resolution.ts.
 *  CameraRig owns camera creation, so no `camera` prop is passed to <Canvas>. */
export function GameCanvas({ cameraMode = 'perspective', crtEnabled = true }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fit = useViewportFit(containerRef);

  return (
    <div className="nd-canvas-viewport" ref={containerRef}>
      <Canvas
        className="nd-canvas"
        style={{ width: fit.width, height: fit.height }}
        dpr={fit.dpr}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        shadows={false}
        onCreated={({ gl }) => {
          // No PBR renderer defaults: flat output, no filmic/ACES tone curve.
          gl.setClearColor('#040608', 1);
          gl.toneMapping = THREE.NoToneMapping;
          gl.shadowMap.enabled = false;
        }}
      >
        <CameraRig mode={cameraMode} />
        <GameLoopDriver />
        <PlaceholderScene />
        <CRTPostProcessing enabled={crtEnabled} />
      </Canvas>
    </div>
  );
}
