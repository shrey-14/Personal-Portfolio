import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import FactoryScene from './FactoryScene';
import type { EngineSnapshot } from '../engine';
import type { ModuleId } from '../types';

/* Perturbs the camera only while an actual shake is in flight, and touches
   camera.position at no other time — OrbitControls owns it the rest of the
   time. Capturing a "base" position once at mount is a trap: it can run
   before <OrthographicCamera> has applied its own position prop, silently
   pinning the camera to a stale (0,0,z) every frame afterwards. */
function CameraShake({ trigger, reducedMotion }: { trigger: number; reducedMotion: boolean }) {
  const { camera } = useThree();
  const shakeUntil = useRef(0);
  const prevTrigger = useRef(trigger);
  const base = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (trigger !== prevTrigger.current) {
      prevTrigger.current = trigger;
      if (!reducedMotion) shakeUntil.current = performance.now() + 260;
    }
  }, [trigger, reducedMotion]);

  useFrame(() => {
    const now = performance.now();
    if (now < shakeUntil.current) {
      if (!base.current) base.current = { x: camera.position.x, y: camera.position.y };
      const k = (shakeUntil.current - now) / 260;
      camera.position.x = base.current.x + (Math.random() - 0.5) * 0.18 * k;
      camera.position.y = base.current.y + (Math.random() - 0.5) * 0.12 * k;
    } else if (base.current) {
      camera.position.x = base.current.x;
      camera.position.y = base.current.y;
      base.current = null;
    }
  });
  return null;
}

export default function GameCanvas({
  snapshot, onAddBelt, onRemoveBelt, onCollectPowerup, reducedMotion,
}: {
  snapshot: EngineSnapshot;
  onAddBelt: (from: ModuleId, to: ModuleId) => void;
  onRemoveBelt: (id: string) => void;
  onCollectPowerup: (id: number) => void;
  reducedMotion: boolean;
}) {
  const shakeTrigger = snapshot.stats.wrong + snapshot.stats.missed;
  return (
    <div className="pf-canvas-wrap">
      <Canvas
        dpr={[0.55, 0.9]}
        gl={{ antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: true }}
        shadows={false}
        style={{ imageRendering: 'pixelated' }}
        onCreated={({ gl }) => { gl.setClearColor('#14161c'); }}
      >
        <OrthographicCamera makeDefault position={[9, 9, 9]} zoom={46} near={0.1} far={60} />
        <OrbitControls
          enableRotate={false}
          enablePan={false}
          minZoom={30}
          maxZoom={70}
          enableDamping
          dampingFactor={0.12}
        />
        <CameraShake trigger={shakeTrigger} reducedMotion={reducedMotion} />
        <fog attach="fog" args={['#14161c', 14, 26]} />
        <FactoryScene
          snapshot={snapshot}
          onAddBelt={onAddBelt}
          onRemoveBelt={onRemoveBelt}
          onCollectPowerup={onCollectPowerup}
        />
      </Canvas>
      <div className="pf-crt" aria-hidden="true">
        <div className="pf-crt-scan" />
        <div className="pf-crt-vignette" />
        <div className="pf-crt-flicker" />
      </div>
    </div>
  );
}
