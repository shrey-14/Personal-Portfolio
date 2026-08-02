import * as THREE from 'three';

/** Full-screen CRT shader: horizontal scanlines locked to the fixed virtual
 *  resolution, an aperture-grille phosphor mask, a vignette, a subtle
 *  curvature warp, and a faint flicker. Deliberately excludes anything that
 *  would read as a "modern" post effect — no bloom, no blur/DOF, no color
 *  grading LUT, no chromatic aberration. The curved-UV sample outside [0,1]
 *  is clipped to solid black rather than resampled/blurred at the edge. */
export const CRTShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uResolution: { value: new THREE.Vector2(320, 240) },
    uTime: { value: 0 },
    uScanlineIntensity: { value: 0.14 },
    uVignetteStrength: { value: 0.28 },
    uCurvature: { value: 0.025 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uScanlineIntensity;
    uniform float uVignetteStrength;
    uniform float uCurvature;
    varying vec2 vUv;

    // RenderPass writes its target in linear space (three.js only applies the
    // sRGB output transform when rendering straight to the canvas). This is
    // that same transform, applied here since ShaderPass renders to screen —
    // skipping it made the whole frame read as washed-out/dark, not a CRT look.
    vec3 sRGBTransferOETF(vec3 value) {
      return mix(
        pow(value, vec3(0.41666)) * 1.055 - vec3(0.055),
        value * 12.92,
        vec3(lessThanEqual(value, vec3(0.0031308)))
      );
    }

    vec2 curveUv(vec2 uv) {
      vec2 centered = uv * 2.0 - 1.0;
      vec2 offset = centered.yx * centered.yx * uCurvature;
      centered += centered * offset;
      return centered * 0.5 + 0.5;
    }

    void main() {
      vec2 uv = curveUv(vUv);

      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      vec3 color = texture2D(tDiffuse, uv).rgb;

      float scanline = sin(uv.y * uResolution.y * 3.14159265);
      color -= uScanlineIntensity * (0.5 + 0.5 * scanline) * 0.5;

      float mask = mod(gl_FragCoord.x, 3.0);
      vec3 phosphor = vec3(1.0);
      if (mask < 1.0) phosphor = vec3(1.08, 0.92, 0.92);
      else if (mask < 2.0) phosphor = vec3(0.92, 1.08, 0.92);
      else phosphor = vec3(0.92, 0.92, 1.08);
      color *= mix(vec3(1.0), phosphor, 0.4);

      vec2 centered = vUv - 0.5;
      float vignette = 1.0 - dot(centered, centered) * uVignetteStrength * 2.0;
      color *= clamp(vignette, 0.0, 1.0);

      color *= 1.0 - 0.02 * sin(uTime * 60.0);

      // Scanline subtraction can push near-black pixels below 0; pow() on a
      // negative base is undefined, so clamp before the OETF.
      color = max(color, vec3(0.0));

      gl_FragColor = vec4(sRGBTransferOETF(color), 1.0);
    }
  `,
};
