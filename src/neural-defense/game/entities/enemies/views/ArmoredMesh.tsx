import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { createLowPolySphere, createPrism } from '../../../rendering/GeometryFactory';
import { createDecalMaterial, createFlatMaterial, createUnlitMaterial } from '../../../rendering/MaterialFactory';
import { rgbToHex, VGA_PALETTE } from '../../../rendering/textures/palette';
import { createCrackTexture } from '../../../rendering/textures/RetroTextureGenerator';
import type { EnemyBase } from '../EnemyBase';

const BODY_COLOR = rgbToHex(VGA_PALETTE[8]); // dark gray — reads blue-grey against the scene's cool lighting
const TRIM_COLOR = rgbToHex(VGA_PALETTE[9]); // light blue
const EYE_COLOR = rgbToHex(VGA_PALETTE[14]); // yellow
const CRACK_COLOR = rgbToHex(VGA_PALETTE[0]); // black

export interface ArmoredMeshProps {
  enemy: EnemyBase;
}

/** Chunky hexagonal prism, blue-grey plating, a single yellow eye, and a
 *  procedural crack decal whose opacity is driven live by the enemy's
 *  current health — reads as "this one is nearly dead" without any UI. */
export function ArmoredMesh({ enemy }: ArmoredMeshProps) {
  const bodyGeometry = useMemo(() => createPrism(0.55, 0.5, 6), []);
  const crackGeometry = useMemo(() => createPrism(0.57, 0.52, 6), []);
  const trimGeometry = useMemo(() => createPrism(0.58, 0.12, 6), []);
  const eyeGeometry = useMemo(() => createLowPolySphere(0.11, 0), []);

  const bodyMaterial = useMemo(() => createFlatMaterial({ color: BODY_COLOR }), []);
  const trimMaterial = useMemo(() => createFlatMaterial({ color: TRIM_COLOR }), []);
  const eyeMaterial = useMemo(() => createUnlitMaterial(EYE_COLOR), []);
  const crackTexture = useMemo(
    () => createCrackTexture(CRACK_COLOR, { size: 32, seed: 7, branches: 4, repeat: [3, 1] }),
    [],
  );
  const crackMaterial = useMemo(() => createDecalMaterial({ map: crackTexture, opacity: 0 }), [crackTexture]);

  useFrame(() => {
    crackMaterial.opacity = 1 - enemy.healthFraction;
  });

  return (
    <group>
      <mesh geometry={bodyGeometry} material={bodyMaterial} />
      <mesh geometry={crackGeometry} material={crackMaterial} />
      <mesh geometry={trimGeometry} material={trimMaterial} position={[0, 0.05, 0]} />
      <mesh geometry={eyeGeometry} material={eyeMaterial} position={[0, 0.05, -0.5]} />
    </group>
  );
}
