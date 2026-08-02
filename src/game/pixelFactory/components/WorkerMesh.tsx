import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Group, Mesh } from 'three';
import type { WorkerState, ModuleId, WorkerTypeId } from '../types';
import { WORKER_TYPE_MAP, TASK_MAP } from '../constants';
import { gridToWorld } from '../grid';
import { ModuleIcon } from './PixelIcon';

/* Body/head proportions per worker type — silhouette carries the identity,
   not just colour, so it reads even for colourblind players or at a glance. */
const BODY_SIZE: Record<WorkerTypeId, [number, number, number]> = {
  disk: [0.26, 0.28, 0.22],
  network: [0.22, 0.32, 0.2],
  audio: [0.28, 0.26, 0.24],
  video: [0.3, 0.24, 0.18],
  memory: [0.2, 0.32, 0.2],
  repair: [0.27, 0.27, 0.24],
  delivery: [0.26, 0.3, 0.26],
};
const HEAD_SIZE: Record<WorkerTypeId, [number, number, number]> = {
  disk: [0.22, 0.2, 0.2],
  network: [0.18, 0.18, 0.18],
  audio: [0.22, 0.2, 0.2],
  video: [0.3, 0.18, 0.16],
  memory: [0.19, 0.19, 0.19],
  repair: [0.22, 0.2, 0.2],
  delivery: [0.22, 0.2, 0.2],
};

/* A small accessory unique to each type, layered on top of the shared
   body+head+eyes rig — the cheapest way to get seven real silhouettes
   without seven bespoke rigs. */
function Topper({ typeId, trim }: { typeId: WorkerTypeId; trim: string }) {
  switch (typeId) {
    case 'disk':
      return (
        <mesh position={[0, 0.17, -0.13]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.16, 0.16, 0.02]} />
          <meshStandardMaterial color={trim} flatShading />
        </mesh>
      );
    case 'network':
      return (
        <group position={[0, 0.51, 0]}>
          <mesh position={[0, 0.06, 0]}>
            <coneGeometry args={[0.018, 0.12, 6]} />
            <meshStandardMaterial color={trim} flatShading />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    case 'audio':
      return (
        <>
          <mesh position={[-0.12, 0.42, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.045, 0.018, 6, 10]} />
            <meshStandardMaterial color={trim} flatShading />
          </mesh>
          <mesh position={[0.12, 0.42, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.045, 0.018, 6, 10]} />
            <meshStandardMaterial color={trim} flatShading />
          </mesh>
        </>
      );
    case 'video':
      return (
        <mesh position={[0, 0.42, 0.09]}>
          <boxGeometry args={[0.24, 0.12, 0.015]} />
          <meshStandardMaterial color="#1b1e24" flatShading />
        </mesh>
      );
    case 'memory':
      return (
        <mesh position={[0, 0.55, 0]} rotation={[0, Math.PI / 4, 0]}>
          <octahedronGeometry args={[0.055]} />
          <meshStandardMaterial color={trim} flatShading emissive={trim} emissiveIntensity={0.3} />
        </mesh>
      );
    case 'repair':
      return (
        <group position={[0, 0.54, 0]} rotation={[0, 0, Math.PI / 4]}>
          <mesh>
            <boxGeometry args={[0.14, 0.03, 0.03]} />
            <meshStandardMaterial color={trim} flatShading />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.14, 0.03, 0.03]} />
            <meshStandardMaterial color={trim} flatShading />
          </mesh>
        </group>
      );
    case 'delivery':
      return (
        <mesh position={[0, 0.2, -0.15]}>
          <boxGeometry args={[0.2, 0.2, 0.1]} />
          <meshStandardMaterial color={trim} flatShading />
        </mesh>
      );
    default:
      return null;
  }
}

export default function WorkerMesh({ worker, scrambledIcon }: { worker: WorkerState; scrambledIcon?: ModuleId }) {
  const group = useRef<Group>(null);
  const head = useRef<Mesh>(null);
  const eyeL = useRef<Mesh>(null);
  const eyeR = useRef<Mesh>(null);
  const wt = WORKER_TYPE_MAP[worker.typeId];
  const task = TASK_MAP[worker.taskId];
  const bodySize = BODY_SIZE[worker.typeId];
  const headSize = HEAD_SIZE[worker.typeId];
  const eyeX = headSize[0] * 0.25;
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
    let bob = 0, tilt = 0, scaleY = 1;
    if (worker.anim === 'walk') bob = Math.abs(Math.sin(t * 9)) * 0.07;
    else if (worker.anim === 'wait') bob = Math.sin(t * 2.2) * 0.03;
    else if (worker.anim === 'happy') { bob = Math.abs(Math.sin(t * 14)) * 0.16; scaleY = 1 + Math.sin(t * 14) * 0.06; }
    else if (worker.anim === 'confused') tilt = Math.sin(t * 16) * 0.18;
    else if (worker.anim === 'panic') { tilt = Math.sin(t * 26) * 0.28; bob = Math.abs(Math.sin(t * 20)) * 0.1; }
    g.position.y = bob;
    g.rotation.z = tilt;
    g.scale.y = THREE.MathUtils.lerp(g.scale.y, scaleY, 0.3);

    if (head.current) head.current.rotation.z = worker.anim === 'confused' ? Math.sin(t * 16) * 0.12 : 0;

    blinkPhase.current += dt;
    const blink = (blinkPhase.current % 3.2) > 3.06;
    const eScale = blink ? 0.08 : 1;
    if (eyeL.current) eyeL.current.scale.y = eScale;
    if (eyeR.current) eyeR.current.scale.y = eScale;
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
        <boxGeometry args={bodySize} />
        <meshStandardMaterial color={bodyColor} flatShading roughness={0.7} />
      </mesh>
      <mesh ref={head} position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={headSize} />
        <meshStandardMaterial color={wt.trim} flatShading roughness={0.6} />
      </mesh>
      <mesh ref={eyeL} position={[-eyeX, 0.43, headSize[2] / 2 + 0.005]}>
        <boxGeometry args={[0.045, 0.05, 0.02]} />
        <meshBasicMaterial color="#1b1e24" />
      </mesh>
      <mesh ref={eyeR} position={[eyeX, 0.43, headSize[2] / 2 + 0.005]}>
        <boxGeometry args={[0.045, 0.05, 0.02]} />
        <meshBasicMaterial color="#1b1e24" />
      </mesh>
      <Topper typeId={worker.typeId} trim={wt.trim} />
      <Html position={[0, 0.78, 0]} center distanceFactor={9} occlude={false} style={{ pointerEvents: 'none' }}>
        <div className={`pf-worker-tag pf-anim-${worker.anim}${worker.infected ? ' pf-infected' : ''}`}>
          <ModuleIcon id={task.target} scrambled={scrambledIcon} size={16} />
        </div>
      </Html>
    </group>
  );
}
