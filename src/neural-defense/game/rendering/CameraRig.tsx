import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { OrthographicCamera, PerspectiveCamera } from 'three';

export type CameraMode = 'perspective' | 'orthographic';

interface CameraRigProps {
  mode?: CameraMode;
  position?: [number, number, number];
  lookAt?: [number, number, number];
  /** Perspective only. Kept low — a wide modern FOV reads as a fish-eyed
   *  "cinematic" lens; late-90s PC games sat closer to 45-60. */
  fov?: number;
  /** Orthographic only — world-space vertical extent the camera frames. */
  viewSize?: number;
  near?: number;
  far?: number;
}

/** Owns and installs the active scene camera. Rather than mutate R3F's
 *  auto-created default camera, this rig constructs its own — a true
 *  THREE.OrthographicCamera for `mode="orthographic"`, or a low-FOV
 *  THREE.PerspectiveCamera (a "pseudo-perspective" read: minimal lens
 *  distortion, close to flat) otherwise — and installs it via useThree's
 *  store. Rebuilds on mode change; re-frames on resize/prop change. */
export function CameraRig({
  mode = 'perspective',
  position = [0, 1.6, 6],
  lookAt = [0, 0.5, 0],
  fov = 50,
  viewSize = 8,
  near = 0.1,
  far = 100,
}: CameraRigProps) {
  const size = useThree((state) => state.size);
  const setState = useThree((state) => state.set);

  const camera = useMemo(
    () => (mode === 'orthographic' ? new OrthographicCamera() : new PerspectiveCamera()),
    [mode],
  );

  useEffect(() => {
    const aspect = size.width / size.height || 1;

    if (camera instanceof OrthographicCamera) {
      const halfHeight = viewSize / 2;
      const halfWidth = halfHeight * aspect;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
    } else {
      camera.aspect = aspect;
      camera.fov = fov;
    }

    camera.near = near;
    camera.far = far;
    camera.position.set(...position);
    camera.lookAt(...lookAt);
    camera.updateProjectionMatrix();
    setState({ camera });
  }, [camera, size, viewSize, fov, near, far, position, lookAt, setState]);

  return null;
}
