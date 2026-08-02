import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Group, Mesh } from 'three';
import type { WorkerState, ModuleId } from '../types';
import { WORKER_TYPE_MAP, TASK_MAP } from '../constants';
import { gridToWorld } from '../grid';
import { ModuleIcon } from './PixelIcon';

export default function WorkerMesh({ worker, scrambledIcon }: { worker: WorkerState; scrambledIcon?: ModuleId }) {
  const group = useRef<Group>(null);
  const head = useRef<Mesh>(null);
  const eyeL = useRef<Mesh>(null);
  const eyeR = useRef<Mesh>(null);
  const wt = WORKER_TYPE_MAP[worker.typeId];
  const task = TASK_MAP[worker.taskId];
  const [wx, wz] = useMemo(() => gridToWorld(worker.x, worker.y), [worker.x, worker.y]);
  const facing = useRef(0);
  const lastPos = useRef({ x: wx, z: wz });
  const blinkPhase = useRef(Math.random() * 10);

  useFrame((st, dt) => {
    const g = group.current;
    if (!g) return;
    const dx = wx - lastPos.current.x, dz = wz - lastPos.current.z;
    if (Math.hypot(dx, dz) > 0.002) facing.current = Math.atan2(dx, dz);
    lastPos.current = { x: wx, z: wz };
    g.position.set(wx, 0, wz);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, facing.current, 0.25);

    const t = st.clock.elapsedTime;
    let bob = 0, tilt = 0, scaleY = 1, hue = 0;
    if (worker.anim === 'walk') bob = Math.abs(Math.sin(t * 9)) * 0.07;
    else if (worker.anim === 'wait') bob = Math.sin(t * 2.2) * 0.03;
    else if (worker.anim === 'happy') { bob = Math.abs(Math.sin(t * 14)) * 0.16; scaleY = 1 + Math.sin(t * 14) * 0.06; }
    else if (worker.anim === 'confused') tilt = Math.sin(t * 16) * 0.18;
    else if (worker.anim === 'panic') { tilt = Math.sin(t * 26) * 0.28; bob = Math.abs(Math.sin(t * 20)) * 0.1; hue = 1; }
    g.position.y = bob;
    g.rotation.z = tilt;
    g.scale.y = THREE.MathUtils.lerp(g.scale.y, scaleY, 0.3);

    if (head.current) head.current.rotation.z = worker.anim === 'confused' ? Math.sin(t * 16) * 0.12 : 0;

    blinkPhase.current += dt;
    const blink = (blinkPhase.current % 3.2) > 3.06;
    const eScale = blink ? 0.08 : 1;
    if (eyeL.current) eyeL.current.scale.y = eScale;
    if (eyeR.current) eyeR.current.scale.y = eScale;
    void hue;
  });

  const bodyColor = worker.infected ? '#8b2fc9' : wt.color;
  const outcomeRing = worker.outcome === 'correct' ? '#39ff14' : worker.outcome === 'wrong' ? '#ff9a3a' : worker.outcome === 'missed' ? '#ff4040' : null;

  return (
    <group ref={group}>
      {worker.infected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.34, 12]} />
          <meshBasicMaterial color="#c94fff" transparent opacity={0.8} />
        </mesh>
      )}
      {outcomeRing && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.38, 12]} />
          <meshBasicMaterial color={outcomeRing} transparent opacity={0.85} />
        </mesh>
      )}
      <mesh position={[0, 0.19, 0]} castShadow>
        <boxGeometry args={[0.26, 0.3, 0.2]} />
        <meshStandardMaterial color={bodyColor} flatShading roughness={0.7} />
      </mesh>
      <mesh ref={head} position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.22, 0.2, 0.2]} />
        <meshStandardMaterial color={wt.trim} flatShading roughness={0.6} />
      </mesh>
      <mesh ref={eyeL} position={[-0.055, 0.43, 0.105]}>
        <boxGeometry args={[0.045, 0.05, 0.02]} />
        <meshBasicMaterial color="#1b1e24" />
      </mesh>
      <mesh ref={eyeR} position={[0.055, 0.43, 0.105]}>
        <boxGeometry args={[0.045, 0.05, 0.02]} />
        <meshBasicMaterial color="#1b1e24" />
      </mesh>
      <Html position={[0, 0.78, 0]} center distanceFactor={9} occlude={false} style={{ pointerEvents: 'none' }}>
        <div className={`pf-worker-tag pf-anim-${worker.anim}${worker.infected ? ' pf-infected' : ''}`}>
          <ModuleIcon id={task.target} scrambled={scrambledIcon} size={16} />
        </div>
      </Html>
    </group>
  );
}
