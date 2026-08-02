import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

/** Non-gameplay placeholder geometry. Its only job is to prove the render
 *  pipeline out loud: flat shading, low-poly, fog, no PBR/bloom. Real scene
 *  content replaces this in a later milestone. */
export function PlaceholderScene() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.y += delta * 0.35;
    mesh.rotation.x += delta * 0.12;
  });

  return (
    <>
      <fog attach="fog" args={['#040608', 6, 22]} />
      <ambientLight intensity={0.5} color="#3a4a52" />
      <directionalLight position={[4, 6, 3]} intensity={1.1} color="#ffb454" />

      <mesh ref={meshRef} position={[0, 1.4, 0]}>
        <icosahedronGeometry args={[1.3, 0]} />
        <meshLambertMaterial color="#39ff14" flatShading />
      </mesh>

      <gridHelper args={[40, 40, '#1084d0', '#12202a']} position={[0, -0.6, 0]} />
    </>
  );
}
