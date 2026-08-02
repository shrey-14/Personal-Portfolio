import { useFrame } from '@react-three/fiber';
import { useGameEngine } from '../../game/core/GameEngineContext';

/** Bridges R3F's render clock into the fixed-timestep GameLoop. Must be
 *  rendered as a child of <Canvas> — useFrame requires the R3F context. */
export function GameLoopDriver() {
  const engine = useGameEngine();
  useFrame((_state, delta) => {
    engine.loop.tick(delta);
  });
  return null;
}
