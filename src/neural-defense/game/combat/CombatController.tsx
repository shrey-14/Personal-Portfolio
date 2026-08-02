import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameEngine, useGameState } from '../core/GameEngineContext';
import { GameState } from '../core/GameState';
import type { EnemyBase } from '../entities/enemies';
import { ImpactBurst } from './ImpactBurst';
import { ProjectileView } from './ProjectileView';
import { Reticle } from './Reticle';
import { nearestEnemyToPointer, pointerEventToNdc } from './targeting';
import { FIRE_COOLDOWN_SECONDS, HOVER_NDC_RADIUS, PROJECTILE_DAMAGE } from './types';
import { useCombatState } from './useCombatState';

export interface CombatControllerProps {
  enemies: EnemyBase[];
  corePosition: THREE.Vector3;
}

interface ProjectileEntry {
  id: string;
  origin: THREE.Vector3;
  target: EnemyBase;
}

interface BurstEntry {
  id: string;
  position: THREE.Vector3;
  muzzle: boolean;
}

/** Combat orchestrator — lives inside <Canvas> alongside the enemies it
 *  targets. Mouse and touch share one set of pointer handlers (Pointer
 *  Events already unify them): pointerdown locks the nearest enemy,
 *  pointerup fires — "hold to lock, release to fire" for touch, and for
 *  mouse the same click-hold gesture, plus a hover-only reticle from
 *  pointermove when no button is down (touch has no hover phase, so that
 *  branch is gated to pointerType==='mouse'). Keyboard cycles targets with
 *  Tab/arrows and fires with Enter/F via the shared InputManager. Fire
 *  cooldown + the segmented energy meter live in GameEngine.combat so the
 *  HTML HUD outside the Canvas can read the same state this writes. */
export function CombatController({ enemies, corePosition }: CombatControllerProps) {
  const engine = useGameEngine();
  const gameState = useGameState();
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const [projectiles, setProjectiles] = useState<ProjectileEntry[]>([]);
  const [bursts, setBursts] = useState<BurstEntry[]>([]);
  const nextIdRef = useRef(0);

  const fireOrigin = useMemo(() => corePosition.clone().add(new THREE.Vector3(0, 0.3, 0)), [corePosition]);

  const spawnBurst = useCallback((position: THREE.Vector3, muzzle: boolean) => {
    const id = `b${nextIdRef.current++}`;
    setBursts((prev) => [...prev, { id, position: position.clone(), muzzle }]);
  }, []);

  const removeBurst = useCallback((id: string) => {
    setBursts((prev) => prev.filter((burst) => burst.id !== id));
  }, []);

  const handleImpact = useCallback(
    (projectileId: string, target: EnemyBase, position: THREE.Vector3) => {
      setProjectiles((prev) => prev.filter((p) => p.id !== projectileId));
      target.takeDamage(PROJECTILE_DAMAGE);
      engine.audio.playBeep(220, 0.07, 'square');
      spawnBurst(position, false);
      if (!target.alive && engine.combat.getState().lockedTargetId === target.id) {
        engine.combat.setLocked(null);
      }
    },
    [engine, spawnBurst],
  );

  const spawnProjectile = useCallback(
    (target: EnemyBase) => {
      const id = `p${nextIdRef.current++}`;
      setProjectiles((prev) => [...prev, { id, origin: fireOrigin.clone(), target }]);
      spawnBurst(fireOrigin, true);
    },
    [fireOrigin, spawnBurst],
  );

  const attemptFire = useCallback(() => {
    if (gameStateRef.current !== GameState.Playing) return;
    const combat = engine.combat.getState();
    const target = enemies.find((enemy) => enemy.id === combat.lockedTargetId && enemy.alive);
    if (!target) {
      engine.audio.playBeep(140, 0.09, 'sawtooth');
      return;
    }
    if (!engine.combat.tryConsumeEnergy()) {
      engine.audio.playBeep(140, 0.09, 'sawtooth');
      return;
    }
    engine.audio.playSweep(1100, 300, 0.12, 'square');
    spawnProjectile(target);
  }, [engine, enemies, spawnProjectile]);

  const cycleTarget = useCallback(
    (direction: 1 | -1) => {
      if (gameStateRef.current !== GameState.Playing) return;
      const alive = enemies.filter((enemy) => enemy.alive).sort((a, b) => a.id.localeCompare(b.id));
      if (alive.length === 0) {
        engine.combat.setLocked(null);
        return;
      }
      const currentId = engine.combat.getState().lockedTargetId;
      const currentIndex = alive.findIndex((enemy) => enemy.id === currentId);
      const nextIndex =
        currentIndex === -1
          ? direction === 1
            ? 0
            : alive.length - 1
          : (currentIndex + direction + alive.length) % alive.length;
      engine.combat.setHovered(null);
      engine.combat.setLocked(alive[nextIndex].id);
      engine.audio.playBeep(500, 0.03, 'square');
    },
    [engine, enemies],
  );

  // Keyboard: Tab/arrows cycle, Enter/F fires.
  useEffect(() => {
    return engine.input.onKeyDown((event) => {
      if (gameStateRef.current !== GameState.Playing) return;
      const { code } = event;
      const isCombatKey =
        code === 'Tab' ||
        code === 'ArrowRight' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowUp' ||
        code === 'Enter' ||
        code === 'KeyF';
      if (!isCombatKey) return;
      // Tab would otherwise shift DOM focus onto the next focusable element
      // (e.g. a dev-panel button) and Enter would then natively "click" it —
      // these keys are ours alone while playing.
      event.preventDefault();
      if (code === 'Tab' || code === 'ArrowRight' || code === 'ArrowDown') cycleTarget(1);
      else if (code === 'ArrowLeft' || code === 'ArrowUp') cycleTarget(-1);
      else if (code === 'Enter' || code === 'KeyF') attemptFire();
    });
  }, [engine, cycleTarget, attemptFire]);

  // Mouse + touch via unified Pointer Events.
  useEffect(() => {
    const dom = gl.domElement;
    let activePointerId: number | null = null;

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return; // touch has no hover phase
      if (activePointerId !== null || gameStateRef.current !== GameState.Playing) return;
      const ndc = pointerEventToNdc(event, dom);
      const nearest = nearestEnemyToPointer(ndc, enemies, camera, HOVER_NDC_RADIUS);
      engine.combat.setHovered(nearest?.id ?? null);
    };

    const handleDown = (event: PointerEvent) => {
      if (gameStateRef.current !== GameState.Playing) return;
      activePointerId = event.pointerId;
      const ndc = pointerEventToNdc(event, dom);
      const nearest = nearestEnemyToPointer(ndc, enemies, camera, HOVER_NDC_RADIUS);
      engine.combat.setHovered(null);
      if (nearest) {
        engine.combat.setLocked(nearest.id);
        engine.audio.playBeep(720, 0.05, 'square');
      }
    };

    const handleUp = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      activePointerId = null;
      attemptFire();
    };

    dom.addEventListener('pointermove', handleMove);
    dom.addEventListener('pointerdown', handleDown);
    dom.addEventListener('pointerup', handleUp);
    dom.addEventListener('pointerleave', handleUp);
    dom.addEventListener('pointercancel', handleUp);
    return () => {
      dom.removeEventListener('pointermove', handleMove);
      dom.removeEventListener('pointerdown', handleDown);
      dom.removeEventListener('pointerup', handleUp);
      dom.removeEventListener('pointerleave', handleUp);
      dom.removeEventListener('pointercancel', handleUp);
    };
  }, [gl, camera, enemies, engine, attemptFire]);

  // Energy regeneration — also the fire cooldown, since firing costs energy.
  useFrame((_state, delta) => {
    if (gameStateRef.current !== GameState.Playing) return;
    engine.combat.regenTick(delta, 1 / FIRE_COOLDOWN_SECONDS);
  });

  const combat = useCombatState();
  const lockedEnemy = enemies.find((enemy) => enemy.id === combat.lockedTargetId && enemy.alive) ?? null;
  const hoveredEnemy = lockedEnemy
    ? null
    : enemies.find((enemy) => enemy.id === combat.hoveredTargetId && enemy.alive) ?? null;
  const reticleTarget = lockedEnemy ?? hoveredEnemy;

  if (gameState !== GameState.Playing) return null;

  return (
    <>
      {reticleTarget && <Reticle target={reticleTarget} locked={!!lockedEnemy} />}
      {projectiles.map((entry) => (
        <ProjectileView
          key={entry.id}
          origin={entry.origin}
          target={entry.target}
          onImpact={(position) => handleImpact(entry.id, entry.target, position)}
        />
      ))}
      {bursts.map((entry) => (
        <ImpactBurst
          key={entry.id}
          position={entry.position}
          maxScale={entry.muzzle ? 0.6 : 1}
          duration={entry.muzzle ? 0.15 : 0.28}
          onDone={() => removeBurst(entry.id)}
        />
      ))}
    </>
  );
}
