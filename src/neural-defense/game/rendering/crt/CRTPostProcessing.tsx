import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CRTShader } from './CRTShader';

export interface CRTPostProcessingProps {
  enabled?: boolean;
  scanlineIntensity?: number;
  vignetteStrength?: number;
  curvature?: number;
}

/** Full-screen CRT post-process layer. Takes over rendering from R3F (via a
 *  priority-1 useFrame) so the scene renders through EffectComposer instead
 *  of the default renderer.render() call. Must be the last child of <Canvas>
 *  so everything else has already been added to the scene when it mounts. */
export function CRTPostProcessing({
  enabled = true,
  scanlineIntensity = 0.18,
  vignetteStrength = 0.35,
  curvature = 0.035,
}: CRTPostProcessingProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const elapsedRef = useRef(0);

  const composer = useMemo(() => {
    const instance = new EffectComposer(gl);
    instance.addPass(new RenderPass(scene, camera));
    const shaderPass = new ShaderPass(CRTShader);
    shaderPass.renderToScreen = true;
    instance.addPass(shaderPass);
    return instance;
  }, [gl]); // eslint-disable-line react-hooks/exhaustive-deps -- scene/camera passed once; RenderPass tracks live refs internally

  useEffect(() => () => composer.dispose(), [composer]);

  useEffect(() => {
    const renderPass = composer.passes[0] as RenderPass;
    renderPass.scene = scene;
    renderPass.camera = camera;
  }, [composer, scene, camera]);

  useEffect(() => {
    const pixelRatio = gl.getPixelRatio();
    composer.setSize(size.width, size.height);
    const shaderPass = composer.passes[1] as ShaderPass;
    shaderPass.uniforms.uResolution.value.set(size.width * pixelRatio, size.height * pixelRatio);
  }, [composer, size, gl]);

  useEffect(() => {
    const shaderPass = composer.passes[1] as ShaderPass;
    shaderPass.uniforms.uScanlineIntensity.value = scanlineIntensity;
    shaderPass.uniforms.uVignetteStrength.value = vignetteStrength;
    shaderPass.uniforms.uCurvature.value = curvature;
  }, [composer, scanlineIntensity, vignetteStrength, curvature]);

  useFrame((state, delta) => {
    if (!enabled) {
      state.gl.render(state.scene, state.camera);
      return;
    }
    elapsedRef.current += delta;
    const shaderPass = composer.passes[1] as ShaderPass;
    shaderPass.uniforms.uTime.value = elapsedRef.current;
    composer.render(delta);
  }, 1);

  return null;
}
