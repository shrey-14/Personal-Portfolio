import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import type { FloatingPowerup } from '../types';
import { POWERUP_MAP } from '../constants';
import { gridToWorld } from '../grid';
import { PowerupIcon } from './PixelIcon';

export default function PowerupPickup({ pu, onCollect }: { pu: FloatingPowerup; onCollect: () => void }) {
  const group = useRef<Group>(null);
  const [x, z] = gridToWorld(pu.gx, pu.gy);
  const def = POWERUP_MAP[pu.powerupId];

  useFrame((st) => {
    const g = group.current;
    if (!g) return;
    const t = st.clock.elapsedTime;
    g.position.y = 0.35 + Math.sin(t * 2.4) * 0.08;
    g.rotation.y = t * 1.4;
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.4, 16]} />
        <meshBasicMaterial color={def.color} transparent opacity={0.7} />
      </mesh>
      <group ref={group} onClick={(e) => { e.stopPropagation(); onCollect(); }}>
        <mesh>
          <octahedronGeometry args={[0.22]} />
          <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.6} flatShading />
        </mesh>
      </group>
      <Html position={[0, 0.85, 0]} center distanceFactor={9} occlude={false} style={{ pointerEvents: 'none' }}>
        <div className="pf-powerup-tag">
          <PowerupIcon id={pu.powerupId} size={16} />
          <span>{def.short}</span>
        </div>
      </Html>
    </group>
  );
}
