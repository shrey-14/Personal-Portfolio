import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createLowPolySphere, createPrism, createSpike } from '../../rendering/GeometryFactory';
import { createFlatMaterial, createUnlitMaterial } from '../../rendering/MaterialFactory';
import { rgbToHex, VGA_PALETTE } from '../../rendering/textures/palette';
import {
  BLINK_DURATION,
  DAMAGE_DURATION,
  VICTORY_DURATION,
  randomBlinkInterval,
  shakeOffset,
} from './animation';
import type { AICoreEffect, AICoreHandle, AICoreProps } from './types';

const TEAL = rgbToHex(VGA_PALETTE[3]);
const MINT = rgbToHex(VGA_PALETTE[11]);
const RED_DARK = rgbToHex(VGA_PALETTE[4]);
const RED_LIGHT = rgbToHex(VGA_PALETTE[12]);

/** Central AI Core — the entity the whole game defends. A low-poly floating
 *  "robot head": flat-shaded teal body, mint trim, two blinking unlit eyes.
 *  Fully reusable: drop it anywhere with <AICore />, drive its continuous red
 *  "critical" alarm pulse via the `health` prop, and its one-shot reactions
 *  imperatively via a ref (playDamage / playVictory) — gameplay code doesn't
 *  need to thread transient event props through render. */
export const AICore = forwardRef<AICoreHandle, AICoreProps>(function AICore(
  { position = [0, 0, 0], scale = 1, health = 1, criticalThreshold = 0.3 },
  ref,
) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);

  const effectRef = useRef<AICoreEffect>(null);
  const nextBlinkAtRef = useRef(randomBlinkInterval());
  const blinkStartRef = useRef(-Infinity);

  const bodyGeometry = useMemo(() => createLowPolySphere(0.9, 1), []);
  const visorGeometry = useMemo(() => createPrism(0.95, 0.22, 8), []);
  const antennaGeometry = useMemo(() => createSpike(0.12, 0.5, 6), []);
  const eyeGeometry = useMemo(() => createLowPolySphere(0.12, 0), []);

  const bodyMaterial = useMemo(() => createFlatMaterial({ color: TEAL }), []);
  const visorMaterial = useMemo(() => createFlatMaterial({ color: MINT }), []);
  const antennaMaterial = useMemo(() => createFlatMaterial({ color: MINT }), []);
  const eyeMaterial = useMemo(() => createUnlitMaterial(MINT), []);

  // Persistent Color instances — mutated in place every frame rather than
  // reallocated, so the animation loop generates no per-frame garbage.
  const bodyBaseColor = useMemo(() => new THREE.Color(TEAL), []);
  const criticalDark = useMemo(() => new THREE.Color(RED_DARK), []);
  const criticalLight = useMemo(() => new THREE.Color(RED_LIGHT), []);
  const flashMint = useMemo(() => new THREE.Color(MINT), []);
  const eyeCyan = useMemo(() => new THREE.Color(MINT), []);
  const workingColor = useMemo(() => new THREE.Color(), []);
  const workingColor2 = useMemo(() => new THREE.Color(), []);

  useImperativeHandle(
    ref,
    () => ({
      playDamage: () => {
        effectRef.current = { type: 'damage', startedAt: performance.now() / 1000 };
      },
      playVictory: () => {
        effectRef.current = { type: 'victory', startedAt: performance.now() / 1000 };
      },
    }),
    [],
  );

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const t = performance.now() / 1000;

    // Idle: gentle hover bob + slow spin — the base motion under everything else.
    group.position.set(position[0], position[1] + Math.sin(t * 1.2) * 0.08, position[2]);
    group.rotation.y += delta * 0.25;

    // Blink scheduling — a quick sinusoidal close/open, then a randomized wait.
    if (t >= nextBlinkAtRef.current) {
      blinkStartRef.current = t;
      nextBlinkAtRef.current = t + randomBlinkInterval();
    }
    const blinkElapsed = t - blinkStartRef.current;
    const blinkPhase =
      blinkElapsed >= 0 && blinkElapsed < BLINK_DURATION
        ? Math.sin((blinkElapsed / BLINK_DURATION) * Math.PI)
        : 0;
    const eyeScaleY = 1 - blinkPhase * 0.92;
    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = eyeScaleY;
    if (eyeRightRef.current) eyeRightRef.current.scale.y = eyeScaleY;

    // Resolve the active one-shot effect (damage or victory), if any.
    const effect = effectRef.current;
    let shake: [number, number, number] = [0, 0, 0];
    let flashAmount = 0;
    let isVictoryFlash = false;

    if (effect) {
      const elapsed = t - effect.startedAt;
      const duration = effect.type === 'damage' ? DAMAGE_DURATION : VICTORY_DURATION;
      if (elapsed > duration) {
        effectRef.current = null;
      } else {
        const progress = elapsed / duration;
        if (effect.type === 'damage') {
          const decay = 1 - progress;
          shake = shakeOffset(elapsed, 0.07 * decay);
          flashAmount = decay;
        } else {
          const spinBoost = (1 - progress) * 5;
          group.rotation.y += spinBoost * delta;
          group.position.y += Math.abs(Math.sin(progress * Math.PI * 3)) * 0.3 * (1 - progress);
          flashAmount = Math.max(0, Math.sin(progress * Math.PI * 6)) * (1 - progress);
          isVictoryFlash = true;
        }
      }
    }

    if (bodyRef.current) bodyRef.current.position.set(...shake);

    // Continuous critical alarm pulse (health-driven), with the one-shot
    // damage/victory flash layered on top.
    const isCritical = health <= criticalThreshold;
    workingColor.copy(bodyBaseColor);
    if (isCritical) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      workingColor.copy(criticalDark).lerp(criticalLight, pulse);
    }
    if (flashAmount > 0) {
      const flashTarget = isVictoryFlash ? flashMint : criticalLight;
      workingColor2.copy(workingColor).lerp(flashTarget, flashAmount);
      workingColor.copy(workingColor2);
    }
    bodyMaterial.color.copy(workingColor);

    const eyeTarget = isCritical ? criticalLight : isVictoryFlash && flashAmount > 0 ? flashMint : eyeCyan;
    eyeMaterial.color.copy(eyeTarget);
  });

  return (
    <group ref={groupRef} scale={scale}>
      <mesh ref={bodyRef} geometry={bodyGeometry} material={bodyMaterial} />
      <mesh geometry={visorGeometry} material={visorMaterial} position={[0, 0.08, 0]} />
      <mesh geometry={antennaGeometry} material={antennaMaterial} position={[0, 1.1, 0]} />
      <mesh ref={eyeLeftRef} geometry={eyeGeometry} material={eyeMaterial} position={[-0.32, 0.15, 0.78]} />
      <mesh ref={eyeRightRef} geometry={eyeGeometry} material={eyeMaterial} position={[0.32, 0.15, 0.78]} />
    </group>
  );
});

AICore.displayName = 'AICore';
