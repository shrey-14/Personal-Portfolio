import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';

interface CameraRigProps {
  position?: [number, number, number];
  lookAt?: [number, number, number];
  fov?: number;
}

/** Fixed retro camera rig — no free-look. Position/target/FOV are applied
 *  once and held; later milestones can drive them from gameplay state instead
 *  of adding a second camera system alongside this one. */
export function CameraRig({
  position = [0, 1.6, 6],
  lookAt = [0, 0.5, 0],
  fov = 60,
}: CameraRigProps) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...lookAt);
    if ('fov' in camera) {
      (camera as PerspectiveCamera).fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, position, lookAt, fov]);

  return null;
}
