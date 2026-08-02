import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshStandardMaterial } from 'three';
import type { BeltEdge } from '../types';
import { gridToWorld } from '../grid';

export default function BeltMesh({ belt, stackIndex, onRemove }: { belt: BeltEdge; stackIndex: number; onRemove: () => void }) {
  const y = 0.05 + (stackIndex % 3) * 0.02;
  const cells = useMemo(() => belt.cells.map(([gx, gy]) => gridToWorld(gx, gy)), [belt.cells]);
  const lightRefs = useRef<(Mesh | null)[]>([]);

  useFrame((st) => {
    const t = st.clock.elapsedTime;
    lightRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as MeshStandardMaterial;
      const phase = (t * 1.6 - i * 0.35) % 1;
      mat.emissiveIntensity = phase >= 0 && phase < 0.35 ? 1.1 - phase * 2 : 0.15;
    });
  });

  return (
    <group>
      {cells.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[0.86, 0.05, 0.86]} />
            <meshStandardMaterial color="#5a5f6b" flatShading roughness={0.9} />
          </mesh>
          <mesh position={[0, y + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} ref={(m) => { lightRefs.current[i] = m; }}>
            <planeGeometry args={[0.16, 0.16]} />
            <meshStandardMaterial color="#111" emissive="#ffb454" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
