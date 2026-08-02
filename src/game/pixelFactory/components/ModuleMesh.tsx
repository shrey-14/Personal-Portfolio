import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Mesh } from 'three';
import type { ModuleDef, ModuleState } from '../types';
import { gridToWorld } from '../grid';
import { ModuleIcon } from './PixelIcon';

const SIZE: Record<string, [number, number, number]> = {
  floppy: [0.8, 0.35, 0.8],
  cpu: [0.7, 0.5, 0.7],
  ram: [0.55, 0.75, 0.3],
  hdd: [0.75, 0.6, 0.75],
  printer: [0.85, 0.55, 0.65],
  cdrom: [0.75, 0.4, 0.75],
  modem: [0.6, 0.5, 0.6],
  soundcard: [0.6, 0.6, 0.5],
  virusscanner: [0.65, 0.55, 0.65],
  gpu: [0.85, 0.45, 0.55],
  psu: [0.7, 0.65, 0.7],
  recyclebin: [0.6, 0.7, 0.6],
  backup: [0.75, 0.55, 0.75],
};

export default function ModuleMesh({
  def, state, workFlash, connecting, onDown, onUp, scrambledIcon,
}: {
  def: ModuleDef;
  state: ModuleState;
  workFlash: number;
  connecting: boolean;
  onDown: () => void;
  onUp: () => void;
  scrambledIcon?: import('../types').ModuleId;
}) {
  const meshRef = useRef<Mesh>(null);
  const [wx, wz] = useMemo(() => gridToWorld(def.gx, def.gy), [def.gx, def.gy]);
  const size = SIZE[def.id] || [0.7, 0.5, 0.7];
  const baseY = size[1] / 2 + 0.05;

  useFrame((st) => {
    const m = meshRef.current;
    if (!m) return;
    const t = st.clock.elapsedTime;
    if (state === 'locked') {
      m.scale.setScalar(0.001);
      return;
    }
    let s = 1;
    if (state === 'working') s = 1 + Math.min(workFlash, 0.6) * 0.22;
    else if (state === 'overloaded') s = 1 + Math.sin(t * 11) * 0.05;
    else if (state === 'idle') s = 1 + Math.sin(t * 1.4 + def.gx) * 0.015;
    else if (state === 'offline') s = 1 + Math.sin(t * 9) * 0.02;
    m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, s, 0.25));
    m.position.y = baseY + (connecting ? 0.08 : 0);
    if (state === 'offline') m.rotation.z = Math.sin(t * 14) * 0.015;
    else if (state === 'overloaded') m.rotation.z = Math.sin(t * 8) * 0.035;
    else m.rotation.z = THREE.MathUtils.lerp(m.rotation.z, 0, 0.2);
  });

  if (state === 'locked') return null;

  const color = state === 'offline' ? '#3a3a3a' : state === 'overloaded' ? '#c9622f' : def.color;
  const emissive = state === 'offline' ? '#ff3030' : state === 'overloaded' ? '#ff8a3a' : def.emissive;
  const emissiveIntensity = state === 'working' ? 0.9 : state === 'overloaded' ? 1 : state === 'offline' ? 0.1 : 0.35;

  return (
    <group position={[wx, 0, wz]}>
      {/* Invisible hitbox, bigger than the visible cube — a real cube barely
          30px tall on screen is a fussy pointer target and a much worse touch
          target, so belt-dragging grabs a generous tap area instead. */}
      <mesh
        position={[0, baseY, 0]}
        onPointerDown={(e) => { e.stopPropagation(); onDown(); }}
        onPointerUp={(e) => { e.stopPropagation(); onUp(); }}
      >
        <boxGeometry args={[0.95, size[1] + 0.55, 0.95]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={meshRef} position={[0, baseY, 0]} castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          flatShading
          roughness={0.85}
        />
      </mesh>
      {connecting && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.68, 4]} />
          <meshBasicMaterial color="#ffb454" />
        </mesh>
      )}
      <Html
        position={[0, size[1] + 0.55, 0]}
        center
        distanceFactor={9}
        occlude={false}
        style={{ pointerEvents: 'none' }}
      >
        <div className={`pf-mod-tag pf-mod-${state}`}>
          <ModuleIcon id={def.id} scrambled={scrambledIcon} size={18} />
          <span>{def.short}</span>
        </div>
      </Html>
    </group>
  );
}
