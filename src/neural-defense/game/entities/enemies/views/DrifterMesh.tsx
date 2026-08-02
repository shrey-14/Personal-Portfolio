import { useMemo } from 'react';
import { createLowPolySphere } from '../../../rendering/GeometryFactory';
import { createFlatMaterial, createUnlitMaterial } from '../../../rendering/MaterialFactory';
import { rgbToHex, VGA_PALETTE } from '../../../rendering/textures/palette';

const BODY_COLOR = rgbToHex(VGA_PALETTE[2]); // green
const LIGHT_COLOR = rgbToHex(VGA_PALETTE[10]); // light green

/** Round low-poly blob with a small glowing "core light" nub — the softest,
 *  most organic silhouette of the three enemy kinds, unmistakable even as a
 *  flat outline against the angular Rusher or blocky Armored. */
export function DrifterMesh() {
  const bodyGeometry = useMemo(() => createLowPolySphere(0.5, 0), []);
  const lightGeometry = useMemo(() => createLowPolySphere(0.14, 0), []);
  const bodyMaterial = useMemo(() => createFlatMaterial({ color: BODY_COLOR }), []);
  const lightMaterial = useMemo(() => createUnlitMaterial(LIGHT_COLOR), []);

  return (
    <group>
      <mesh geometry={bodyGeometry} material={bodyMaterial} />
      <mesh geometry={lightGeometry} material={lightMaterial} position={[0, 0.12, -0.4]} />
    </group>
  );
}
