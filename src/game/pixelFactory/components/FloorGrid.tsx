import { useEffect, useMemo, useRef } from 'react';
import type { InstancedMesh } from 'three';
import * as THREE from 'three';
import { GRID_W, GRID_H } from '../constants';
import { gridToWorld } from '../grid';

export default function FloorGrid() {
  const ref = useRef<InstancedMesh>(null);
  const count = GRID_W * GRID_H;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    let i = 0;
    for (let gx = 0; gx < GRID_W; gx++) {
      for (let gy = 0; gy < GRID_H; gy++) {
        const [x, z] = gridToWorld(gx, gy);
        dummy.position.set(x, -0.03, z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        const dark = (gx + gy) % 2 === 0;
        mesh.setColorAt(i, new THREE.Color(dark ? '#22262f' : '#262b35'));
        i++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [dummy, count]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} receiveShadow>
      <boxGeometry args={[0.96, 0.06, 0.96]} />
      <meshStandardMaterial flatShading roughness={1} />
    </instancedMesh>
  );
}
