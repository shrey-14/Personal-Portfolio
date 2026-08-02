import { useMemo } from 'react';
import { createSpike } from '../../../rendering/GeometryFactory';
import { createFlatMaterial } from '../../../rendering/MaterialFactory';
import { rgbToHex, VGA_PALETTE } from '../../../rendering/textures/palette';

const BODY_COLOR = rgbToHex(VGA_PALETTE[4]); // red
const FIN_COLOR = rgbToHex(VGA_PALETTE[14]); // yellow

/** Angular, all-triangular silhouette — a 3-sided spike body (a dart/
 *  arrowhead) with two smaller 3-sided fins swept back. Every geometry here
 *  is faceted-cone-with-3-sides, never a recolor of the round Drifter or
 *  hexagonal Armored. Forward is baked in as -Z so EnemyView's lookAt()
 *  points the nose at the core. */
export function RusherMesh() {
  const bodyGeometry = useMemo(() => {
    const geo = createSpike(0.42, 1.05, 3);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);
  const finGeometry = useMemo(() => {
    const geo = createSpike(0.14, 0.34, 3);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);
  const bodyMaterial = useMemo(() => createFlatMaterial({ color: BODY_COLOR }), []);
  const finMaterial = useMemo(() => createFlatMaterial({ color: FIN_COLOR }), []);

  return (
    <group>
      <mesh geometry={bodyGeometry} material={bodyMaterial} />
      <mesh
        geometry={finGeometry}
        material={finMaterial}
        position={[-0.3, -0.05, 0.35]}
        rotation={[0, 0, Math.PI / 2.2]}
      />
      <mesh
        geometry={finGeometry}
        material={finMaterial}
        position={[0.3, -0.05, 0.35]}
        rotation={[0, 0, -Math.PI / 2.2]}
      />
    </group>
  );
}
