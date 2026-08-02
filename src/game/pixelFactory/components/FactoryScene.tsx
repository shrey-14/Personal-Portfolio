import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import FloorGrid from './FloorGrid';
import ModuleMesh from './ModuleMesh';
import WorkerMesh from './WorkerMesh';
import BeltMesh from './BeltMesh';
import PowerupPickup from './PowerupPickup';
import { MODULES } from '../constants';
import { gridToWorld } from '../grid';
import type { EngineSnapshot } from '../engine';
import type { ModuleId } from '../types';

export default function FactoryScene({
  snapshot, onAddBelt, onRemoveBelt, onCollectPowerup,
}: {
  snapshot: EngineSnapshot;
  onAddBelt: (from: ModuleId, to: ModuleId) => void;
  onRemoveBelt: (id: string) => void;
  onCollectPowerup: (id: number) => void;
}) {
  const [connectFrom, setConnectFrom] = useState<ModuleId | null>(null);
  const [fx] = useMemo(() => gridToWorld(MODULES[0].gx, MODULES[0].gy), []);

  const scrambleFor = (real: ModuleId): ModuleId | undefined => {
    if (!snapshot.iconsScrambled) return undefined;
    const others = MODULES.filter(m => m.id !== real && snapshot.moduleStates[m.id] !== 'locked');
    if (!others.length) return undefined;
    return others[Math.abs(real.charCodeAt(0) + real.length) % others.length].id;
  };

  return (
    <group
      onPointerMissed={() => setConnectFrom(null)}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 10, 4]} intensity={0.9} castShadow />
      <directionalLight position={[-6, 6, -4]} intensity={0.25} color="#7fd1ff" />

      <FloorGrid />

      {snapshot.belts.map((b, i) => (
        <BeltMesh key={b.id} belt={b} stackIndex={i} onRemove={() => onRemoveBelt(b.id)} />
      ))}

      {MODULES.map(def => (
        <ModuleMesh
          key={def.id}
          def={def}
          state={snapshot.moduleStates[def.id]}
          workFlash={snapshot.moduleWorkFlash[def.id] || 0}
          connecting={connectFrom === def.id}
          scrambledIcon={scrambleFor(def.id)}
          onDown={() => {
            if (snapshot.moduleStates[def.id] === 'locked') return;
            setConnectFrom(def.id);
          }}
          onUp={() => {
            if (connectFrom && connectFrom !== def.id && snapshot.moduleStates[def.id] !== 'locked') {
              onAddBelt(connectFrom, def.id);
            }
            setConnectFrom(null);
          }}
        />
      ))}

      {snapshot.workers.map(w => (
        <WorkerMesh key={w.id} worker={w} scrambledIcon={scrambleFor(w.target)} />
      ))}

      {snapshot.floatingPowerups.map(pu => (
        <PowerupPickup key={pu.id} pu={pu} onCollect={() => onCollectPowerup(pu.id)} />
      ))}

      {snapshot.floatingTexts
        .filter(f => snapshot.stats.elapsed - f.createdAt < 1.2)
        .map((f) => {
          const [x, z] = gridToWorld(f.x, f.y);
          const age = snapshot.stats.elapsed - f.createdAt;
          return (
            <Html key={f.id} position={[x, 0.9 + age * 0.6, z]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
              <div className="pf-float-text" style={{ color: f.color, opacity: 1 - age / 1.2 }}>{f.text}</div>
            </Html>
          );
        })}

      {snapshot.spawnFlash > 0 && (
        <mesh position={[fx, 0.06, gridToWorld(MODULES[0].gx, MODULES[0].gy)[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.9, 16]} />
          <meshBasicMaterial color="#39ff14" transparent opacity={snapshot.spawnFlash} />
        </mesh>
      )}
    </group>
  );
}
